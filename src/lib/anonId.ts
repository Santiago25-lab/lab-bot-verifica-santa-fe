import "server-only";
import { createHmac, randomBytes } from "node:crypto";
import { cookies } from "next/headers";

export const WEB_ID_COOKIE = "vsf_id";
const WEB_ID_RE = /^WEB-[a-f0-9]{12}$/;

function secret(): string {
  const s = process.env.ANON_ID_SECRET;
  if (!s && process.env.NODE_ENV === "production") {
    console.warn("ANON_ID_SECRET no está configurado: los IDs anónimos no son seguros.");
  }
  return s || "solo-para-desarrollo";
}

/** ID anónimo e irreversible para un número de WhatsApp. El número nunca se guarda. */
export function whatsappAnonId(phone: string): string {
  const digits = phone.replace(/\D/g, "");
  return `WA-${createHmac("sha256", secret()).update(digits).digest("hex").slice(0, 12)}`;
}

/** Lee o crea el ID anónimo del navegador (web y aula). Solo en Route Handlers. */
export async function webAnonId(): Promise<string> {
  const jar = await cookies();
  const current = jar.get(WEB_ID_COOKIE)?.value;
  if (current && WEB_ID_RE.test(current)) return current;
  const id = `WEB-${randomBytes(6).toString("hex")}`;
  jar.set(WEB_ID_COOKIE, id, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: 60 * 60 * 24 * 365,
    path: "/",
  });
  return id;
}
