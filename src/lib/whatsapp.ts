import "server-only";
import { createHmac, timingSafeEqual } from "node:crypto";
import type { BotReply } from "@/lib/bot/conversation";

const VERSION = () => process.env.WHATSAPP_GRAPH_VERSION || "v23.0";
// WHATSAPP_API_BASE solo se cambia para pruebas locales con un servidor simulado.
const GRAPH = () =>
  `${(process.env.WHATSAPP_API_BASE || "https://graph.facebook.com").replace(/\/$/, "")}/${VERSION()}`;

export function whatsappConfigured(): boolean {
  return Boolean(process.env.WHATSAPP_TOKEN && process.env.WHATSAPP_PHONE_NUMBER_ID);
}

/** Valida que el webhook venga de Meta (encabezado X-Hub-Signature-256). */
export function validSignature(rawBody: string, header: string | null): boolean {
  const secret = process.env.WHATSAPP_APP_SECRET;
  if (!secret) {
    console.warn("WHATSAPP_APP_SECRET no está configurado: no se valida la firma de Meta.");
    return process.env.NODE_ENV !== "production";
  }
  if (!header?.startsWith("sha256=")) return false;
  const expected = createHmac("sha256", secret).update(rawBody).digest();
  const got = Buffer.from(header.slice(7), "hex");
  return got.length === expected.length && timingSafeEqual(got, expected);
}

async function graph(path: string, body: unknown): Promise<void> {
  const res = await fetch(`${GRAPH()}/${path}`, {
    method: "POST",
    headers: {
      authorization: `Bearer ${process.env.WHATSAPP_TOKEN}`,
      "content-type": "application/json",
    },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    console.error("WhatsApp API", res.status, (await res.text()).slice(0, 500));
  }
}

const clip = (s: string, n: number) => (s.length > n ? `${s.slice(0, n - 1)}…` : s);

/** Envía una respuesta del bot como texto, botones o lista de WhatsApp. */
export async function sendReply(to: string, reply: BotReply): Promise<void> {
  const phoneId = process.env.WHATSAPP_PHONE_NUMBER_ID;
  const base = { messaging_product: "whatsapp", recipient_type: "individual", to };
  const path = `${phoneId}/messages`;

  // El cuerpo de un mensaje interactivo admite hasta 1024 caracteres.
  let body = reply.text;
  if ((reply.buttons?.length || reply.list) && body.length > 1024) {
    await graph(path, { ...base, type: "text", text: { body: clip(body, 4096) } });
    body = "¿Qué quieres hacer?";
  }

  if (reply.buttons?.length) {
    await graph(path, {
      ...base,
      type: "interactive",
      interactive: {
        type: "button",
        body: { text: body },
        action: {
          buttons: reply.buttons.slice(0, 3).map((b) => ({
            type: "reply",
            reply: { id: b.id, title: clip(b.title, 20) },
          })),
        },
      },
    });
    return;
  }
  if (reply.list) {
    await graph(path, {
      ...base,
      type: "interactive",
      interactive: {
        type: "list",
        body: { text: body },
        action: {
          button: clip(reply.list.button, 20),
          sections: [
            {
              title: "Opciones",
              rows: reply.list.rows.slice(0, 10).map((r) => ({
                id: r.id,
                title: clip(r.title, 24),
                ...(r.description ? { description: clip(r.description, 72) } : {}),
              })),
            },
          ],
        },
      },
    });
    return;
  }
  await graph(path, { ...base, type: "text", text: { body: clip(body, 4096), preview_url: false } });
}

/** Descarga una imagen enviada por el usuario. */
export async function downloadMedia(mediaId: string): Promise<Buffer | null> {
  const auth = { authorization: `Bearer ${process.env.WHATSAPP_TOKEN}` };
  const meta = await fetch(`${GRAPH()}/${mediaId}`, { headers: auth });
  if (!meta.ok) return null;
  const { url } = (await meta.json()) as { url?: string };
  if (!url) return null;
  const file = await fetch(url, { headers: auth });
  if (!file.ok) return null;
  return Buffer.from(await file.arrayBuffer());
}
