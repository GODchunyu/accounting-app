import type { BillType } from "@accounting-app/shared";

export interface BillRecord {
  id: string;
  userId: string;
  bookId: string;
  categoryId: string;
  type: BillType;
  amount: string;
  remark: string | null;
  imageUrl: string | null;
  happenedAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface BillQuery {
  userId: string;
  bookId?: string;
  month?: string;
  type?: BillType;
  categoryId?: string;
}

export interface BillRepository {
  listBills(query: BillQuery): Promise<BillRecord[]>;
  findBillById(billId: string): Promise<BillRecord | null>;
  createBill(input: {
    userId: string;
    bookId: string;
    categoryId: string;
    type: BillType;
    amount: string;
    remark: string | null;
    imageUrl: string | null;
    happenedAt: Date;
  }): Promise<BillRecord>;
  updateBill(input: {
    billId: string;
    bookId?: string;
    categoryId?: string;
    type?: BillType;
    amount?: string;
    remark?: string | null;
    imageUrl?: string | null;
    happenedAt?: Date;
  }): Promise<BillRecord>;
  deleteBill(billId: string): Promise<void>;
}
