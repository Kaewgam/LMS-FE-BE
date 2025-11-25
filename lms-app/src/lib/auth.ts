// src/lib/auth.ts
export const AUTH_KEYS = ['access','refresh','access_token','refresh_token','key','me'] as const;

export function getAccess(): string | null {
  if (typeof window === 'undefined') return null;

  // ✅ รองรับทั้ง JWT และ DRF Token
  const jwt =
    sessionStorage.getItem('access') ||
    localStorage.getItem('access') ||
    sessionStorage.getItem('access_token') ||
    localStorage.getItem('access_token');

  const drfKey =
    localStorage.getItem('key') ||
    sessionStorage.getItem('key');

  return jwt || drfKey;
}

export function getMe<T = any>(): T | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem('me');
    return raw ? (JSON.parse(raw) as T) : null;
  } catch {
    return null;
  }
}

export function clearAuth(): void {
  if (typeof window === 'undefined') return;
  AUTH_KEYS.forEach(k => {
    localStorage.removeItem(k);
    sessionStorage.removeItem(k);
  });
}
