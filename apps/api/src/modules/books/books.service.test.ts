import { describe, expect, it, vi } from "vitest";
import { AuthService } from "../auth/auth.service.js";
import { InMemoryAuthRepository } from "../auth/repositories/inMemoryAuthRepository.js";
import { BillsService } from "../bills/bills.service.js";
import { CategoriesService } from "../categories/categories.service.js";
import { BooksService } from "./books.service.js";

function createServices() {
  const repository = new InMemoryAuthRepository();
  const imageStorage = {
    deleteByUrl: vi.fn(async () => {
      await Promise.resolve();
    }),
  };
  const authService = new AuthService(repository, {
    jwtSecret: "test_secret_with_at_least_32_characters",
    jwtExpiresIn: "1h",
  });
  const booksService = new BooksService(repository, imageStorage);
  const categoriesService = new CategoriesService(repository);
  const billsService = new BillsService(
    repository,
    repository,
    repository,
    imageStorage,
  );

  return {
    authService,
    billsService,
    booksService,
    categoriesService,
    imageStorage,
  };
}

describe("BooksService", () => {
  it("creates, renames, lists, and deletes books for the current user", async () => {
    const { authService, booksService } = createServices();
    const { user } = await authService.register({
      username: "alice",
      password: "secret123",
    });

    const created = await booksService.createBook({
      userId: user.id,
      name: "  Travel  ",
    });
    expect(created).toMatchObject({
      userId: user.id,
      name: "Travel",
      isDefault: false,
    });

    const renamed = await booksService.renameBook({
      userId: user.id,
      bookId: created.id,
      name: "Daily",
    });
    expect(renamed.name).toBe("Daily");

    await booksService.deleteBook(user.id, renamed.id);
    await expect(
      booksService.renameBook({
        userId: user.id,
        bookId: renamed.id,
        name: "Gone",
      }),
    ).rejects.toThrow("Book not found");
  });

  it("rejects deleting the user's last book", async () => {
    const { authService, booksService } = createServices();
    const { user } = await authService.register({
      username: "alice",
      password: "secret123",
    });
    const [defaultBook] = await booksService.listBooks(user.id);

    await expect(
      booksService.deleteBook(user.id, defaultBook!.id),
    ).rejects.toThrow("Cannot delete the last book");
  });

  it("deletes bill images when deleting a book", async () => {
    const {
      authService,
      billsService,
      booksService,
      categoriesService,
      imageStorage,
    } = createServices();
    const { user } = await authService.register({
      username: "alice",
      password: "secret123",
    });
    const book = await booksService.createBook({
      userId: user.id,
      name: "Travel",
    });
    const [category] = await categoriesService.listCategories(
      user.id,
      "expense",
    );
    const bill = await billsService.createBill({
      userId: user.id,
      bookId: book.id,
      categoryId: category!.id,
      type: "expense",
      amount: "12.30",
      imageUrl: "/uploads/bills/receipt.png",
      happenedAt: new Date("2026-07-06T00:00:00.000Z"),
    });

    await booksService.deleteBook(user.id, book.id);

    await expect(billsService.getBill(user.id, bill.id)).rejects.toThrow(
      "Bill not found",
    );
    expect(imageStorage.deleteByUrl).toHaveBeenCalledWith(
      "/uploads/bills/receipt.png",
    );
  });

  it("prevents users from renaming or deleting another user's book", async () => {
    const { authService, booksService } = createServices();
    const alice = await authService.register({
      username: "alice",
      password: "secret123",
    });
    const bob = await authService.register({
      username: "bobby",
      password: "secret123",
    });
    const [bobBook] = await booksService.listBooks(bob.user.id);

    await expect(
      booksService.renameBook({
        userId: alice.user.id,
        bookId: bobBook!.id,
        name: "Mine",
      }),
    ).rejects.toThrow("Book not found");
    await expect(
      booksService.deleteBook(alice.user.id, bobBook!.id),
    ).rejects.toThrow("Book not found");
  });
});
