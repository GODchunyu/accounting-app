import type { BillType, DefaultCategory } from "@accounting-app/shared";
import type {
  BookRecord,
  CategoryRecord,
  PublicUser,
  UserWithPassword,
} from "../auth.types.js";
import type {
  AuthRepository,
  AuthRepositoryInspection,
} from "./authRepository.js";
import type {
  BillQuery,
  BillRecord,
  BillRepository,
} from "../../bills/repositories/billRepository.js";
import type { BookRepository } from "../../books/repositories/bookRepository.js";
import type { CategoryRepository } from "../../categories/repositories/categoryRepository.js";

function now() {
  return new Date();
}

function createId(prefix: string) {
  return `${prefix}_${Math.random().toString(36).slice(2, 10)}`;
}

export class InMemoryAuthRepository
  implements
    AuthRepository,
    AuthRepositoryInspection,
    BookRepository,
    CategoryRepository,
    BillRepository
{
  private readonly users = new Map<string, UserWithPassword>();
  private readonly books: BookRecord[] = [];
  private readonly categories: CategoryRecord[] = [];
  private readonly bills: BillRecord[] = [];
  private readonly usedCategoryIds = new Set<string>();

  async findUserByUsername(username: string) {
    return (
      [...this.users.values()].find((user) => user.username === username) ??
      null
    );
  }

  async findUserById(userId: string) {
    const user = this.users.get(userId);
    if (!user) {
      return null;
    }

    return this.toPublicUser(user);
  }

  async createUserWithDefaults(input: {
    username: string;
    passwordHash: string;
    nickname: string;
    defaultBookName: string;
    categories: readonly DefaultCategory[];
  }) {
    const timestamp = now();
    const user: UserWithPassword = {
      id: createId("user"),
      username: input.username,
      passwordHash: input.passwordHash,
      nickname: input.nickname,
      avatarUrl: null,
      createdAt: timestamp,
      updatedAt: timestamp,
    };

    this.users.set(user.id, user);

    this.books.push({
      id: createId("book"),
      userId: user.id,
      name: input.defaultBookName,
      isDefault: true,
      createdAt: timestamp,
      updatedAt: timestamp,
    });

    this.categories.push(
      ...input.categories.map((category) => ({
        id: createId("category"),
        userId: user.id,
        type: category.type,
        name: category.name,
        icon: category.icon,
        sort: category.sort,
        isDefault: true,
        isActive: true,
        createdAt: timestamp,
        updatedAt: timestamp,
      })),
    );

    return this.toPublicUser(user);
  }

  async listBooksByUserId(userId: string) {
    return this.books
      .filter((book) => book.userId === userId)
      .sort(
        (left, right) => left.createdAt.getTime() - right.createdAt.getTime(),
      );
  }

  async findBookById(bookId: string) {
    return this.books.find((book) => book.id === bookId) ?? null;
  }

  async createBook(input: { userId: string; name: string }) {
    const timestamp = now();
    const book: BookRecord = {
      id: createId("book"),
      userId: input.userId,
      name: input.name,
      isDefault: false,
      createdAt: timestamp,
      updatedAt: timestamp,
    };

    this.books.push(book);

    return book;
  }

  async renameBook(input: { bookId: string; name: string }) {
    const book = this.books.find((item) => item.id === input.bookId);
    if (!book) {
      throw new Error("Book not found");
    }

    book.name = input.name;
    book.updatedAt = now();

    return book;
  }

  async deleteBook(bookId: string) {
    const index = this.books.findIndex((book) => book.id === bookId);
    if (index >= 0) {
      this.books.splice(index, 1);
    }
  }

  async listCategoriesByUserId(userId: string, type?: BillType) {
    return this.categories
      .filter(
        (category) =>
          category.userId === userId && (!type || category.type === type),
      )
      .sort((left, right) => left.sort - right.sort);
  }

  async findCategoryById(categoryId: string) {
    return (
      this.categories.find((category) => category.id === categoryId) ?? null
    );
  }

  async createCategory(input: {
    userId: string;
    type: BillType;
    name: string;
    icon: string;
    sort: number;
  }) {
    const timestamp = now();
    const category: CategoryRecord = {
      id: createId("category"),
      userId: input.userId,
      type: input.type,
      name: input.name,
      icon: input.icon,
      sort: input.sort,
      isDefault: false,
      isActive: true,
      createdAt: timestamp,
      updatedAt: timestamp,
    };

    this.categories.push(category);

    return category;
  }

  async updateCategory(input: {
    categoryId: string;
    name?: string;
    icon?: string;
    sort?: number;
    isActive?: boolean;
  }) {
    const category = this.categories.find(
      (item) => item.id === input.categoryId,
    );
    if (!category) {
      throw new Error("Category not found");
    }

    category.name = input.name ?? category.name;
    category.icon = input.icon ?? category.icon;
    category.sort = input.sort ?? category.sort;
    category.isActive = input.isActive ?? category.isActive;
    category.updatedAt = now();

    return category;
  }

  async deleteCategory(categoryId: string) {
    const index = this.categories.findIndex(
      (category) => category.id === categoryId,
    );
    if (index >= 0) {
      this.categories.splice(index, 1);
    }
  }

  async categoryHasBills(categoryId: string) {
    return (
      this.usedCategoryIds.has(categoryId) ||
      this.bills.some((bill) => bill.categoryId === categoryId)
    );
  }

  markCategoryAsUsedForTest(categoryId: string) {
    this.usedCategoryIds.add(categoryId);
  }

  async listBills(query: BillQuery) {
    return this.bills
      .filter((bill) => {
        if (bill.userId !== query.userId) {
          return false;
        }
        if (query.bookId && bill.bookId !== query.bookId) {
          return false;
        }
        if (query.type && bill.type !== query.type) {
          return false;
        }
        if (query.categoryId && bill.categoryId !== query.categoryId) {
          return false;
        }
        if (
          query.month &&
          bill.happenedAt.toISOString().slice(0, 7) !== query.month
        ) {
          return false;
        }

        return true;
      })
      .sort(
        (left, right) => right.happenedAt.getTime() - left.happenedAt.getTime(),
      );
  }

  async findBillById(billId: string) {
    return this.bills.find((bill) => bill.id === billId) ?? null;
  }

  async createBill(input: {
    userId: string;
    bookId: string;
    categoryId: string;
    type: BillType;
    amount: string;
    remark: string | null;
    imageUrl: string | null;
    happenedAt: Date;
  }) {
    const timestamp = now();
    const bill: BillRecord = {
      id: createId("bill"),
      userId: input.userId,
      bookId: input.bookId,
      categoryId: input.categoryId,
      type: input.type,
      amount: input.amount,
      remark: input.remark,
      imageUrl: input.imageUrl,
      happenedAt: input.happenedAt,
      createdAt: timestamp,
      updatedAt: timestamp,
    };

    this.bills.push(bill);

    return bill;
  }

  async updateBill(input: {
    billId: string;
    bookId?: string;
    categoryId?: string;
    type?: BillType;
    amount?: string;
    remark?: string | null;
    imageUrl?: string | null;
    happenedAt?: Date;
  }) {
    const bill = this.bills.find((item) => item.id === input.billId);
    if (!bill) {
      throw new Error("Bill not found");
    }

    bill.bookId = input.bookId ?? bill.bookId;
    bill.categoryId = input.categoryId ?? bill.categoryId;
    bill.type = input.type ?? bill.type;
    bill.amount = input.amount ?? bill.amount;
    bill.remark = input.remark === undefined ? bill.remark : input.remark;
    bill.imageUrl =
      input.imageUrl === undefined ? bill.imageUrl : input.imageUrl;
    bill.happenedAt = input.happenedAt ?? bill.happenedAt;
    bill.updatedAt = now();

    return bill;
  }

  async deleteBill(billId: string) {
    const index = this.bills.findIndex((bill) => bill.id === billId);
    if (index >= 0) {
      this.bills.splice(index, 1);
    }
  }

  private toPublicUser(user: UserWithPassword): PublicUser {
    const { passwordHash: _passwordHash, ...publicUser } = user;
    void _passwordHash;
    return publicUser;
  }
}
