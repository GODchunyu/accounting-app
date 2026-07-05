import { clearToken, getStoredToken } from "./auth";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "/api";

export type BillType = "expense" | "income";

export interface Book {
  id: string;
  name: string;
  isDefault: boolean;
}

export interface Category {
  id: string;
  type: BillType;
  name: string;
  icon: string;
  sort: number;
  isActive: boolean;
}

export interface Bill {
  id: string;
  bookId: string;
  categoryId: string;
  type: BillType;
  amount: string;
  remark: string | null;
  imageUrl: string | null;
  happenedAt: string;
}

export interface MonthlyStats {
  income: string;
  expense: string;
  balance: string;
  averageDailyIncome: string;
  averageDailyExpense: string;
  trend: Array<{ date: string; income: string; expense: string }>;
}

export interface CategoryRank {
  categoryId: string;
  categoryName: string;
  icon: string;
  amount: string;
  percent: number;
}

export async function apiGet<T>(path: string) {
  return apiRequest<T>(path);
}

export async function apiPost<T>(path: string, body: unknown) {
  return apiRequest<T>(path, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body)
  });
}

export async function apiPatch<T>(path: string, body: unknown) {
  return apiRequest<T>(path, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body)
  });
}

export async function apiDelete(path: string) {
  return apiRequest<void>(path, {
    method: "DELETE"
  });
}

export async function uploadBillImage(file: File) {
  const formData = new FormData();
  formData.append("image", file);
  return apiRequest<{ imageUrl: string }>("/uploads/bill-image", {
    method: "POST",
    body: formData
  });
}

export function getAssetUrl(path: string | null) {
  if (!path) {
    return "";
  }

  return path.startsWith("http") ? path : `${API_BASE_URL.replace(/\/api$/, "")}${path}`;
}

async function apiRequest<T>(path: string, init: RequestInit = {}): Promise<T> {
  const token = getStoredToken();
  const headers = new Headers(init.headers);
  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...init,
    headers
  });
  const payload = (await response.json().catch(() => ({}))) as {
    ok?: boolean;
    data?: T;
    error?: { message?: string };
  };

  if (response.status === 401) {
    clearToken();
  }

  if (response.status === 204) {
    return undefined as T;
  }

  if (!response.ok || !payload.ok || !payload.data) {
    throw new Error(payload.error?.message ?? "接口请求失败");
  }

  return payload.data;
}
