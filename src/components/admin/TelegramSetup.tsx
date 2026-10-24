"use client";

import { useEffect, useState } from "react";
import { api } from "./api";

interface Status {
  configured: boolean;
  tokenOk?: boolean;
  error?: string;
  username?: string;
  webhook?: string | null;
  lastError?: string;
}

/** Conecta el bot de Telegram con un clic y muestra si está funcionando. */
export function TelegramSetup() {
  const [status, setStatus] = useState<Status | null>(null);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  const load = () =>
    api<Status>("/api/admin/telegram")
      .then(setStatus)
      .catch((e: Error) => setMsg(e.message));

  useEffect(() => {
    void load();
  }, []);

  async function connect() {
    setBusy(true);
    setMsg(null);
    try {
      const r = await api<{ url: string }>("/api/admin/telegram", { method: "POST" });
      setMsg(`✓ Conectado a ${r.url}`);
      await load();
    } catch (e) {
      setMsg((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  if (!status?.configured) return null;
  const connected = Boolean(status.webhook?.endsWith("/api/telegram"));

  return (
    <section className="flex flex-col gap-2 rounded-xl border border-black/10 bg-white p-4 text-sm sm:flex-row sm:items-center sm:justify-between">
      <div>
        <p className="font-semibold">
          ✈️ Bot de Telegram{" "}
          {status.username && (
            <a href={`https://t.me/${status.username}`} target="_blank" rel="noopener" className="text-brand-700 underline">
              @{status.username}
            </a>
          )}
        </p>
        <p className="text-muted">
          {!status.tokenOk
            ? `El token no funciona: ${status.error ?? "revisa TELEGRAM_BOT_TOKEN"}`
            : connected
              ? "Conectado: responde a los mensajes."
              : "Falta conectarlo a esta página."}
          {status.lastError && connected && ` Último error de Telegram: ${status.lastError}`}
        </p>
        {msg && <p className="mt-1">{msg}</p>}
      </div>
      {status.tokenOk && (
        <button
          type="button"
          disabled={busy}
          onClick={() => void connect()}
          className="w-fit rounded-lg bg-brand-700 px-4 py-2 font-semibold text-white hover:bg-brand-800 disabled:opacity-60"
        >
          {busy ? "Conectando…" : connected ? "Reconectar" : "Conectar Telegram"}
        </button>
      )}
    </section>
  );
}
