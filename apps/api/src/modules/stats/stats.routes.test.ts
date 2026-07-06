import request from "supertest";
import { describe, expect, it } from "vitest";
import { createApp } from "../../app.js";
import { AuthService } from "../auth/auth.service.js";
import { createAuthRouter } from "../auth/auth.routes.js";
import { InMemoryAuthRepository } from "../auth/repositories/inMemoryAuthRepository.js";
import { BillsService } from "../bills/bills.service.js";
import { createStatsRouter } from "./stats.routes.js";
import { StatsService } from "./stats.service.js";

function createTestApp() {
  const repository = new InMemoryAuthRepository();
  const authService = new AuthService(repository, {
    jwtSecret: "test_secret_with_at_least_32_characters",
    jwtExpiresIn: "1h",
  });
  const billsService = new BillsService(repository, repository, repository);
  const statsService = new StatsService(repository, repository, repository);
  const app = createApp({
    authRouter: createAuthRouter(authService),
    statsRouter: createStatsRouter(authService, statsService),
  });

  return { app, repository, billsService };
}

async function seedBills() {
  const { app, repository, billsService } = createTestApp();
  const response = await request(app)
    .post("/api/auth/register")
    .send({ username: "alice", password: "secret123" })
    .expect(201);
  const userId = response.body.data.user.id as string;
  const token = response.body.data.token as string;
  const [book] = await repository.listBooksByUserId(userId);
  const [expenseCategory] = await repository.listCategoriesByUserId(
    userId,
    "expense",
  );
  const [incomeCategory] = await repository.listCategoriesByUserId(
    userId,
    "income",
  );

  await billsService.createBill({
    userId,
    bookId: book!.id,
    categoryId: expenseCategory!.id,
    type: "expense",
    amount: "12.30",
    happenedAt: "2026-07-05T10:00:00.000Z",
  });
  await billsService.createBill({
    userId,
    bookId: book!.id,
    categoryId: expenseCategory!.id,
    type: "expense",
    amount: "7.70",
    happenedAt: "2026-07-05T12:00:00.000Z",
  });
  await billsService.createBill({
    userId,
    bookId: book!.id,
    categoryId: incomeCategory!.id,
    type: "income",
    amount: "100.00",
    happenedAt: "2026-07-06T12:00:00.000Z",
  });

  return {
    app,
    token,
    bookId: book!.id,
    expenseCategoryId: expenseCategory!.id,
  };
}

describe("stats routes", () => {
  it("returns monthly income, expense, balance, and daily trend", async () => {
    const { app, token, bookId } = await seedBills();

    await request(app)
      .get(`/api/stats/monthly?bookId=${bookId}&month=2026-07`)
      .set("Authorization", `Bearer ${token}`)
      .expect(200)
      .expect((response) => {
        expect(response.body.data.stats).toMatchObject({
          income: "100.00",
          expense: "20.00",
          balance: "80.00",
        });
        expect(response.body.data.stats.trend[4]).toMatchObject({
          date: "2026-07-05",
          expense: "20.00",
        });
      });
  });

  it("returns category rankings with percentages", async () => {
    const { app, token, bookId, expenseCategoryId } = await seedBills();

    await request(app)
      .get(`/api/stats/categories?bookId=${bookId}&month=2026-07&type=expense`)
      .set("Authorization", `Bearer ${token}`)
      .expect(200)
      .expect((response) => {
        expect(response.body.data.categories[0]).toMatchObject({
          categoryId: expenseCategoryId,
          amount: "20.00",
          percent: 100,
        });
      });
  });
});
