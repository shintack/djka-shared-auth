const DEFAULT_TOKEN_KEY = 'access_token';

let tokenKey = DEFAULT_TOKEN_KEY;

export function setTokenKey(key: string) {
  tokenKey = key;
}

export function getToken(): string | null {
  return null;
}

export function setToken(_token: string) {}

export function removeToken() {
  if (typeof document === 'undefined') return;
  document.cookie = `${tokenKey}=; path=/; max-age=0; SameSite=Lax`;
}

export function getAuthHeaders(): Record<string, string> {
  return {};
}
