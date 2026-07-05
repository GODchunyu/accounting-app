import type { DefaultCategory } from "@accounting-app/shared";
import type { BookRecord, CategoryRecord, PublicUser, UserWithPassword } from "../auth.types.js";
import type { AuthRepository, AuthRepositoryInspection } from "./authRepository.js";
import type { BookRepository } from "../../books/repositories/bookRepository.js";

function now() {
  return new Date();
}

function createId(prefix: string) {
  return `${prefix}_${Math.random().toString(36).slice(2, 10)}`;
}

export class InMemoryAuthRepository implements AuthRepository, AuthRepositoryInspection, BookRepository {
  private readonly users = new Map<string, UserWithPassword>();
  private readonly books: BookRecord[] = [];
  private readonly categories: CategoryRecord[] = [];

  async findUserByUsername(username: string) {
    return [...this.users.values()].find((user) => user.username === username) ?? null;
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
      updatedAt: timestamp
    };

    this.users.set(user.id, user);

    this.books.push({
      id: createId("book"),
      userId: user.id,
      name: input.defaultBookName,
      isDefault: true,
      createdAt: timestamp,
      updatedAt: timestamp
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
        updatedAt: timestamp
      }))
    );

    return this.toPublicUser(user);
  }

  async listBooksByUserId(userId: string) {
    return this.books.filter((book) => book.userId === userId).sort((left, right) => left.createdAt.getTime() - right.createdAt.getTime());
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
      updatedAt: timestamp
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

  async listCategoriesByUserId(userId: string) {
    return this.categories.filter((category) => category.userId === userId);
  }

  private toPublicUser(user: UserWithPassword): PublicUser {
    const { passwordHash: _passwordHash, ...publicUser } = user;
    void _passwordHash;
    return publicUser;
  }
}
