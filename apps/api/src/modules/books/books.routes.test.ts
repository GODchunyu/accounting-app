import request from "supertest";
import { describe, expect, it } from "vitest";
import { createApp } from "../../app.js";
import { AuthService } from "../auth/auth.service.js";
import { createAuthRouter } from "../auth/auth.routes.js";
import { InMemoryAuthRepository } from "../auth/repositories/inMemoryAuthRepository.js";
import { BooksService } from "./books.service.js";
import { createBooksRouter } from "./books.routes.js";

function createTestApp() {
  const repository = new InMemoryAuthRepository();
  const authService = new AuthService(repository, {
    jwtSecret: "test_secret_with_at_least_32_characters",
    jwtExpiresIn: "1h",
  });
  const booksService = new BooksService(repository);
  const app = createApp({
    authRouter: createAuthRouter(authService),
    booksRouter: createBooksRouter(authService, booksService),
  });

  return { app };
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

describe("book routes", () => {
  it("requires JWT for book APIs", async () => {
    const { app } = createTestApp();

    await request(app).get("/api/books").expect(401);
  });

  it("lists, creates, renames, and deletes books for the authenticated user", async () => {
    const { app } = createTestApp();
    const alice = await register(app, "alice");

    const listResponse = await request(app)
      .get("/api/books")
      .set("Authorization", `Bearer ${alice.token}`)
      .expect(200);
    expect(listResponse.body.data.books).toHaveLength(1);

    const createResponse = await request(app)
      .post("/api/books")
      .set("Authorization", `Bearer ${alice.token}`)
      .send({ name: "Side Project", userId: "attacker_user_id" })
      .expect(201);
    expect(createResponse.body.data.book).toMatchObject({
      userId: alice.userId,
      name: "Side Project",
    });

    const bookId = createResponse.body.data.book.id as string;
    await request(app)
      .patch(`/api/books/${bookId}`)
      .set("Authorization", `Bearer ${alice.token}`)
      .send({ name: "Daily" })
      .expect(200)
      .expect((response) => {
        expect(response.body.data.book.name).toBe("Daily");
      });

    await request(app)
      .delete(`/api/books/${bookId}`)
      .set("Authorization", `Bearer ${alice.token}`)
      .expect(204);
  });

  it("rejects deleting the last book", async () => {
    const { app } = createTestApp();
    const alice = await register(app, "alice");
    const listResponse = await request(app)
      .get("/api/books")
      .set("Authorization", `Bearer ${alice.token}`)
      .expect(200);
    const defaultBookId = listResponse.body.data.books[0].id as string;

    await request(app)
      .delete(`/api/books/${defaultBookId}`)
      .set("Authorization", `Bearer ${alice.token}`)
      .expect(400);
  });

  it("hides other users' books behind not found responses", async () => {
    const { app } = createTestApp();
    const alice = await register(app, "alice");
    const bob = await register(app, "bobby");
    const bobBooks = await request(app)
      .get("/api/books")
      .set("Authorization", `Bearer ${bob.token}`)
      .expect(200);
    const bobBookId = bobBooks.body.data.books[0].id as string;

    await request(app)
      .patch(`/api/books/${bobBookId}`)
      .set("Authorization", `Bearer ${alice.token}`)
      .send({ name: "Mine" })
      .expect(404);
  });
});
