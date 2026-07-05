const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "/api";
const TOKEN_KEY = "accounting_token";

export interface AuthUser {
  id: string;
  username: string;
  nickname: string;
}

export interface AuthResult {
  token: string;
  user: AuthUser;
}

export function getStoredToken() {
  return window.localStorage.getItem(TOKEN_KEY);
}

export function storeToken(token: string) {
  window.localStorage.setItem(TOKEN_KEY, token);
}

export function clearToken() {
  window.localStorage.removeItem(TOKEN_KEY);
}

export async function register(username: string, password: string) {
  return sendAuthRequest("/auth/register", username, password);
}

export async function login(username: string, password: string) {
  return sendAuthRequest("/auth/login", username, password);
}

export async function fetchMe(token: string) {
  const response = await fetch(`${API_BASE_URL}/users/me`, {
    headers: {
      Authorization: `Bearer ${token}`
    }
  });
  const payload = await parseResponse<{ user: AuthUser }>(response);
  return payload.user;
}

async function sendAuthRequest(path: string, username: string, password: string) {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({ username, password })
  });

  return parseResponse<AuthResult>(response);
}

async function parseResponse<T>(response: Response): Promise<T> {
  const payload = (await response.json()) as { ok: boolean; data?: T; error?: { message?: string } };
  if (!response.ok || !payload.ok || !payload.data) {
    throw new Error(payload.error?.message ?? "Request failed");
  }

  return payload.data;
}
