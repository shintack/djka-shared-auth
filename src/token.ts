const DEFAULT_TOKEN_KEY = 'access_token';

let tokenKey = DEFAULT_TOKEN_KEY;

export function setTokenKey(key: string) {
  tokenKey = key;
}

export function getToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(tokenKey);
}

export function setToken(token: string) {
  localStorage.setItem(tokenKey, token);
}

export function removeToken() {
  localStorage.removeItem(tokenKey);
}

export function getAuthHeaders(): Record<string, string> {
  const token = getToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
}
