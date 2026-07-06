import { afterEach, describe, expect, it, vi } from "vitest";

const placeholderJwtSecret =
  "change_me_to_a_very_long_secret_with_at_least_32_chars";
const strongJwtSecret = "production_secret_with_more_than_32_chars";

async function loadEnv() {
  vi.resetModules();
  return import("./env.js");
}

describe("env", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("allows the placeholder JWT secret outside production", async () => {
    vi.stubEnv("NODE_ENV", "development");
    vi.stubEnv(
      "DATABASE_URL",
      "postgresql://accounting:accounting_dev_password@localhost:5432/accounting_app?schema=public",
    );
    vi.stubEnv("JWT_SECRET", placeholderJwtSecret);

    const { env } = await loadEnv();

    expect(env.NODE_ENV).toBe("development");
    expect(env.JWT_SECRET).toBe(placeholderJwtSecret);
  });

  it("rejects the placeholder JWT secret in production", async () => {
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv(
      "DATABASE_URL",
      "postgresql://accounting:accounting_dev_password@localhost:5432/accounting_app?schema=public",
    );
    vi.stubEnv("JWT_SECRET", placeholderJwtSecret);

    await expect(loadEnv()).rejects.toThrow();
  });

  it("accepts a strong JWT secret in production", async () => {
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv(
      "DATABASE_URL",
      "postgresql://accounting:accounting_dev_password@localhost:5432/accounting_app?schema=public",
    );
    vi.stubEnv("JWT_SECRET", strongJwtSecret);

    const { env } = await loadEnv();

    expect(env.NODE_ENV).toBe("production");
    expect(env.JWT_SECRET).toBe(strongJwtSecret);
  });
});
