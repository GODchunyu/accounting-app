import type { DefaultCategory } from "@accounting-app/shared";
import type { PrismaClient } from "@prisma/client";
import type { AuthRepository } from "./authRepository.js";

export class PrismaAuthRepository implements AuthRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async findUserByUsername(username: string) {
    return this.prisma.user.findUnique({
      where: { username },
    });
  }

  async findUserById(userId: string) {
    return this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        username: true,
        nickname: true,
        avatarUrl: true,
        createdAt: true,
        updatedAt: true,
      },
    });
  }

  async createUserWithDefaults(input: {
    username: string;
    passwordHash: string;
    nickname: string;
    defaultBookName: string;
    categories: readonly DefaultCategory[];
  }) {
    return this.prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          username: input.username,
          passwordHash: input.passwordHash,
          nickname: input.nickname,
        },
        select: {
          id: true,
          username: true,
          nickname: true,
          avatarUrl: true,
          createdAt: true,
          updatedAt: true,
        },
      });

      await tx.book.create({
        data: {
          userId: user.id,
          name: input.defaultBookName,
          isDefault: true,
        },
      });

      await tx.category.createMany({
        data: input.categories.map((category) => ({
          userId: user.id,
          type: category.type,
          name: category.name,
          icon: category.icon,
          sort: category.sort,
          isDefault: true,
          isActive: true,
        })),
      });

      return user;
    });
  }
}
