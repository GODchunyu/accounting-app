import type { BillType } from "@accounting-app/shared";
import type { PrismaClient } from "@prisma/client";
import type { CategoryRepository } from "./categoryRepository.js";

export class PrismaCategoryRepository implements CategoryRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async listCategoriesByUserId(userId: string, type?: BillType) {
    return this.prisma.category.findMany({
      where: {
        userId,
        type
      },
      orderBy: { sort: "asc" }
    });
  }

  async findCategoryById(categoryId: string) {
    return this.prisma.category.findUnique({
      where: { id: categoryId }
    });
  }

  async createCategory(input: {
    userId: string;
    type: BillType;
    name: string;
    icon: string;
    sort: number;
  }) {
    return this.prisma.category.create({
      data: {
        userId: input.userId,
        type: input.type,
        name: input.name,
        icon: input.icon,
        sort: input.sort,
        isDefault: false,
        isActive: true
      }
    });
  }

  async updateCategory(input: {
    categoryId: string;
    name?: string;
    icon?: string;
    sort?: number;
    isActive?: boolean;
  }) {
    return this.prisma.category.update({
      where: { id: input.categoryId },
      data: {
        name: input.name,
        icon: input.icon,
        sort: input.sort,
        isActive: input.isActive
      }
    });
  }

  async deleteCategory(categoryId: string) {
    await this.prisma.category.delete({
      where: { id: categoryId }
    });
  }

  async categoryHasBills(categoryId: string) {
    const count = await this.prisma.bill.count({
      where: { categoryId }
    });

    return count > 0;
  }
}
