"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { POST_SLUG, PRE_SLUG } from "@/lib/data/defaults";

const PASOS = [
  { href: `/aula/${PRE_SLUG}`, icon: "📝", title: "Prueba de entrada", text: "6 preguntas, antes de la capacitación." },
  { href: "/simulador", icon: "🎯", title: "Simulador de casos", text: "5 mensajes revisados con el kit de 5 puntos." },
  { href: `/aula/${POST_SLUG}`, icon: "✅", title: "Prueba de salida", text: "Al final, para medir el avance." },
  { href: "/aula/encuesta-de-percepcion", icon: "💬", title: "Encuesta de percepción", text: "Opinión del participante (1 a 5)." },
];

/** Panel del facilitador: asigna un código a cada participante para que una tablet compartida no mezcle resultados. */
export function TallerPanel() {
  const [code, setCode] = useState<string | null | undefined>(undefined);
  const [input, setInput] = useState("");
  const [consent, setConsent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/taller")
      .then((r) => r.json())
      .then((d: { code: string | null }) => setCode(d.code))
      .catch(() => setCode(null));
  }, []);

  async function empezar(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const res = await fetch("/api/taller", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ code: input, consentimiento: consent }),
    });
    const d = (await res.json().catch(() => ({}))) as { code?: string; error?: string };
    if (!res.ok) return setError(d.error ?? "No se pudo empezar.");
    setCode(d.code ?? null);
    setInput("");
    setConsent(false);
  }

  async function terminar() {
    await fetch("/api/taller", { method: "DELETE" });
    setCode(null);
  }

  if (code === undefined) return <p className="text-muted">Cargando…</p>;

  if (!code) {
    return (
      <form onSubmit={empezar} className="max-w-xl space-y-4 rounded-3xl border border-black/10 bg-white p-6 shadow-sm">
        <h2 className="text-xl font-bold">Nuevo participante</h2>
        <label className="block space-y-1">
          <span className="text-sm font-medium">Código del participante</span>
          <input
            value={input}
            onChange={(e) => setInput(e.target.value.toUpperCase())}
            placeholder="ej. T1-P01 (taller 1, participante 01)"
            className="w-full rounded-xl border border-black/15 px-4 py-3 text-lg uppercase"
            required
          />
          <span className="text-xs text-muted">No uses nombres ni cédulas. Anota el código en el consentimiento firmado.</span>
        </label>
        <label className="flex items-start gap-3">
          <input type="checkbox" className="mt-1 h-5 w-5" checked={consent} onChange={(e) => setConsent(e.target.checked)} />
          <span>El participante leyó y <strong>firmó el consentimiento informado</strong> antes de empezar.</span>
        </label>
        {error && <p role="alert" className="text-sm text-danger">{error}</p>}
        <button type="submit" disabled={!consent || !input} className="w-full rounded-xl bg-brand-700 px-5 py-3 text-lg font-semibold text-white disabled:opacity-50">
          Empezar con este participante
        </button>
      </form>
    );
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 rounded-3xl bg-brand-800 p-6 text-white sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-brand-100">Participante activo</p>
          <p className="text-4xl font-extrabold">{code}</p>
        </div>
        <button type="button" onClick={() => void terminar()} className="rounded-xl bg-white px-5 py-3 font-semibold text-brand-800">
          ✅ Terminar y pasar al siguiente
        </button>
      </div>
      <ol className="grid gap-3 sm:grid-cols-2">
        {PASOS.map((p, n) => (
          <li key={p.href}>
            <Link href={p.href} className="flex h-full items-start gap-4 rounded-2xl border border-black/10 bg-white p-5 hover:border-brand-300">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-brand-700 font-bold text-white">{n + 1}</span>
              <span>
                <span className="block text-lg font-semibold">{p.icon} {p.title}</span>
                <span className="block text-sm text-muted">{p.text}</span>
              </span>
            </Link>
          </li>
        ))}
      </ol>
      <p className="text-sm text-muted">
        Todo lo que haga en este navegador queda con el código <strong>{code}</strong>. Al terminar, toca
        «Terminar y pasar al siguiente» para que no se mezcle con el próximo participante.
      </p>
    </div>
  );
}
