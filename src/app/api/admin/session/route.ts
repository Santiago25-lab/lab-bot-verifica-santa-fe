import { connection } from "next/server";
import {
  adminEnabled,
  checkPassword,
  endAdminSession,
  isAdmin,
  startAdminSession,
} from "@/lib/adminAuth";
import { getStore } from "@/lib/data/store";
import { aiEnabled } from "@/lib/engine/ai";
import { rateLimited } from "@/lib/rateLimit";
import { whatsappConfigured } from "@/lib/whatsapp";

export async function GET() {
  await connection();
  const authed = await isAdmin();
  return Response.json({
    enabled: adminEnabled(),
    authed,
    status: authed
      ? {
          baseDeDatos: getStore().kind,
          whatsapp: whatsappConfigured(),
          ia: aiEnabled(),
          safeBrowsing: Boolean(process.env.SAFE_BROWSING_API_KEY),
          firmaWebhook: Boolean(process.env.WHATSAPP_APP_SECRET),
          secretoIds: Boolean(process.env.ANON_ID_SECRET),
        }
      : undefined,
  });
}

export async function POST(request: Request) {
  if (!adminEnabled()) {
    return Response.json(
      { error: "Configura ADMIN_PASSWORD para activar el panel." },
      { status: 503 },
    );
  }
  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "local";
  if (rateLimited(`login:${ip}`, 8, 10 * 60_000)) {
    return Response.json({ error: "Demasiados intentos. Espera 10 minutos." }, { status: 429 });
  }
  const { password } = (await request.json().catch(() => ({}))) as { password?: string };
  if (typeof password !== "string" || !checkPassword(password)) {
    return Response.json({ error: "Contraseña incorrecta" }, { status: 401 });
  }
  await startAdminSession();
  return Response.json({ ok: true });
}

export async function DELETE() {
  await endAdminSession();
  return Response.json({ ok: true });
}
