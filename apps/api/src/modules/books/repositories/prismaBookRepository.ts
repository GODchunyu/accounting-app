import type { PrismaClient } from "@prisma/client";
import type { BookRepository } from "./bookRepository.js";

export class PrismaBookRepository implements BookRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async listBooksByUserId(userId: string) {
    return this.prisma.book.findMany({
      where: { userId },
      orderBy: { createdAt: "asc" }
    });
  }

  async findBookById(bookId: string) {
    return this.prisma.book.findUnique({
      where: { id: bookId }
    });
  }

  async createBook(input: { userId: string; name: string }) {
    return this.prisma.book.create({
      data: {
        userId: input.userId,
        name: input.name,
        isDefault: false
      }
    });
  }

  async renameBook(input: { bookId: string; name: string }) {
    return this.prisma.book.update({
      where: { id: input.bookId },
      data: { name: input.name }
    });
  }

  async deleteBook(bookId: string) {
    await this.prisma.book.delete({
      where: { id: bookId }
    });
  }
}
