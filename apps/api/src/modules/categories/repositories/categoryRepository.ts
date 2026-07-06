import type { BillType } from "@accounting-app/shared";
import type { CategoryRecord } from "../../auth/auth.types.js";

export interface CategoryRepository {
  listCategoriesByUserId(
    userId: string,
    type?: BillType,
  ): Promise<CategoryRecord[]>;
  findCategoryById(categoryId: string): Promise<CategoryRecord | null>;
  createCategory(input: {
    userId: string;
    type: BillType;
    name: string;
    icon: string;
    sort: number;
  }): Promise<CategoryRecord>;
  updateCategory(input: {
    categoryId: string;
    name?: string;
    icon?: string;
    sort?: number;
    isActive?: boolean;
  }): Promise<CategoryRecord>;
  deleteCategory(categoryId: string): Promise<void>;
  categoryHasBills(categoryId: string): Promise<boolean>;
}
