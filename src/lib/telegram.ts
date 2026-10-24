import "server-only";
import { createHmac, timingSafeEqual } from "node:crypto";
import type { BotReply } from "@/lib/bot/conversation";

// TELEGRAM_API_BASE solo se cambia para pruebas locales con un servidor simulado.
const API = () => (process.env.TELEGRAM_API_BASE || "https://api.telegram.org").replace(/\/$/, "");
const token = () => process.env.TELEGRAM_BOT_TOKEN ?? "";

export function telegramConfigured(): boolean {
  return Boolean(process.env.TELEGRAM_BOT_TOKEN);
}

/** Clave que Telegram envía en cada llamada al webhook. Se deriva del token: no hay otra variable que configurar. */
export function webhookSecret(): string {
  return createHmac("sha256", token()).update("verifica-webhook").digest("hex").slice(0, 48);
}

/** Valida el encabezado X-Telegram-Bot-Api-Secret-Token. */
export function validSecret(header: string | null): boolean {
  if (!telegramConfigured() || !header) return false;
  const expected = Buffer.from(webhookSecret());
  const got = Buffer.from(header);
  return got.length === expected.length && timingSafeEqual(got, expected);
}

export async function tg<T = unknown>(method: string, body?: unknown): Promise<{ ok: boolean; result?: T; description?: string }> {
  const res = await fetch(`${API()}/bot${token()}/${method}`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body ?? {}),
  });
  const data = (await res.json().catch(() => ({ ok: false, description: `HTTP ${res.status}` }))) as {
    ok: boolean;
    result?: T;
    description?: string;
  };
  if (!data.ok) console.error("Telegram API", method, data.description);
  return data;
}

const escapeHtml = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

/** Pasa el formato de WhatsApp (*negrita*, _cursiva_) al HTML de Telegram. */
export function toTelegramHtml(text: string): string {
  return escapeHtml(text)
    .replace(/(^|[^\w*])\*([^*\n]+)\*(?![\w*])/g, "$1<b>$2</b>")
    .replace(/(^|[^\w])_([^_\n]+)_(?!\w)/g, "$1<i>$2</i>");
}

const clip = (s: string, n: number) => (s.length > n ? `${s.slice(0, n - 1)}…` : s);

/** Envía una respuesta del bot como texto con botones de Telegram. */
export async function sendReply(chatId: number, reply: BotReply): Promise<void> {
  let text = reply.text;
  let keyboard: { text: string; callback_data: string }[][] | undefined;
  if (reply.buttons?.length) {
    keyboard = [reply.buttons.map((b) => ({ text: b.title, callback_data: b.id }))];
  } else if (reply.list) {
    const described = reply.list.rows.filter((r) => r.description);
    if (described.length) {
      text += "\n\n" + described.map((r) => `• *${r.title}*: ${r.description}`).join("\n");
    }
    keyboard = reply.list.rows.map((r) => [{ text: r.title, callback_data: r.id }]);
  }
  await tg("sendMessage", {
    chat_id: chatId,
    text: clip(toTelegramHtml(text), 4096),
    parse_mode: "HTML",
    // Nunca mostramos la vista previa: el link puede ser fraudulento.
    link_preview_options: { is_disabled: true },
    ...(keyboard ? { reply_markup: { inline_keyboard: keyboard } } : {}),
  });
}

/** Descarga una foto o imagen enviada por el usuario. */
export async function downloadFile(fileId: string): Promise<Buffer | null> {
  const meta = await tg<{ file_path?: string }>("getFile", { file_id: fileId });
  if (!meta.ok || !meta.result?.file_path) return null;
  const file = await fetch(`${API()}/file/bot${token()}/${meta.result.file_path}`);
  if (!file.ok) return null;
  return Buffer.from(await file.arrayBuffer());
}
