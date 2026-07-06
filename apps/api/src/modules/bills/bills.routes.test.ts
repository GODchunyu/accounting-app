import request from "supertest";
import { describe, expect, it } from "vitest";
import { createApp } from "../../app.js";
import { AuthService } from "../auth/auth.service.js";
import { createAuthRouter } from "../auth/auth.routes.js";
import { InMemoryAuthRepository } from "../auth/repositories/inMemoryAuthRepository.js";
import { createBillsRouter } from "./bills.routes.js";
import { BillsService } from "./bills.service.js";

function createTestApp() {
  const repository = new InMemoryAuthRepository();
  const authService = new AuthService(repository, {
    jwtSecret: "test_secret_with_at_least_32_characters",
    jwtExpiresIn: "1h",
  });
  const billsService = new BillsService(repository, repository, repository);
  const app = createApp({
    authRouter: createAuthRouter(authService),
    billsRouter: createBillsRouter(authService, billsService),
  });

  return { app, repository };
}

async function register(
  app: ReturnType<typeof createTestApp>["app"],
  username: string,
) {
  const response = await request(app)
    .post("/api/auth/register")
    .send({ username, password: "secret123" })
    .expect(201);

  return {
    token: response.body.data.token as string,
    userId: response.body.data.user.id as string,
  };
}

describe("bill routes", () => {
  it("requires JWT for bill APIs", async () => {
    const { app } = createTestApp();

    await request(app).get("/api/bills").expect(401);
  });

  it("creates, lists, reads, updates, and deletes bills for the authenticated user", async () => {
    const { app, repository } = createTestApp();
    const alice = await register(app, "alice");
    const [book] = await repository.listBooksByUserId(alice.userId);
    const [expenseCategory] = await repository.listCategoriesByUserId(
      alice.userId,
      "expense",
    );
    const [incomeCategory] = await repository.listCategoriesByUserId(
      alice.userId,
      "income",
    );

    const createResponse = await request(app)
      .post("/api/bills")
      .set("Authorization", `Bearer ${alice.token}`)
      .send({
        userId: "attacker_user_id",
        bookId: book!.id,
        categoryId: expenseCategory!.id,
        type: "expense",
        amount: "25.5",
        remark: "Dinner",
        happenedAt: "2026-07-05T12:00:00.000Z",
      })
      .expect(201);
    expect(createResponse.body.data.bill).toMatchObject({
      userId: alice.userId,
      amount: "25.50",
      type: "expense",
    });

    const billId = createResponse.body.data.bill.id as string;
    await request(app)
      .get(
        `/api/bills?bookId=${book!.id}&month=2026-07&type=expense&categoryId=${expenseCategory!.id}`,
      )
      .set("Authorization", `Bearer ${alice.token}`)
      .expect(200)
      .expect((response) => {
        expect(response.body.data.bills).toHaveLength(1);
      });

    await request(app)
      .get(`/api/bills/${billId}`)
      .set("Authorization", `Bearer ${alice.token}`)
      .expect(200);

    await request(app)
      .patch(`/api/bills/${billId}`)
      .set("Authorization", `Bearer ${alice.token}`)
      .send({
        type: "income",
        categoryId: incomeCategory!.id,
        amount: "100.00",
      })
      .expect(200)
      .expect((response) => {
        expect(response.body.data.bill.type).toBe("income");
        expect(response.body.data.bill.amount).toBe("100.00");
      });

    await request(app)
      .delete(`/api/bills/${billId}`)
      .set("Authorization", `Bearer ${alice.token}`)
      .expect(204);
  });

  it("rejects type mismatches and cross-user access", async () => {
    const { app, repository } = createTestApp();
    const alice = await register(app, "alice");
    const bob = await register(app, "bobby");
    const [aliceBook] = await repository.listBooksByUserId(alice.userId);
    const [aliceExpense] = await repository.listCategoriesByUserId(
      alice.userId,
      "expense",
    );
    const [bobBook] = await repository.listBooksByUserId(bob.userId);

    await request(app)
      .post("/api/bills")
      .set("Authorization", `Bearer ${alice.token}`)
      .send({
        bookId: aliceBook!.id,
        categoryId: aliceExpense!.id,
        type: "income",
        amount: "10.00",
        happenedAt: "2026-07-05T12:00:00.000Z",
      })
      .expect(400);

    await request(app)
      .post("/api/bills")
      .set("Authorization", `Bearer ${alice.token}`)
      .send({
        bookId: bobBook!.id,
        categoryId: aliceExpense!.id,
        type: "expense",
        amount: "10.00",
        happenedAt: "2026-07-05T12:00:00.000Z",
      })
      .expect(404);
  });
});
