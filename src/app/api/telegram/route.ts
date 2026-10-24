import { after } from "next/server";
import { telegramAnonId } from "@/lib/anonId";
import { handleMessage, type BotInput, type BotState } from "@/lib/bot/conversation";
import { getConfig, getStore } from "@/lib/data/store";
import { downloadFile, sendReply, tg, validSecret } from "@/lib/telegram";

export const maxDuration = 60;

interface TgMessage {
  chat: { id: number; type: string };
  from?: { id: number };
  text?: string;
  caption?: string;
  photo?: { file_id: string; file_size?: number }[];
  document?: { file_id: string; mime_type?: string };
}

interface TgUpdate {
  update_id: number;
  message?: TgMessage;
  callback_query?: { id: string; from: { id: number }; data?: string; message?: { chat: { id: number } } };
}

// Telegram reintenta si tardamos; evitamos responder dos veces la misma actualización.
const seen = new Set<number>();

// Comandos del menú de Telegram (/start, /simulacro…) hacia las palabras que entiende el bot.
const COMMANDS: Record<string, string> = {
  start: "hola",
  menu: "menu",
  verificar: "verificar",
  simulacro: "simulacro",
  ayuda: "ya caí",
};

export async function POST(request: Request) {
  if (!validSecret(request.headers.get("x-telegram-bot-api-secret-token"))) {
    return new Response("No autorizado", { status: 401 });
  }
  const update = (await request.json().catch(() => null)) as TgUpdate | null;
  if (!update) return new Response("JSON inválido", { status: 400 });

  after(async () => {
    if (seen.has(update.update_id)) return;
    seen.add(update.update_id);
    if (seen.size > 2000) seen.clear();
    const chatId = update.message?.chat.id ?? update.callback_query?.message?.chat.id;
    // Solo chats privados: el bot no participa en grupos.
    if (!chatId || (update.message && update.message.chat.type !== "private")) return;
    try {
      await processUpdate(update, chatId);
    } catch (err) {
      console.error("Error procesando mensaje de Telegram:", err);
      await sendReply(chatId, {
        text: "😕 Tuve un problema revisando tu mensaje. Intenta de nuevo en un momento.",
      }).catch(() => {});
    }
  });
  return new Response("OK", { status: 200 });
}

async function toInput(update: TgUpdate): Promise<BotInput> {
  if (update.callback_query) {
    const id = update.callback_query.data;
    return id ? { kind: "button", id } : { kind: "unsupported" };
  }
  const msg = update.message;
  if (!msg) return { kind: "unsupported" };
  if (msg.text) {
    const cmd = /^\/(\w+)(@\w+)?\s*$/.exec(msg.text.trim());
    if (cmd) return { kind: "text", text: COMMANDS[cmd[1].toLowerCase()] ?? "menu" };
    return { kind: "text", text: msg.text };
  }
  const fileId = msg.photo?.length
    ? msg.photo[msg.photo.length - 1].file_id
    : msg.document?.mime_type?.startsWith("image/")
      ? msg.document.file_id
      : null;
  if (fileId) {
    const image = await downloadFile(fileId);
    return image ? { kind: "image", image, caption: msg.caption } : { kind: "unsupported" };
  }
  return { kind: "unsupported" };
}

async function processUpdate(update: TgUpdate, chatId: number) {
  const userId = update.message?.from?.id ?? update.callback_query?.from.id ?? chatId;
  if (update.callback_query) {
    // Quita el "cargando" del botón que tocó la persona.
    void tg("answerCallbackQuery", { callback_query_id: update.callback_query.id });
  }
  const store = getStore();
  const anonId = telegramAnonId(userId);
  const [config, saved, input] = await Promise.all([
    getConfig(),
    store.getSession(anonId),
    toInput(update),
  ]);
  const { replies, state } = await handleMessage(input, (saved ?? {}) as BotState, {
    channel: "telegram",
    config,
    log: (e) => store.logEvent({ ...e, anon_id: anonId, channel: "telegram" }),
  });
  await store.setSession(anonId, state as Record<string, unknown>);
  for (const reply of replies) await sendReply(chatId, reply);
}
