import "server-only";
import { createHmac, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";

export const ADMIN_COOKIE = "vsf_admin";
const HOURS = 8;

function key(): string | null {
  const pass = process.env.ADMIN_PASSWORD;
  if (!pass) return null;
  return process.env.ADMIN_SESSION_SECRET || process.env.ANON_ID_SECRET || pass;
}

const sign = (value: string, k: string) => createHmac("sha256", k).update(value).digest("hex");

function safeEqual(a: string, b: string): boolean {
  const x = Buffer.from(a);
  const y = Buffer.from(b);
  return x.length === y.length && timingSafeEqual(x, y);
}

export function adminEnabled(): boolean {
  return Boolean(process.env.ADMIN_PASSWORD);
}

export function checkPassword(password: string): boolean {
  const pass = process.env.ADMIN_PASSWORD;
  return Boolean(pass) && safeEqual(sign(password, "pw"), sign(pass!, "pw"));
}

export async function startAdminSession(): Promise<void> {
  const k = key()!;
  const exp = String(Date.now() + HOURS * 3600_000);
  (await cookies()).set(ADMIN_COOKIE, `${exp}.${sign(exp, k)}`, {
    httpOnly: true,
    sameSite: "strict",
    secure: process.env.NODE_ENV === "production",
    maxAge: HOURS * 3600,
    path: "/",
  });
}

export async function endAdminSession(): Promise<void> {
  (await cookies()).delete(ADMIN_COOKIE);
}

export async function isAdmin(): Promise<boolean> {
  const k = key();
  if (!k) return false;
  const raw = (await cookies()).get(ADMIN_COOKIE)?.value ?? "";
  const [exp, sig] = raw.split(".");
  if (!exp || !sig || Number(exp) < Date.now()) return false;
  return safeEqual(sig, sign(exp, k));
}

/** Respuesta 401 lista para devolver desde una ruta de administración. */
export async function requireAdmin(): Promise<Response | null> {
  if (await isAdmin()) return null;
  return Response.json({ error: "No autorizado" }, { status: 401 });
}
