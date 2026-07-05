import { Prisma } from "@prisma/client";
import type { BillQuery, BillRepository } from "./billRepository.js";

function serializeBill<T extends { amount: Prisma.Decimal }>(bill: T) {
  return {
    ...bill,
    amount: bill.amount.toFixed(2)
  };
}

function monthRange(month: string) {
  const [yearText, monthText] = month.split("-");
  const year = Number(yearText);
  const monthIndex = Number(monthText) - 1;
  const start = new Date(Date.UTC(year, monthIndex, 1));
  const end = new Date(Date.UTC(year, monthIndex + 1, 1));

  return { start, end };
}

export class PrismaBillRepository implements BillRepository {
  constructor(private readonly prisma: Prisma.TransactionClient) {}

  async listBills(query: BillQuery) {
    const range = query.month ? monthRange(query.month) : undefined;
    const bills = await this.prisma.bill.findMany({
      where: {
        userId: query.userId,
        bookId: query.bookId,
        type: query.type,
        categoryId: query.categoryId,
        happenedAt: range
          ? {
              gte: range.start,
              lt: range.end
            }
          : undefined
      },
      orderBy: { happenedAt: "desc" }
    });

    return bills.map(serializeBill);
  }

  async findBillById(billId: string) {
    const bill = await this.prisma.bill.findUnique({
      where: { id: billId }
    });

    return bill ? serializeBill(bill) : null;
  }

  async createBill(input: {
    userId: string;
    bookId: string;
    categoryId: string;
    type: "expense" | "income";
    amount: string;
    remark: string | null;
    imageUrl: string | null;
    happenedAt: Date;
  }) {
    const bill = await this.prisma.bill.create({
      data: {
        userId: input.userId,
        bookId: input.bookId,
        categoryId: input.categoryId,
        type: input.type,
        amount: new Prisma.Decimal(input.amount),
        remark: input.remark,
        imageUrl: input.imageUrl,
        happenedAt: input.happenedAt
      }
    });

    return serializeBill(bill);
  }

  async updateBill(input: {
    billId: string;
    bookId?: string;
    categoryId?: string;
    type?: "expense" | "income";
    amount?: string;
    remark?: string | null;
    imageUrl?: string | null;
    happenedAt?: Date;
  }) {
    const bill = await this.prisma.bill.update({
      where: { id: input.billId },
      data: {
        bookId: input.bookId,
        categoryId: input.categoryId,
        type: input.type,
        amount: input.amount === undefined ? undefined : new Prisma.Decimal(input.amount),
        remark: input.remark,
        imageUrl: input.imageUrl,
        happenedAt: input.happenedAt
      }
    });

    return serializeBill(bill);
  }

  async deleteBill(billId: string) {
    await this.prisma.bill.delete({
      where: { id: billId }
    });
  }
}
