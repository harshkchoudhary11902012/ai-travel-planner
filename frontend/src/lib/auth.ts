import { api } from "./api";
import { clearToken, setToken } from "./token";

export type MeResponse = {
  user: {
    _id: string;
    email: string;
    createdAt: string;
    firstName?: string;
    lastName?: string;
  };
};

export async function login(input: { email: string; password: string }) {
  const data = await api<{ token: string }>("/api/auth/login", {
    method: "POST",
    body: JSON.stringify(input),
  });
  setToken(data.token);
  return data;
}

export async function signup(input: {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
}) {
  return api("/api/auth/signup", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export async function fetchMe() {
  return api<MeResponse>("/api/auth/me", { method: "GET" });
}

export function logout() {
  clearToken();
}

