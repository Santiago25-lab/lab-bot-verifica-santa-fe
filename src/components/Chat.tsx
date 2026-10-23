"use client";

import { useEffect, useRef, useState } from "react";
import type { BotReply, BotState } from "@/lib/bot/conversation";
import { RichText } from "./RichText";

type Message =
  | { from: "user"; text: string; image?: string }
  | ({ from: "bot" } & BotReply);

type Outgoing =
  | { kind: "text"; text: string }
  | { kind: "button"; id: string }
  | { kind: "image"; image: string; caption?: string };

const STATE_KEY = "vsf_chat_state";

function loadState(): BotState {
  try {
    return JSON.parse(sessionStorage.getItem(STATE_KEY) || "{}") as BotState;
  } catch {
    return {};
  }
}

/** Reduce la imagen en el navegador para enviarla rápido (máx. 1600 px, JPEG). */
async function compress(file: File): Promise<string> {
  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, 1600 / Math.max(bitmap.width, bitmap.height));
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(bitmap.width * scale);
  canvas.height = Math.round(bitmap.height * scale);
  canvas.getContext("2d")!.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  return canvas.toDataURL("image/jpeg", 0.85);
}

export function Chat() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const state = useRef<BotState>({});
  const scroller = useRef<HTMLDivElement>(null);
  const fileInput = useRef<HTMLInputElement>(null);
  const started = useRef(false);

  async function send(input: Outgoing, shown?: Message) {
    if (shown) setMessages((m) => [...m, shown]);
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ input, state: state.current }),
      });
      const data = (await res.json()) as { replies?: BotReply[]; state?: BotState; error?: string };
      if (!res.ok || !data.replies) throw new Error(data.error || "No pude responder.");
      state.current = data.state ?? {};
      try {
        sessionStorage.setItem(STATE_KEY, JSON.stringify(state.current));
      } catch {}
      setMessages((m) => [...m, ...data.replies!.map((r) => ({ from: "bot" as const, ...r }))]);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusy(false);
    }
  }

  useEffect(() => {
    if (started.current) return;
    started.current = true;
    state.current = loadState();
    // Un ejemplo desde el inicio llega como ?m=texto: se envía solo después del menú.
    const example = new URLSearchParams(window.location.search).get("m")?.slice(0, 1000);
    if (example) window.history.replaceState(null, "", window.location.pathname);
    void (async () => {
      await send({ kind: "button", id: "menu" });
      if (example) await send({ kind: "text", text: example }, { from: "user", text: example });
    })();
  }, []);

  useEffect(() => {
    // Desplaza solo el chat (no la página) hasta el último mensaje.
    const list = scroller.current;
    if (list) list.scrollTo({ top: list.scrollHeight, behavior: "smooth" });
  }, [messages, busy]);

  function submitText(e: React.FormEvent) {
    e.preventDefault();
    const t = text.trim();
    if (!t || busy) return;
    setText("");
    void send({ kind: "text", text: t }, { from: "user", text: t });
  }

  async function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file || busy) return;
    try {
      const image = await compress(file);
      const caption = text.trim() || undefined;
      setText("");
      void send(
        { kind: "image", image, caption },
        { from: "user", text: caption ?? "", image },
      );
    } catch {
      setError("No pude abrir esa imagen.");
    }
  }

  const lastBot = messages.findLastIndex((m) => m.from === "bot");

  return (
    <div className="flex h-[calc(100dvh-8.5rem)] min-h-[420px] flex-col overflow-hidden border-black/10 bg-white shadow-sm sm:h-[calc(100dvh-9rem)] sm:min-h-[520px] sm:rounded-2xl sm:border">
      <div className="flex items-center gap-3 bg-brand-800 px-4 py-3 text-white">
        <span className="flex h-9 w-9 items-center justify-center rounded-full bg-white/15 text-lg" aria-hidden="true">
          🛡️
        </span>
        <div>
          <p className="font-semibold">Verifica Santa Fe</p>
          <p className="text-xs text-brand-100">No guardamos tus mensajes</p>
        </div>
      </div>

      <div ref={scroller} className="flex-1 space-y-3 overflow-y-auto bg-[#efeae2] p-3 sm:p-4" aria-live="polite">
        {messages.map((m, i) =>
          m.from === "user" ? (
            <div key={i} className="ml-auto max-w-[85%] rounded-xl rounded-tr-sm bg-[#d9fdd3] p-3 text-sm shadow-sm">
              {m.image && (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={m.image} alt="Captura enviada" className="mb-2 max-h-56 rounded-lg" />
              )}
              {m.text && <p className="bubble">{m.text}</p>}
            </div>
          ) : (
            <div key={i} className="max-w-[90%] text-sm">
              <div className="bubble rounded-xl rounded-tl-sm bg-white p-3 shadow-sm">
                <RichText text={m.text} />
              </div>
              {(m.buttons?.length || m.list) && (
                <div className="mt-2 flex flex-wrap gap-2">
                  {[...(m.buttons ?? []), ...(m.list?.rows ?? [])].map((b) => (
                    <button
                      key={b.id}
                      type="button"
                      disabled={busy || i !== lastBot}
                      onClick={() => void send({ kind: "button", id: b.id }, { from: "user", text: b.title })}
                      className="rounded-full border border-brand-600 bg-white px-4 py-2 font-medium text-brand-800 shadow-sm hover:bg-brand-50 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {b.title}
                    </button>
                  ))}
                </div>
              )}
            </div>
          ),
        )}
        {busy && (
          <div className="w-fit rounded-xl bg-white px-4 py-3 text-sm text-muted shadow-sm">
            Analizando…
          </div>
        )}
        {error && (
          <div role="alert" className="w-fit rounded-xl bg-red-50 px-4 py-3 text-sm text-danger">
            {error}
          </div>
        )}
      </div>

      <form onSubmit={submitText} className="flex items-end gap-2 border-t border-black/10 bg-white p-3">
        <input ref={fileInput} type="file" accept="image/*" className="hidden" onChange={onFile} />
        <button
          type="button"
          onClick={() => fileInput.current?.click()}
          disabled={busy}
          className="rounded-xl border border-black/10 px-3 py-3 text-lg hover:bg-surface disabled:opacity-50"
          title="Enviar captura de pantalla"
          aria-label="Enviar captura de pantalla"
        >
          📷
        </button>
        <label htmlFor="chat-text" className="sr-only">
          Mensaje
        </label>
        <textarea
          id="chat-text"
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) submitText(e);
          }}
          rows={1}
          placeholder="Pega aquí el mensaje o link sospechoso…"
          className="max-h-40 min-h-12 flex-1 resize-y rounded-xl border border-black/10 px-3 py-3 text-sm outline-none focus:border-brand-500"
        />
        <button
          type="submit"
          disabled={busy || !text.trim()}
          className="rounded-xl bg-brand-700 px-5 py-3 font-semibold text-white hover:bg-brand-800 disabled:opacity-50"
        >
          Enviar
        </button>
      </form>
    </div>
  );
}
