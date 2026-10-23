"use client";

import { useState } from "react";
import { api } from "./api";

interface Result {
  verdict: "peligroso" | "sospechoso" | "sin_senales";
  oficial: string[];
  sospechosos: string[];
  expandido: { from: string; to: string }[];
  senales: string[];
}

const LABEL = {
  peligroso: "🔴 Peligroso",
  sospechoso: "🟡 Sospechoso",
  sin_senales: "🟢 Sin señales evidentes",
};

/** Caja para probar cómo clasifica el sistema un link antes de agregarlo a una lista. */
export function LinkChecker({ onBlacklist }: { onBlacklist?: (domain: string) => void }) {
  const [url, setUrl] = useState("");
  const [result, setResult] = useState<Result | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function check(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      setResult(await api<Result>("/api/admin/probar-link", { method: "POST", body: JSON.stringify({ url }) }));
    } catch (err) {
      setResult(null);
      setError((err as Error).message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="rounded-2xl border border-black/5 bg-white p-5">
      <h3 className="font-semibold">🔎 Probar un link</h3>
      <p className="text-sm text-muted">
        Mira cómo lo clasifica el sistema: compara con los links oficiales y las páginas falsas, busca
        imitaciones y revisa rasgos raros de la dirección.
      </p>
      <form onSubmit={check} className="mt-3 flex flex-col gap-2 sm:flex-row">
        <input
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder="ej. bancolombia-seguridad.online"
          aria-label="Link a probar"
          className="flex-1 rounded-lg border border-black/10 px-3 py-2 text-sm"
        />
        <button
          type="submit"
          disabled={busy || !url.trim()}
          className="rounded-lg bg-brand-700 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
        >
          {busy ? "Revisando…" : "Probar"}
        </button>
      </form>
      {error && <p role="alert" className="mt-2 text-sm text-danger">{error}</p>}
      {result && (
        <div className="mt-3 rounded-xl bg-surface p-4 text-sm">
          <p className="text-base font-bold">{LABEL[result.verdict]}</p>
          {result.oficial.length > 0 && <p>✔️ Es oficial: {result.oficial.join(", ")}</p>}
          {result.expandido.map((e) => (
            <p key={e.from}>
              ↪ {e.from} lleva a {e.to}
            </p>
          ))}
          {result.senales.length > 0 && (
            <ul className="mt-1 list-disc space-y-1 pl-5">
              {result.senales.map((s) => (
                <li key={s}>{s}</li>
              ))}
            </ul>
          )}
          {!result.oficial.length && !result.senales.length && (
            <p className="text-muted">No lo conocemos y no tiene rasgos raros. Revísalo con cuidado.</p>
          )}
          {onBlacklist &&
            result.sospechosos.map((d) => (
              <button
                key={d}
                type="button"
                onClick={() => onBlacklist(d)}
                className="mr-2 mt-3 rounded-lg border border-danger px-3 py-1 font-semibold text-danger hover:bg-red-50"
              >
                + Agregar {d} a páginas falsas
              </button>
            ))}
        </div>
      )}
    </div>
  );
}
