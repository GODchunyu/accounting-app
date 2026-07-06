import type { BillType } from "@accounting-app/shared";
import { AppError } from "../../errors/AppError.js";
import type { CategoryRecord } from "../auth/auth.types.js";
import type { CategoryRepository } from "./repositories/categoryRepository.js";

const billTypes = new Set<BillType>(["expense", "income"]);

export interface CreateCategoryInput {
  userId: string;
  type: BillType;
  name: string;
  icon?: string;
}

export interface UpdateCategoryInput {
  userId: string;
  categoryId: string;
  name?: string;
  icon?: string;
}

export interface ReorderCategoryInput {
  userId: string;
  items: Array<{ id: string; sort: number }>;
}

export class CategoriesService {
  constructor(private readonly repository: CategoryRepository) {}

  async listCategories(
    userId: string,
    type?: BillType,
  ): Promise<CategoryRecord[]> {
    if (type && !billTypes.has(type)) {
      throw new AppError("Invalid category type", 400);
    }

    return this.repository.listCategoriesByUserId(userId, type);
  }

  async createCategory(input: CreateCategoryInput): Promise<CategoryRecord> {
    if (!billTypes.has(input.type)) {
      throw new AppError("Invalid category type", 400);
    }

    const categories = await this.repository.listCategoriesByUserId(
      input.userId,
      input.type,
    );
    const maxSort = categories.reduce(
      (max, category) => Math.max(max, category.sort),
      0,
    );

    return this.repository.createCategory({
      userId: input.userId,
      type: input.type,
      name: this.normalizeName(input.name),
      icon: this.normalizeIcon(input.icon),
      sort: maxSort + 1,
    });
  }

  async updateCategory(input: UpdateCategoryInput): Promise<CategoryRecord> {
    await this.assertOwnCategory(input.userId, input.categoryId);

    return this.repository.updateCategory({
      categoryId: input.categoryId,
      name:
        input.name === undefined ? undefined : this.normalizeName(input.name),
      icon:
        input.icon === undefined ? undefined : this.normalizeIcon(input.icon),
    });
  }

  async disableCategory(
    userId: string,
    categoryId: string,
  ): Promise<CategoryRecord> {
    await this.assertOwnCategory(userId, categoryId);

    return this.repository.updateCategory({
      categoryId,
      isActive: false,
    });
  }

  async deleteCategory(
    userId: string,
    categoryId: string,
  ): Promise<{ deleted: boolean; category?: CategoryRecord }> {
    await this.assertOwnCategory(userId, categoryId);

    if (await this.repository.categoryHasBills(categoryId)) {
      const category = await this.repository.updateCategory({
        categoryId,
        isActive: false,
      });

      return { deleted: false, category };
    }

    await this.repository.deleteCategory(categoryId);
    return { deleted: true };
  }

  async reorderCategories(
    input: ReorderCategoryInput,
  ): Promise<CategoryRecord[]> {
    const updated: CategoryRecord[] = [];

    for (const item of input.items) {
      if (!Number.isInteger(item.sort) || item.sort < 1) {
        throw new AppError("Category sort must be a positive integer", 400);
      }

      await this.assertOwnCategory(input.userId, item.id);
      updated.push(
        await this.repository.updateCategory({
          categoryId: item.id,
          sort: item.sort,
        }),
      );
    }

    return updated;
  }

  private async assertOwnCategory(userId: string, categoryId: string) {
    const category = await this.repository.findCategoryById(categoryId);
    if (!category || category.userId !== userId) {
      throw new AppError("Category not found", 404);
    }

    return category;
  }

  private normalizeName(name: string) {
    const normalized = name.trim();
    if (!normalized || normalized.length > 20) {
      throw new AppError("Category name must be 1-20 characters", 400);
    }

    return normalized;
  }

  private normalizeIcon(icon?: string) {
    const normalized = icon?.trim() || "custom";
    if (normalized.length > 40) {
      throw new AppError("Category icon must be at most 40 characters", 400);
    }

    return normalized;
  }
}
