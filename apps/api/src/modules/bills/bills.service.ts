import type { BillType } from "@accounting-app/shared";
import { AppError } from "../../errors/AppError.js";
import type { BookRepository } from "../books/repositories/bookRepository.js";
import type { CategoryRepository } from "../categories/repositories/categoryRepository.js";
import type { ImageStorage } from "../uploads/imageStorage.js";
import type {
  BillQuery,
  BillRecord,
  BillRepository,
} from "./repositories/billRepository.js";

const billTypes = new Set<BillType>(["expense", "income"]);
const amountPattern = /^(?:0|[1-9]\d*)(?:\.\d{1,2})?$/;
const monthPattern = /^\d{4}-\d{2}$/;

export interface BillInput {
  userId: string;
  bookId: string;
  categoryId: string;
  type: BillType;
  amount: string;
  remark?: string | null;
  imageUrl?: string | null;
  happenedAt: string | Date;
}

export interface UpdateBillInput {
  userId: string;
  billId: string;
  bookId?: string;
  categoryId?: string;
  type?: BillType;
  amount?: string;
  remark?: string | null;
  imageUrl?: string | null;
  happenedAt?: string | Date;
}

export class BillsService {
  constructor(
    private readonly billRepository: BillRepository,
    private readonly bookRepository: BookRepository,
    private readonly categoryRepository: CategoryRepository,
    private readonly imageStorage?: Pick<ImageStorage, "deleteByUrl">,
  ) {}

  async listBills(query: BillQuery): Promise<BillRecord[]> {
    if (query.type && !billTypes.has(query.type)) {
      throw new AppError("Invalid bill type", 400);
    }

    if (query.month && !monthPattern.test(query.month)) {
      throw new AppError("Month must use YYYY-MM format", 400);
    }

    if (query.bookId) {
      await this.assertOwnBook(query.userId, query.bookId);
    }

    if (query.categoryId) {
      await this.assertOwnCategory(query.userId, query.categoryId);
    }

    return this.billRepository.listBills(query);
  }

  async getBill(userId: string, billId: string): Promise<BillRecord> {
    const bill = await this.billRepository.findBillById(billId);
    if (!bill || bill.userId !== userId) {
      throw new AppError("Bill not found", 404);
    }

    return bill;
  }

  async createBill(input: BillInput): Promise<BillRecord> {
    await this.assertBillRelations({
      userId: input.userId,
      bookId: input.bookId,
      categoryId: input.categoryId,
      type: input.type,
    });

    return this.billRepository.createBill({
      userId: input.userId,
      bookId: input.bookId,
      categoryId: input.categoryId,
      type: input.type,
      amount: this.normalizeAmount(input.amount),
      remark: this.normalizeRemark(input.remark),
      imageUrl: this.normalizeOptionalString(input.imageUrl),
      happenedAt: this.normalizeDate(input.happenedAt),
    });
  }

  async updateBill(input: UpdateBillInput): Promise<BillRecord> {
    const existing = await this.getBill(input.userId, input.billId);
    const next = {
      bookId: input.bookId ?? existing.bookId,
      categoryId: input.categoryId ?? existing.categoryId,
      type: input.type ?? existing.type,
    };

    await this.assertBillRelations({
      userId: input.userId,
      bookId: next.bookId,
      categoryId: next.categoryId,
      type: next.type,
    });

    const updated = await this.billRepository.updateBill({
      billId: input.billId,
      bookId: input.bookId,
      categoryId: input.categoryId,
      type: input.type,
      amount:
        input.amount === undefined
          ? undefined
          : this.normalizeAmount(input.amount),
      remark:
        input.remark === undefined
          ? undefined
          : this.normalizeRemark(input.remark),
      imageUrl:
        input.imageUrl === undefined
          ? undefined
          : this.normalizeOptionalString(input.imageUrl),
      happenedAt:
        input.happenedAt === undefined
          ? undefined
          : this.normalizeDate(input.happenedAt),
    });

    const nextImageUrl =
      input.imageUrl === undefined ? existing.imageUrl : updated.imageUrl;
    if (existing.imageUrl && existing.imageUrl !== nextImageUrl) {
      await this.imageStorage?.deleteByUrl(existing.imageUrl);
    }

    return updated;
  }

  async deleteBill(userId: string, billId: string): Promise<void> {
    const bill = await this.getBill(userId, billId);
    await this.billRepository.deleteBill(billId);
    await this.imageStorage?.deleteByUrl(bill.imageUrl);
  }

  private async assertBillRelations(input: {
    userId: string;
    bookId: string;
    categoryId: string;
    type: BillType;
  }) {
    if (!billTypes.has(input.type)) {
      throw new AppError("Invalid bill type", 400);
    }

    await this.assertOwnBook(input.userId, input.bookId);
    const category = await this.assertOwnCategory(
      input.userId,
      input.categoryId,
    );
    if (category.type !== input.type) {
      throw new AppError("Bill type must match category type", 400);
    }
  }

  private async assertOwnBook(userId: string, bookId: string) {
    const book = await this.bookRepository.findBookById(bookId);
    if (!book || book.userId !== userId) {
      throw new AppError("Book not found", 404);
    }
  }

  private async assertOwnCategory(userId: string, categoryId: string) {
    const category = await this.categoryRepository.findCategoryById(categoryId);
    if (!category || category.userId !== userId) {
      throw new AppError("Category not found", 404);
    }

    return category;
  }

  private normalizeAmount(amount: string) {
    const normalized = amount.trim();
    if (!amountPattern.test(normalized) || Number(normalized) <= 0) {
      throw new AppError(
        "Amount must be greater than 0 with up to 2 decimal places",
        400,
      );
    }

    return Number(normalized).toFixed(2);
  }

  private normalizeRemark(remark?: string | null) {
    const normalized = remark?.trim() ?? "";
    return normalized ? normalized : null;
  }

  private normalizeOptionalString(value?: string | null) {
    const normalized = value?.trim() ?? "";
    return normalized ? normalized : null;
  }

  private normalizeDate(value: string | Date) {
    const date = value instanceof Date ? value : new Date(value);
    if (Number.isNaN(date.getTime())) {
      throw new AppError("Invalid bill date", 400);
    }

    return date;
  }
}
