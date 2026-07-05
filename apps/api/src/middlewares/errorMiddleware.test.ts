import { Router } from "express";
import request from "supertest";
import { describe, expect, it } from "vitest";
import { createApp } from "../app.js";
import { AppError } from "../errors/AppError.js";

function createErrorTestApp() {
  const router = Router();
  router.get("/app-error", () => {
    throw new AppError("Business rule failed", 409);
  });
  router.get("/unexpected", () => {
    throw new Error("database_password=super-secret");
  });

  return createApp({ authRouter: router });
}

describe("errorMiddleware", () => {
  it("preserves app errors without stack details", async () => {
    const app = createErrorTestApp();

    await request(app)
      .get("/api/app-error")
      .expect(409)
      .expect((response) => {
        expect(response.body).toEqual({ ok: false, error: { message: "Business rule failed" } });
      });
  });

  it("hides unexpected error messages", async () => {
    const app = createErrorTestApp();

    await request(app)
      .get("/api/unexpected")
      .expect(500)
      .expect((response) => {
        expect(response.body.error.message).toBe("Internal server error");
        expect(JSON.stringify(response.body)).not.toContain("super-secret");
      });
  });
});
