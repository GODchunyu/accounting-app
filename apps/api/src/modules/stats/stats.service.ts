import type { BillType } from "@accounting-app/shared";
import { AppError } from "../../errors/AppError.js";
import type { BookRepository } from "../books/repositories/bookRepository.js";
import type { CategoryRepository } from "../categories/repositories/categoryRepository.js";
import type { BillRepository } from "../bills/repositories/billRepository.js";

const billTypes = new Set<BillType>(["expense", "income"]);
const monthPattern = /^\d{4}-\d{2}$/;

export interface StatsQuery {
  userId: string;
  bookId: string;
  month: string;
  type?: BillType;
}

export class StatsService {
  constructor(
    private readonly billRepository: BillRepository,
    private readonly bookRepository: BookRepository,
    private readonly categoryRepository: CategoryRepository
  ) {}

  async getMonthlyStats(query: StatsQuery) {
    await this.validateQuery(query);
    const bills = await this.billRepository.listBills({
      userId: query.userId,
      bookId: query.bookId,
      month: query.month
    });
    const incomeCents = sumCents(bills.filter((bill) => bill.type === "income").map((bill) => bill.amount));
    const expenseCents = sumCents(bills.filter((bill) => bill.type === "expense").map((bill) => bill.amount));
    const daysInMonth = getDaysInMonth(query.month);
    const trend = Array.from({ length: daysInMonth }, (_, index) => {
      const day = String(index + 1).padStart(2, "0");
      const date = `${query.month}-${day}`;
      const dayBills = bills.filter((bill) => bill.happenedAt.toISOString().slice(0, 10) === date);

      return {
        date,
        income: formatCents(sumCents(dayBills.filter((bill) => bill.type === "income").map((bill) => bill.amount))),
        expense: formatCents(sumCents(dayBills.filter((bill) => bill.type === "expense").map((bill) => bill.amount)))
      };
    });

    return {
      income: formatCents(incomeCents),
      expense: formatCents(expenseCents),
      balance: formatCents(incomeCents - expenseCents),
      averageDailyIncome: formatCents(Math.round(incomeCents / daysInMonth)),
      averageDailyExpense: formatCents(Math.round(expenseCents / daysInMonth)),
      trend
    };
  }

  async getCategoryStats(query: StatsQuery & { type: BillType }) {
    await this.validateQuery(query);
    if (!billTypes.has(query.type)) {
      throw new AppError("Invalid bill type", 400);
    }

    const bills = await this.billRepository.listBills({
      userId: query.userId,
      bookId: query.bookId,
      month: query.month,
      type: query.type
    });
    const categories = await this.categoryRepository.listCategoriesByUserId(query.userId, query.type);
    const totalCents = sumCents(bills.map((bill) => bill.amount));
    const categoryById = new Map(categories.map((category) => [category.id, category]));
    const grouped = new Map<string, number>();

    for (const bill of bills) {
      grouped.set(bill.categoryId, (grouped.get(bill.categoryId) ?? 0) + amountToCents(bill.amount));
    }

    return [...grouped.entries()]
      .map(([categoryId, amountCents]) => {
        const category = categoryById.get(categoryId);

        return {
          categoryId,
          categoryName: category?.name ?? "Unknown",
          icon: category?.icon ?? "custom",
          amount: formatCents(amountCents),
          percent: totalCents === 0 ? 0 : Math.round((amountCents / totalCents) * 10000) / 100
        };
      })
      .sort((left, right) => amountToCents(right.amount) - amountToCents(left.amount));
  }

  private async validateQuery(query: StatsQuery) {
    if (!monthPattern.test(query.month)) {
      throw new AppError("Month must use YYYY-MM format", 400);
    }

    const book = await this.bookRepository.findBookById(query.bookId);
    if (!book || book.userId !== query.userId) {
      throw new AppError("Book not found", 404);
    }
  }
}

function amountToCents(amount: string) {
  const [yuan = "0", cents = "0"] = amount.split(".");
  return Number(yuan) * 100 + Number(cents.padEnd(2, "0").slice(0, 2));
}

function sumCents(amounts: string[]) {
  return amounts.reduce((total, amount) => total + amountToCents(amount), 0);
}

function formatCents(cents: number) {
  const sign = cents < 0 ? "-" : "";
  const absolute = Math.abs(cents);
  return `${sign}${Math.floor(absolute / 100)}.${String(absolute % 100).padStart(2, "0")}`;
}

function getDaysInMonth(month: string) {
  const [yearText, monthText] = month.split("-");
  return new Date(Date.UTC(Number(yearText), Number(monthText), 0)).getUTCDate();
}
