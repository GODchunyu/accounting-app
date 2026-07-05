import request from "supertest";
import { describe, expect, it } from "vitest";
import { createApp } from "../../app.js";
import { AuthService } from "../auth/auth.service.js";
import { createAuthRouter } from "../auth/auth.routes.js";
import { InMemoryAuthRepository } from "../auth/repositories/inMemoryAuthRepository.js";
import { CategoriesService } from "./categories.service.js";
import { createCategoriesRouter } from "./categories.routes.js";

function createTestApp() {
  const repository = new InMemoryAuthRepository();
  const authService = new AuthService(repository, {
    jwtSecret: "test_secret_with_at_least_32_characters",
    jwtExpiresIn: "1h"
  });
  const categoriesService = new CategoriesService(repository);
  const app = createApp({
    authRouter: createAuthRouter(authService),
    categoriesRouter: createCategoriesRouter(authService, categoriesService)
  });

  return { app, repository };
}

async function register(app: ReturnType<typeof createTestApp>["app"], username: string) {
  const response = await request(app)
    .post("/api/auth/register")
    .send({ username, password: "secret123" })
    .expect(201);

  return {
    token: response.body.data.token as string,
    userId: response.body.data.user.id as string
  };
}

describe("category routes", () => {
  it("requires JWT for category APIs", async () => {
    const { app } = createTestApp();

    await request(app).get("/api/categories").expect(401);
  });

  it("lists, creates, updates, disables, reorders, and deletes categories for the authenticated user", async () => {
    const { app } = createTestApp();
    const alice = await register(app, "alice");

    const listResponse = await request(app)
      .get("/api/categories?type=expense")
      .set("Authorization", `Bearer ${alice.token}`)
      .expect(200);
    expect(listResponse.body.data.categories.length).toBeGreaterThan(0);

    const createResponse = await request(app)
      .post("/api/categories")
      .set("Authorization", `Bearer ${alice.token}`)
      .send({ type: "expense", name: "Coffee", icon: "cup", userId: "attacker_user_id" })
      .expect(201);
    expect(createResponse.body.data.category).toMatchObject({ userId: alice.userId, name: "Coffee" });

    const categoryId = createResponse.body.data.category.id as string;
    await request(app)
      .patch(`/api/categories/${categoryId}`)
      .set("Authorization", `Bearer ${alice.token}`)
      .send({ name: "Tea" })
      .expect(200)
      .expect((response) => {
        expect(response.body.data.category.name).toBe("Tea");
      });

    await request(app)
      .patch(`/api/categories/${categoryId}/disable`)
      .set("Authorization", `Bearer ${alice.token}`)
      .expect(200)
      .expect((response) => {
        expect(response.body.data.category.isActive).toBe(false);
      });

    await request(app)
      .patch("/api/categories/reorder")
      .set("Authorization", `Bearer ${alice.token}`)
      .send({ items: [{ id: categoryId, sort: 1 }] })
      .expect(200);

    await request(app).delete(`/api/categories/${categoryId}`).set("Authorization", `Bearer ${alice.token}`).expect(204);
  });

  it("disables used categories instead of deleting them through the API", async () => {
    const { app, repository } = createTestApp();
    const alice = await register(app, "alice");
    const listResponse = await request(app)
      .get("/api/categories?type=expense")
      .set("Authorization", `Bearer ${alice.token}`)
      .expect(200);
    const categoryId = listResponse.body.data.categories[0].id as string;
    repository.markCategoryAsUsedForTest(categoryId);

    await request(app)
      .delete(`/api/categories/${categoryId}`)
      .set("Authorization", `Bearer ${alice.token}`)
      .expect(200)
      .expect((response) => {
        expect(response.body.data.deleted).toBe(false);
        expect(response.body.data.category.isActive).toBe(false);
      });
  });

  it("hides other users' categories behind not found responses", async () => {
    const { app } = createTestApp();
    const alice = await register(app, "alice");
    const bob = await register(app, "bobby");
    const bobCategories = await request(app)
      .get("/api/categories?type=expense")
      .set("Authorization", `Bearer ${bob.token}`)
      .expect(200);
    const bobCategoryId = bobCategories.body.data.categories[0].id as string;

    await request(app)
      .patch(`/api/categories/${bobCategoryId}`)
      .set("Authorization", `Bearer ${alice.token}`)
      .send({ name: "Mine" })
      .expect(404);
  });
});
