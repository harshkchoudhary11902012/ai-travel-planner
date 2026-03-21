import { getToken } from "./token";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

type ApiErrorPayload = { error?: string; message?: string; detail?: string };

export async function api<T>(path: string, opts: RequestInit = {}): Promise<T> {
  const token = getToken();

  const headers = new Headers(opts.headers);
  if (!headers.has("Content-Type") && opts.body) headers.set("Content-Type", "application/json");
  if (token) headers.set("Authorization", `Bearer ${token}`);

  const res = await fetch(`${API_BASE_URL}${path}`, {
    ...opts,
    headers,
  });

  const text = await res.text().catch(() => "");
  const payload = text ? (JSON.parse(text) as ApiErrorPayload) : ({} as ApiErrorPayload);

  if (!res.ok) {
    const base = payload.error || payload.message || `Request failed (${res.status})`;
    const msg = payload.detail ? `${base}: ${payload.detail}` : base;
    throw new Error(msg);
  }

  // If the backend returns empty body (e.g. delete endpoints), treat as `{}`.
  return (payload as T) ?? ({} as T);
}

