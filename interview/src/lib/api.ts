import type { SavedUser } from "../types";

const API_BASE = import.meta.env.VITE_API_BASE ?? "/api";

export async function saveUser(input: { display_name: string; email: string }) {
  const res = await fetch(`${API_BASE}/users`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input), // { email, display_name }
  });
  if (!res.ok) {
    const txt = await res.text().catch(() => "");
    throw new Error(`Save user failed: HTTP ${res.status} ${res.statusText}${txt ? ` — ${txt}` : ""}`);
  }
  return res.json() as Promise<SavedUser>;
}

export async function createPosition(input: {
  user_id: string;            // email
  company_name: string;
  position_title: string;
  belief?: string;
  status?: "draft" | "submitted" | "archived";
}) {
  const res = await fetch(`${API_BASE}/positions`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  if (!res.ok) {
    const txt = await res.text().catch(() => "");
    throw new Error(`Create position failed: HTTP ${res.status} ${res.statusText}${txt ? ` — ${txt}` : ""}`);
  }
  return res.json();
}
