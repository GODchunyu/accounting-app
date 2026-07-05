import { describe, expect, it } from "vitest";
import { AuthService } from "../auth/auth.service.js";
import { InMemoryAuthRepository } from "../auth/repositories/inMemoryAuthRepository.js";
import { CategoriesService } from "./categories.service.js";

function createServices() {
  const repository = new InMemoryAuthRepository();
  const authService = new AuthService(repository, {
    jwtSecret: "test_secret_with_at_least_32_characters",
    jwtExpiresIn: "1h"
  });
  const categoriesService = new CategoriesService(repository);

  return { authService, categoriesService, repository };
}

describe("CategoriesService", () => {
  it("creates, updates, disables, reorders, and deletes unused categories for the current user", async () => {
    const { authService, categoriesService } = createServices();
    const { user } = await authService.register({ username: "alice", password: "secret123" });

    const created = await categoriesService.createCategory({
      userId: user.id,
      type: "expense",
      name: "  Coffee  ",
      icon: "cup"
    });
    expect(created).toMatchObject({ userId: user.id, type: "expense", name: "Coffee", icon: "cup", isActive: true });

    const updated = await categoriesService.updateCategory({
      userId: user.id,
      categoryId: created.id,
      name: "Tea"
    });
    expect(updated.name).toBe("Tea");

    const disabled = await categoriesService.disableCategory(user.id, created.id);
    expect(disabled.isActive).toBe(false);

    const reordered = await categoriesService.reorderCategories({
      userId: user.id,
      items: [{ id: created.id, sort: 1 }]
    });
    expect(reordered[0]).toMatchObject({ id: created.id, sort: 1 });

    await expect(categoriesService.deleteCategory(user.id, created.id)).resolves.toEqual({ deleted: true });
    await expect(categoriesService.updateCategory({ userId: user.id, categoryId: created.id, name: "Gone" })).rejects.toThrow(
      "Category not found"
    );
  });

  it("disables used categories instead of physically deleting them", async () => {
    const { authService, categoriesService, repository } = createServices();
    const { user } = await authService.register({ username: "alice", password: "secret123" });
    const [category] = await categoriesService.listCategories(user.id, "expense");
    repository.markCategoryAsUsedForTest(category!.id);

    const result = await categoriesService.deleteCategory(user.id, category!.id);

    expect(result.deleted).toBe(false);
    expect(result.category).toMatchObject({ id: category!.id, isActive: false });
    await expect(categoriesService.updateCategory({ userId: user.id, categoryId: category!.id, name: "Still here" })).resolves.toMatchObject({
      name: "Still here"
    });
  });

  it("prevents users from mutating another user's categories", async () => {
    const { authService, categoriesService } = createServices();
    const alice = await authService.register({ username: "alice", password: "secret123" });
    const bob = await authService.register({ username: "bobby", password: "secret123" });
    const [bobCategory] = await categoriesService.listCategories(bob.user.id, "expense");

    await expect(
      categoriesService.updateCategory({ userId: alice.user.id, categoryId: bobCategory!.id, name: "Mine" })
    ).rejects.toThrow("Category not found");
    await expect(categoriesService.disableCategory(alice.user.id, bobCategory!.id)).rejects.toThrow("Category not found");
  });
});
