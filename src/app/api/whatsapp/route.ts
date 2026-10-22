import { after } from "next/server";
import { whatsappAnonId } from "@/lib/anonId";
import { handleMessage, type BotInput, type BotState } from "@/lib/bot/conversation";
import { getConfig, getStore } from "@/lib/data/store";
import { downloadMedia, sendReply, validSignature, whatsappConfigured } from "@/lib/whatsapp";

export const maxDuration = 60;

/** Verificación del webhook que hace Meta al configurarlo. */
export async function GET(request: Request) {
  const params = new URL(request.url).searchParams;
  const ok =
    params.get("hub.mode") === "subscribe" &&
    Boolean(process.env.WHATSAPP_VERIFY_TOKEN) &&
    params.get("hub.verify_token") === process.env.WHATSAPP_VERIFY_TOKEN;
  if (!ok) return new Response("Token inválido", { status: 403 });
  return new Response(params.get("hub.challenge") ?? "", { status: 200 });
}

interface WaMessage {
  id: string;
  from: string;
  type: string;
  text?: { body: string };
  image?: { id: string; caption?: string };
  interactive?: {
    type: string;
    button_reply?: { id: string };
    list_reply?: { id: string };
  };
  button?: { payload?: string; text?: string };
}

interface WaPayload {
  entry?: { changes?: { value?: { messages?: WaMessage[] } }[] }[];
}

// Meta reintenta si tardamos; evitamos responder dos veces el mismo mensaje.
const seen = new Set<string>();

export async function POST(request: Request) {
  const raw = await request.text();
  if (!validSignature(raw, request.headers.get("x-hub-signature-256"))) {
    return new Response("Firma inválida", { status: 401 });
  }
  let payload: WaPayload;
  try {
    payload = JSON.parse(raw) as WaPayload;
  } catch {
    return new Response("JSON inválido", { status: 400 });
  }
  const messages = (payload.entry ?? []).flatMap((e) =>
    (e.changes ?? []).flatMap((c) => c.value?.messages ?? []),
  );

  // Respondemos 200 de inmediato y procesamos después, como pide Meta.
  after(async () => {
    if (!whatsappConfigured()) {
      console.warn("Llegó un mensaje pero WHATSAPP_TOKEN / WHATSAPP_PHONE_NUMBER_ID no están configurados.");
      return;
    }
    for (const msg of messages) {
      if (seen.has(msg.id)) continue;
      seen.add(msg.id);
      if (seen.size > 2000) seen.clear();
      try {
        await processMessage(msg);
      } catch (err) {
        console.error("Error procesando mensaje de WhatsApp:", err);
        await sendReply(msg.from, {
          text: "😕 Tuve un problema revisando tu mensaje. Intenta de nuevo en un momento.",
        }).catch(() => {});
      }
    }
  });
  return new Response("OK", { status: 200 });
}

async function toInput(msg: WaMessage): Promise<BotInput> {
  switch (msg.type) {
    case "text":
      return { kind: "text", text: msg.text?.body ?? "" };
    case "interactive": {
      const id = msg.interactive?.button_reply?.id ?? msg.interactive?.list_reply?.id;
      return id ? { kind: "button", id } : { kind: "unsupported" };
    }
    case "button":
      return { kind: "text", text: msg.button?.payload ?? msg.button?.text ?? "" };
    case "image": {
      const image = msg.image ? await downloadMedia(msg.image.id) : null;
      return image ? { kind: "image", image, caption: msg.image?.caption } : { kind: "unsupported" };
    }
    default:
      return { kind: "unsupported" };
  }
}

async function processMessage(msg: WaMessage) {
  const store = getStore();
  const anonId = whatsappAnonId(msg.from);
  const [config, saved, input] = await Promise.all([
    getConfig(),
    store.getSession(anonId),
    toInput(msg),
  ]);
  const { replies, state } = await handleMessage(input, (saved ?? {}) as BotState, {
    channel: "whatsapp",
    config,
    log: (e) => store.logEvent({ ...e, anon_id: anonId, channel: "whatsapp" }),
  });
  await store.setSession(anonId, state as Record<string, unknown>);
  for (const reply of replies) await sendReply(msg.from, reply);
}
