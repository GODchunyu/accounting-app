import { mkdtemp, readFile, rm } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import request from "supertest";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { createApp } from "../../app.js";
import { AuthService } from "../auth/auth.service.js";
import { createAuthRouter } from "../auth/auth.routes.js";
import { InMemoryAuthRepository } from "../auth/repositories/inMemoryAuthRepository.js";
import { ImageStorage } from "./imageStorage.js";
import { createUploadsRouter } from "./uploads.routes.js";

let uploadDir = "";

async function createTestApp() {
  uploadDir = await mkdtemp(path.join(os.tmpdir(), "accounting-uploads-"));
  const repository = new InMemoryAuthRepository();
  const authService = new AuthService(repository, {
    jwtSecret: "test_secret_with_at_least_32_characters",
    jwtExpiresIn: "1h"
  });
  const imageStorage = new ImageStorage(uploadDir);
  const app = createApp({
    authRouter: createAuthRouter(authService),
    uploadsRouter: createUploadsRouter(authService, imageStorage),
    uploadsDir: uploadDir
  });

  return { app };
}

async function register(app: Awaited<ReturnType<typeof createTestApp>>["app"]) {
  const response = await request(app)
    .post("/api/auth/register")
    .send({ username: "alice", password: "secret123" })
    .expect(201);

  return response.body.data.token as string;
}

describe("upload routes", () => {
  beforeEach(() => {
    uploadDir = "";
  });

  afterEach(async () => {
    if (uploadDir) {
      await rm(uploadDir, { recursive: true, force: true });
    }
  });

  it("requires JWT for bill image uploads", async () => {
    const { app } = await createTestApp();

    await request(app).post("/api/uploads/bill-image").expect(401);
  });

  it("uploads and serves a supported bill image", async () => {
    const { app } = await createTestApp();
    const token = await register(app);
    const image = Buffer.from([0x89, 0x50, 0x4e, 0x47]);

    const response = await request(app)
      .post("/api/uploads/bill-image")
      .set("Authorization", `Bearer ${token}`)
      .attach("image", image, { filename: "receipt.png", contentType: "image/png" })
      .expect(201);

    const imageUrl = response.body.data.imageUrl as string;
    expect(imageUrl).toMatch(/^\/uploads\/bills\/.+\.png$/);
    await expect(readFile(path.join(uploadDir, imageUrl.replace("/uploads/", "")))).resolves.toEqual(image);
    await request(app).get(imageUrl).expect(200);
  });

  it("rejects unsupported image types", async () => {
    const { app } = await createTestApp();
    const token = await register(app);

    await request(app)
      .post("/api/uploads/bill-image")
      .set("Authorization", `Bearer ${token}`)
      .attach("image", Buffer.from("nope"), { filename: "receipt.gif", contentType: "image/gif" })
      .expect(400);
  });
});
