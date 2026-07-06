import type { BookRecord } from "../../auth/auth.types.js";

export interface BookRepository {
  listBooksByUserId(userId: string): Promise<BookRecord[]>;
  findBookById(bookId: string): Promise<BookRecord | null>;
  listBillImageUrlsByBookId(bookId: string): Promise<string[]>;
  createBook(input: { userId: string; name: string }): Promise<BookRecord>;
  renameBook(input: { bookId: string; name: string }): Promise<BookRecord>;
  deleteBook(bookId: string): Promise<void>;
}
