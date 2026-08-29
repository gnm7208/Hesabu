const API_URL = import.meta.env.VITE_API_URL ?? "http://localhost:5050/api/v1";

let authToken: string | null = null;

export function setAuthToken(token: string | null) {
  authToken = token;
}

let onUnauthorized: (() => void) | null = null;

/** Registered by AuthProvider so a dead session can clear itself from anywhere. */
export function setUnauthorizedHandler(handler: (() => void) | null) {
  onUnauthorized = handler;
}

export class ApiError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const headers = new Headers(options.headers);
  headers.set("Content-Type", "application/json");
  if (authToken) headers.set("Authorization", `Bearer ${authToken}`);

  const res = await fetch(`${API_URL}${path}`, { ...options, headers });
  const isJson = res.headers.get("content-type")?.includes("application/json");
  const body = isJson ? await res.json() : null;

  if (!res.ok) {
    // flask-jwt-extended reports under `msg`, our own handlers under `message` /
    // `error`. Missing `msg` meant every auth failure surfaced as the useless
    // "Request failed (422)" instead of "Token has expired".
    const message =
      body?.message || body?.msg || body?.error || `Request failed (${res.status})`;

    // 401 = expired, 422 = malformed/undecodable token. Either way the stored
    // session is spent, and without a refresh route it cannot be revived — so
    // clear it rather than letting every later write fail with a confusing error.
    const isAuthFailure =
      res.status === 401 || (res.status === 422 && /token|payload|signature/i.test(message));
    if (isAuthFailure) onUnauthorized?.();

    throw new ApiError(message, res.status);
  }
  return body as T;
}

export const api = {
  get: <T>(path: string) => request<T>(path),
  post: <T>(path: string, data?: unknown) =>
    request<T>(path, { method: "POST", body: data ? JSON.stringify(data) : undefined }),
  patch: <T>(path: string, data?: unknown) =>
    request<T>(path, { method: "PATCH", body: data ? JSON.stringify(data) : undefined }),
  delete: <T>(path: string) => request<T>(path, { method: "DELETE" }),
};
