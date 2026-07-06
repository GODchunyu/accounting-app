import { AppError } from "../../errors/AppError.js";
import type { BookRecord } from "../auth/auth.types.js";
import type { BookRepository } from "./repositories/bookRepository.js";

export interface CreateBookInput {
  userId: string;
  name: string;
}

export interface RenameBookInput {
  userId: string;
  bookId: string;
  name: string;
}

export class BooksService {
  constructor(private readonly repository: BookRepository) {}

  async listBooks(userId: string): Promise<BookRecord[]> {
    return this.repository.listBooksByUserId(userId);
  }

  async createBook(input: CreateBookInput): Promise<BookRecord> {
    return this.repository.createBook({
      userId: input.userId,
      name: this.normalizeName(input.name),
    });
  }

  async renameBook(input: RenameBookInput): Promise<BookRecord> {
    await this.assertOwnBook(input.userId, input.bookId);

    return this.repository.renameBook({
      bookId: input.bookId,
      name: this.normalizeName(input.name),
    });
  }

  async deleteBook(userId: string, bookId: string): Promise<void> {
    await this.assertOwnBook(userId, bookId);

    const books = await this.repository.listBooksByUserId(userId);
    if (books.length <= 1) {
      throw new AppError("Cannot delete the last book", 400);
    }

    await this.repository.deleteBook(bookId);
  }

  private async assertOwnBook(userId: string, bookId: string) {
    const book = await this.repository.findBookById(bookId);
    if (!book || book.userId !== userId) {
      throw new AppError("Book not found", 404);
    }
  }

  private normalizeName(name: string) {
    const normalized = name.trim();
    if (!normalized || normalized.length > 30) {
      throw new AppError("Book name must be 1-30 characters", 400);
    }

    return normalized;
  }
}
