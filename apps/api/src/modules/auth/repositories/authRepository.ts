import type { DefaultCategory } from "@accounting-app/shared";
import type {
  BookRecord,
  CategoryRecord,
  PublicUser,
  UserWithPassword,
} from "../auth.types.js";

export interface AuthRepository {
  findUserByUsername(username: string): Promise<UserWithPassword | null>;
  findUserById(userId: string): Promise<PublicUser | null>;
  createUserWithDefaults(input: {
    username: string;
    passwordHash: string;
    nickname: string;
    defaultBookName: string;
    categories: readonly DefaultCategory[];
  }): Promise<PublicUser>;
}

export interface AuthRepositoryInspection {
  listBooksByUserId(userId: string): Promise<BookRecord[]>;
  listCategoriesByUserId(userId: string): Promise<CategoryRecord[]>;
}
