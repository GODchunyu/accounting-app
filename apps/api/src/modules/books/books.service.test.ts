import { describe, expect, it } from "vitest";
import { AuthService } from "../auth/auth.service.js";
import { InMemoryAuthRepository } from "../auth/repositories/inMemoryAuthRepository.js";
import { BooksService } from "./books.service.js";

function createServices() {
  const repository = new InMemoryAuthRepository();
  const authService = new AuthService(repository, {
    jwtSecret: "test_secret_with_at_least_32_characters",
    jwtExpiresIn: "1h"
  });
  const booksService = new BooksService(repository);

  return { authService, booksService };
}

describe("BooksService", () => {
  it("creates, renames, lists, and deletes books for the current user", async () => {
    const { authService, booksService } = createServices();
    const { user } = await authService.register({ username: "alice", password: "secret123" });

    const created = await booksService.createBook({ userId: user.id, name: "  Travel  " });
    expect(created).toMatchObject({ userId: user.id, name: "Travel", isDefault: false });

    const renamed = await booksService.renameBook({ userId: user.id, bookId: created.id, name: "Daily" });
    expect(renamed.name).toBe("Daily");

    await booksService.deleteBook(user.id, renamed.id);
    await expect(booksService.renameBook({ userId: user.id, bookId: renamed.id, name: "Gone" })).rejects.toThrow(
      "Book not found"
    );
  });

  it("rejects deleting the user's last book", async () => {
    const { authService, booksService } = createServices();
    const { user } = await authService.register({ username: "alice", password: "secret123" });
    const [defaultBook] = await booksService.listBooks(user.id);

    await expect(booksService.deleteBook(user.id, defaultBook!.id)).rejects.toThrow("Cannot delete the last book");
  });

  it("prevents users from renaming or deleting another user's book", async () => {
    const { authService, booksService } = createServices();
    const alice = await authService.register({ username: "alice", password: "secret123" });
    const bob = await authService.register({ username: "bobby", password: "secret123" });
    const [bobBook] = await booksService.listBooks(bob.user.id);

    await expect(
      booksService.renameBook({ userId: alice.user.id, bookId: bobBook!.id, name: "Mine" })
    ).rejects.toThrow("Book not found");
    await expect(booksService.deleteBook(alice.user.id, bobBook!.id)).rejects.toThrow("Book not found");
  });
});
