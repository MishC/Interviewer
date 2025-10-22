export function isValidEmail(s: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s.trim());
}

export function createTempEmail(name: string) {
  const clean = name.trim().toLowerCase().replace(/\s+/g, ".").replace(/[^a-z0-9_.-]/g, "") || "user";
  const rand = Math.random().toString(36).slice(2, 8);
  return `${clean}-${rand}@local.test`;
}

export function resolveEmail(inputEmail: string, displayName: string) {
  const trimmed = (inputEmail ?? "").trim();
  if (trimmed && isValidEmail(trimmed)) return trimmed;
  return createTempEmail(displayName);
}
