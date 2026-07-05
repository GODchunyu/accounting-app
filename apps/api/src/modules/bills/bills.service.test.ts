import { describe, expect, it } from "vitest";
import { AuthService } from "../auth/auth.service.js";
import { InMemoryAuthRepository } from "../auth/repositories/inMemoryAuthRepository.js";
import { BillsService } from "./bills.service.js";

function createServices() {
  const repository = new InMemoryAuthRepository();
  const authService = new AuthService(repository, {
    jwtSecret: "test_secret_with_at_least_32_characters",
    jwtExpiresIn: "1h"
  });
  const billsService = new BillsService(repository, repository, repository);

  return { authService, billsService, repository };
}

async function createUserFixtures(authService: AuthService, repository: InMemoryAuthRepository, username = "alice") {
  const { user } = await authService.register({ username, password: "secret123" });
  const [book] = await repository.listBooksByUserId(user.id);
  const [expenseCategory] = await repository.listCategoriesByUserId(user.id, "expense");
  const [incomeCategory] = await repository.listCategoriesByUserId(user.id, "income");

  return { user, book: book!, expenseCategory: expenseCategory!, incomeCategory: incomeCategory! };
}

describe("BillsService", () => {
  it("creates, lists, updates, reads, and deletes bills for the current user", async () => {
    const { authService, billsService, repository } = createServices();
    const fixture = await createUserFixtures(authService, repository);

    const created = await billsService.createBill({
      userId: fixture.user.id,
      bookId: fixture.book.id,
      categoryId: fixture.expenseCategory.id,
      type: "expense",
      amount: "12.3",
      remark: " lunch ",
      happenedAt: "2026-07-05T10:00:00.000Z"
    });
    expect(created).toMatchObject({
      userId: fixture.user.id,
      amount: "12.30",
      remark: "lunch",
      type: "expense"
    });

    await expect(
      billsService.listBills({ userId: fixture.user.id, bookId: fixture.book.id, month: "2026-07", type: "expense" })
    ).resolves.toHaveLength(1);

    const updated = await billsService.updateBill({
      userId: fixture.user.id,
      billId: created.id,
      amount: "99.99",
      categoryId: fixture.incomeCategory.id,
      type: "income"
    });
    expect(updated).toMatchObject({ amount: "99.99", type: "income", categoryId: fixture.incomeCategory.id });

    await expect(billsService.getBill(fixture.user.id, created.id)).resolves.toMatchObject({ id: created.id });
    await billsService.deleteBill(fixture.user.id, created.id);
    await expect(billsService.getBill(fixture.user.id, created.id)).rejects.toThrow("Bill not found");
  });

  it("rejects invalid amount and category type mismatches", async () => {
    const { authService, billsService, repository } = createServices();
    const fixture = await createUserFixtures(authService, repository);

    await expect(
      billsService.createBill({
        userId: fixture.user.id,
        bookId: fixture.book.id,
        categoryId: fixture.expenseCategory.id,
        type: "expense",
        amount: "0",
        happenedAt: "2026-07-05T10:00:00.000Z"
      })
    ).rejects.toThrow("Amount must be greater than 0");

    await expect(
      billsService.createBill({
        userId: fixture.user.id,
        bookId: fixture.book.id,
        categoryId: fixture.expenseCategory.id,
        type: "income",
        amount: "1.00",
        happenedAt: "2026-07-05T10:00:00.000Z"
      })
    ).rejects.toThrow("Bill type must match category type");
  });

  it("prevents users from using or reading another user's bill relations", async () => {
    const { authService, billsService, repository } = createServices();
    const alice = await createUserFixtures(authService, repository, "alice");
    const bob = await createUserFixtures(authService, repository, "bobby");
    const bobBill = await billsService.createBill({
      userId: bob.user.id,
      bookId: bob.book.id,
      categoryId: bob.expenseCategory.id,
      type: "expense",
      amount: "8.00",
      happenedAt: "2026-07-05T10:00:00.000Z"
    });

    await expect(
      billsService.createBill({
        userId: alice.user.id,
        bookId: bob.book.id,
        categoryId: alice.expenseCategory.id,
        type: "expense",
        amount: "1.00",
        happenedAt: "2026-07-05T10:00:00.000Z"
      })
    ).rejects.toThrow("Book not found");
    await expect(billsService.getBill(alice.user.id, bobBill.id)).rejects.toThrow("Bill not found");
  });
});
