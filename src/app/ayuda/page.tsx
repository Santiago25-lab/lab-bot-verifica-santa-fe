import type { Metadata } from "next";
import Link from "next/link";
import { CopyAlert } from "@/components/CopyAlert";
import { TRIAGE_CASES } from "@/lib/bot/conversation";
import type { TriageCase } from "@/lib/types";

export const metadata: Metadata = {
  title: "Ya caí: ayuda urgente",
  description: "Qué hacer si pagaste, diste datos o te están extorsionando. Línea 165 de la Policía.",
};

const ICONS: Record<TriageCase, string> = { pago: "💸", datos: "🔑", extorsion: "⚠️", clic: "👆" };

export default function AyudaPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-6 sm:py-10">
      <h1 className="text-3xl font-extrabold">¿Ya caíste? Actúa ahora</h1>
      <p className="mt-2 text-lg text-muted">
        No te preocupes, le pasa a mucha gente. Lo más importante es actuar rápido.
      </p>

      <div className="mt-6 grid gap-3 sm:grid-cols-2">
        <a href="tel:165" className="flex min-h-16 items-center gap-3 rounded-2xl bg-danger px-5 py-4 text-white shadow-lg">
          <span className="text-3xl" aria-hidden="true">📞</span>
          <span>
            <span className="block text-xl font-bold">Llamar al 165</span>
            <span className="block text-sm text-red-100">Policía · fraudes y extorsión · gratis 24 h</span>
          </span>
        </a>
        <a href="tel:123" className="flex min-h-16 items-center gap-3 rounded-2xl border-2 border-danger bg-white px-5 py-4">
          <span className="text-3xl" aria-hidden="true">🚨</span>
          <span>
            <span className="block text-xl font-bold">Emergencia 123</span>
            <span className="block text-sm text-muted">Si hay peligro inmediato</span>
          </span>
        </a>
        <div className="flex min-h-16 items-center gap-3 rounded-2xl border border-black/10 bg-white px-5 py-4">
          <span className="text-3xl" aria-hidden="true">🏦</span>
          <span>
            <span className="block text-lg font-bold">Llama a tu banco</span>
            <span className="block text-sm text-muted">El número está detrás de tu tarjeta o en la app</span>
          </span>
        </div>
        <a
          href="https://caivirtual.policia.gov.co"
          target="_blank"
          rel="noopener noreferrer"
          className="flex min-h-16 items-center gap-3 rounded-2xl border border-black/10 bg-white px-5 py-4"
        >
          <span className="text-3xl" aria-hidden="true">💻</span>
          <span>
            <span className="block text-lg font-bold">Denunciar en línea</span>
            <span className="block text-sm text-muted">CAI Virtual de la Policía ↗</span>
          </span>
        </a>
      </div>

      <h2 className="mt-10 text-2xl font-bold">¿Qué te pasó?</h2>
      <p className="text-muted">Toca tu caso para ver los pasos.</p>
      <div className="mt-4 space-y-3">
        {(Object.keys(TRIAGE_CASES) as TriageCase[]).map((c, i) => (
          <details key={c} open={i === 0} className="group rounded-2xl border border-black/10 bg-white">
            <summary className="flex min-h-14 cursor-pointer list-none items-center gap-3 px-5 py-3 text-lg font-bold">
              <span className="text-2xl" aria-hidden="true">{ICONS[c]}</span>
              <span className="flex-1">{TRIAGE_CASES[c].title}</span>
              <span className="transition group-open:rotate-180 motion-reduce:transition-none" aria-hidden="true">⌄</span>
            </summary>
            <ol className="space-y-2 px-5 pb-5">
              {TRIAGE_CASES[c].steps.map((s, j) => (
                <li key={s} className="flex gap-3">
                  <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-brand-700 text-sm font-bold text-white">
                    {j + 1}
                  </span>
                  <span className="pt-0.5">{s}</span>
                </li>
              ))}
            </ol>
          </details>
        ))}
      </div>

      <h2 className="mt-10 text-2xl font-bold">Avisa a tu frente de seguridad</h2>
      <p className="text-muted">Copia este mensaje y reenvíalo al grupo de tu cuadra para que nadie más caiga.</p>
      <CopyAlert />

      <p className="mt-10 text-center">
        <Link href="/verificar" className="font-semibold text-brand-700 underline">
          ¿Aún no sabes si es fraude? Revisa el mensaje aquí
        </Link>
      </p>
    </div>
  );
}
