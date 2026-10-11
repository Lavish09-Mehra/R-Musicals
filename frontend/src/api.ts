// src/api.ts — fetch wrapper with automatic token refresh + logout redirect.

const BASE = 'http://localhost:3000';

// ---- token storage (swap for localStorage/cookies as you prefer) ----
let accessToken: string | null = null;
let refreshToken: string | null = null;

export const setTokens = (access: string, refresh: string) => {
  accessToken = access;
  refreshToken = refresh;
  // if you want them to survive a page reload, persist to localStorage:
  localStorage.setItem('accessToken', access);
  localStorage.setItem('refreshToken', refresh);
};

export const loadTokens = () => {
  accessToken = localStorage.getItem('accessToken');
  refreshToken = localStorage.getItem('refreshToken');
};

export const clearTokens = () => {
  accessToken = null;
  refreshToken = null;
  localStorage.removeItem('accessToken');
  localStorage.removeItem('refreshToken');
};

// Called when refresh fails -> force the user back to login.
// In React, better to fire a custom event your AuthContext listens to,
// so state updates instead of a hard window.location reload.
const forceLogout = () => {
  clearTokens();
  window.dispatchEvent(new Event('auth:logout'));
  // fallback if you have no listener set up:
  // window.location.href = '/login';
};

// ---- single-flight refresh: concurrent 401s share one refresh call ----
let refreshing: Promise<string | null> | null = null;

const refreshAccessToken = async (): Promise<string | null> => {
  if (!refreshToken) return null;
  if (refreshing) return refreshing; // already in progress

  refreshing = (async () => {
    try {
      const res = await fetch(`${BASE}/api/auth/refresh`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refreshToken }),
      });
      if (!res.ok) return null;
      const data = await res.json();
      setTokens(data.accessToken, data.refreshToken); // rotated
      return data.accessToken as string;
    } catch {
      return null;
    } finally {
      refreshing = null;
    }
  })();

  return refreshing;
};

// ---- the wrapper ----
interface ApiOptions extends RequestInit {
  auth?: boolean; // attach access token (default true)
}

export const api = async <T = any>(path: string, options: ApiOptions = {}): Promise<T> => {
  const { auth = true, headers, ...rest } = options;

  const doFetch = (token: string | null) =>
    fetch(`${BASE}${path}`, {
      ...rest,
      headers: {
        'Content-Type': 'application/json',
        ...(auth && token ? { Authorization: `Bearer ${token}` } : {}),
        ...(headers || {}),
      },
    });

  let res = await doFetch(accessToken);

  // access token expired? -> refresh once, then retry the original request.
  // We key off the 401 status (not the message text) so backend copy changes
  // never break auto-refresh. Any 401 on an authenticated call means the
  // access token was rejected, so attempt a refresh.
  if (res.status === 401 && auth) {
    const newAccess = await refreshAccessToken();

    if (!newAccess) {
      forceLogout();
      throw new Error('Session expired. Please log in again.');
    }
    res = await doFetch(newAccess); // retry once
  }

  if (!res.ok) {
    // surface the backend's message so callers can show it
    const err = await res.json().catch(() => ({ message: 'Request failed' }));
    throw new Error(err.message || `HTTP ${res.status}`);
  }

  return res.json() as Promise<T>;
};

// convenience helpers
export const apiGet = <T = any>(path: string) => api<T>(path, { method: 'GET' });
export const apiPost = <T = any>(path: string, body: any) =>
  api<T>(path, { method: 'POST', body: JSON.stringify(body) });
export const apiPatch = <T = any>(path: string, body: any) =>
  api<T>(path, { method: 'PATCH', body: JSON.stringify(body) });
export const apiDelete = <T = any>(path: string) => api<T>(path, { method: 'DELETE' });
