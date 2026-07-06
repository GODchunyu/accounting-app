import request from "supertest";
import { describe, expect, it } from "vitest";
import { createApp } from "../../app.js";
import { AuthService } from "./auth.service.js";
import { createAuthRouter } from "./auth.routes.js";
import { InMemoryAuthRepository } from "./repositories/inMemoryAuthRepository.js";

function createTestApp() {
  const repository = new InMemoryAuthRepository();
  const authService = new AuthService(repository, {
    jwtSecret: "test_secret_with_at_least_32_characters",
    jwtExpiresIn: "1h",
  });
  const app = createApp({
    authRouter: createAuthRouter(authService),
  });

  return { app, repository };
}

describe("auth routes", () => {
  it("registers, logs in, and returns the authenticated user", async () => {
    const { app, repository } = createTestApp();

    const registerResponse = await request(app)
      .post("/api/auth/register")
      .send({ username: "alice", password: "secret123" })
      .expect(201);

    expect(registerResponse.body.data.token).toEqual(expect.any(String));
    expect(registerResponse.body.data.user).toMatchObject({
      username: "alice",
    });
    expect(registerResponse.body.data.user.passwordHash).toBeUndefined();

    const categories = await repository.listCategoriesByUserId(
      registerResponse.body.data.user.id,
    );
    expect(categories.length).toBeGreaterThan(0);

    const loginResponse = await request(app)
      .post("/api/auth/login")
      .send({ username: "alice", password: "secret123" })
      .expect(200);

    await request(app)
      .get("/api/users/me")
      .set("Authorization", `Bearer ${loginResponse.body.data.token}`)
      .expect(200)
      .expect((response) => {
        expect(response.body.data.user.username).toBe("alice");
      });
  });

  it("rejects unauthenticated /users/me requests", async () => {
    const { app } = createTestApp();

    await request(app).get("/api/users/me").expect(401);
  });
});
