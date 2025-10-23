import type { SavedUser, ApplicationPayload, SavedPosition} from "../types";

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
  user_id: number;
  age: number;
  company_input: string;
  position_title: string;
  belief?: string;
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
  return res.json() as Promise<SavedPosition>; // <-- keep id
}

export async function saveApplication(input: ApplicationPayload) {
  const res = await fetch(`${API_BASE}/applications`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  if (!res.ok) {
    const txt = await res.text().catch(() => "");
    throw new Error(`Save application failed: HTTP ${res.status} ${res.statusText}${txt ? ` — ${txt}` : ""}`);
  }
  return res.json() as Promise<{
    id: number;
    user_id: number;
    position_id: number;
    qa: any[];
    summary_file_url: string;
    created_at: string;
    updated_at: string;
  }>;
}