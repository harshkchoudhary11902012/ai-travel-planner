export function getToken(): string | null {
  if (typeof window === "undefined") return null;
  return window.sessionStorage.getItem("token");
}

export function setToken(token: string) {
  if (typeof window === "undefined") return;
  window.sessionStorage.setItem("token", token);
}

export function clearToken() {
  if (typeof window === "undefined") return;
  window.sessionStorage.removeItem("token");
}

