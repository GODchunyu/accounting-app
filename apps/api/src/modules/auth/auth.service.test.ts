import { describe, expect, it } from "vitest";
import { defaultCategories } from "@accounting-app/shared";
import { AuthService } from "./auth.service.js";
import { InMemoryAuthRepository } from "./repositories/inMemoryAuthRepository.js";

function createService() {
  const repository = new InMemoryAuthRepository();
  const service = new AuthService(repository, {
    jwtSecret: "test_secret_with_at_least_32_characters",
    jwtExpiresIn: "1h",
  });

  return { repository, service };
}

describe("AuthService", () => {
  it("registers a user and initializes a default book and categories", async () => {
    const { repository, service } = createService();

    const result = await service.register({
      username: "alice",
      password: "secret123",
    });

    expect(result.user.username).toBe("alice");
    expect(result.token).toEqual(expect.any(String));
    expect(result.user).not.toHaveProperty("passwordHash");

    const books = await repository.listBooksByUserId(result.user.id);
    expect(books).toHaveLength(1);
    expect(books[0]).toMatchObject({ name: "默认账本", isDefault: true });

    const categories = await repository.listCategoriesByUserId(result.user.id);
    expect(categories).toHaveLength(defaultCategories.length);
    expect(categories.every((category) => category.isDefault)).toBe(true);
  });

  it("rejects duplicate usernames", async () => {
    const { service } = createService();

    await service.register({ username: "alice", password: "secret123" });

    await expect(
      service.register({ username: "alice", password: "secret123" }),
    ).rejects.toThrow("用户名已存在");
  });

  it("logs in with valid credentials and rejects invalid credentials", async () => {
    const { service } = createService();

    await service.register({ username: "alice", password: "secret123" });

    const login = await service.login({
      username: "alice",
      password: "secret123",
    });
    expect(login.token).toEqual(expect.any(String));
    expect(login.user.username).toBe("alice");

    await expect(
      service.login({ username: "alice", password: "wrong123" }),
    ).rejects.toThrow("用户名或密码错误");
  });

  it("validates username and password length", async () => {
    const { service } = createService();

    await expect(
      service.register({ username: "ab", password: "secret123" }),
    ).rejects.toThrow("用户名长度必须为 3-20 位");
    await expect(
      service.register({ username: "alice", password: "12345" }),
    ).rejects.toThrow("密码至少 6 位");
  });
});
