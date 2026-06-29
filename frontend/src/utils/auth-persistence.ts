import type { AdminUser } from "@services/auth.service";

const AUTH_STORAGE_KEY = "auth-storage";
const AUTH_TOKEN_KEY = "authToken";

interface StoredAuth {
  user: AdminUser;
  accessToken: string;
  isAuthenticated: true;
}

export function saveAuthToStorage(user: AdminUser, accessToken: string): void {
  try {
    const data: StoredAuth = { user, accessToken, isAuthenticated: true };
    localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(data));
    localStorage.setItem(AUTH_TOKEN_KEY, accessToken);
  } catch {
    /* localStorage unavailable */
  }
}

export function loadAuthFromStorage(): StoredAuth | null {
  try {
    const raw = localStorage.getItem(AUTH_STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as StoredAuth;
  } catch {
    return null;
  }
}

export function clearAuthFromStorage(): void {
  try {
    localStorage.removeItem(AUTH_STORAGE_KEY);
    localStorage.removeItem(AUTH_TOKEN_KEY);
  } catch {
    /* localStorage unavailable */
  }
}
