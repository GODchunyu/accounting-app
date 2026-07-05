import type { BillType } from "@accounting-app/shared";

export interface PublicUser {
  id: string;
  username: string;
  nickname: string;
  avatarUrl: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface UserWithPassword extends PublicUser {
  passwordHash: string;
}

export interface BookRecord {
  id: string;
  userId: string;
  name: string;
  isDefault: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface CategoryRecord {
  id: string;
  userId: string;
  type: BillType;
  name: string;
  icon: string;
  sort: number;
  isDefault: boolean;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface RegisterInput {
  username: string;
  password: string;
}

export interface LoginInput {
  username: string;
  password: string;
}

export interface AuthResult {
  token: string;
  user: PublicUser;
}

