import { connection } from "next/server";
import { requireAdmin } from "@/lib/adminAuth";
import { telegramConfigured, tg, webhookSecret } from "@/lib/telegram";

interface WebhookInfo {
  url?: string;
  pending_update_count?: number;
  last_error_message?: string;
}

/** Estado del bot de Telegram: nombre de usuario y webhook. */
export async function GET() {
  await connection();
  const denied = await requireAdmin();
  if (denied) return denied;
  if (!telegramConfigured()) return Response.json({ configured: false });
  const [me, info] = await Promise.all([
    tg<{ username?: string }>("getMe"),
    tg<WebhookInfo>("getWebhookInfo"),
  ]);
  return Response.json({
    configured: true,
    tokenOk: me.ok,
    error: me.ok ? undefined : me.description,
    username: me.result?.username,
    webhook: info.result?.url || null,
    lastError: info.result?.last_error_message,
  });
}

/** Conecta el bot a esta página (webhook) y publica el menú de comandos. */
export async function POST(request: Request) {
  const denied = await requireAdmin();
  if (denied) return denied;
  if (!telegramConfigured()) {
    return Response.json({ error: "Falta TELEGRAM_BOT_TOKEN en Vercel." }, { status: 400 });
  }
  const site = (process.env.NEXT_PUBLIC_SITE_URL || new URL(request.url).origin).replace(/\/$/, "");
  const url = `${site}/api/telegram`;
  const set = await tg("setWebhook", {
    url,
    secret_token: webhookSecret(),
    allowed_updates: ["message", "callback_query"],
    drop_pending_updates: true,
  });
  if (!set.ok) return Response.json({ error: set.description ?? "Telegram rechazó el webhook." }, { status: 502 });
  await Promise.all([
    tg("setMyCommands", {
      commands: [
        { command: "verificar", description: "Revisar un mensaje, link o captura" },
        { command: "simulacro", description: "Practicar con un mensaje de ejemplo" },
        { command: "ayuda", description: "Ya caí: qué hacer y a quién llamar" },
        { command: "menu", description: "Ver el menú" },
      ],
    }),
    tg("setMyDescription", {
      description:
        "Bot gratuito anti-fraude para comerciantes de Santa Fe (Bogotá). Reenvíame un mensaje, link o captura sospechosa y te digo si tiene señales de fraude. No guardo tus mensajes.",
    }),
    tg("setMyShortDescription", { short_description: "Revisa mensajes sospechosos antes de pagar. Gratis." }),
  ]);
  return Response.json({ ok: true, url });
}
