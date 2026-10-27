import type { Metadata } from "next";
import { PrintButton } from "@/components/PrintButton";
import { KIT } from "@/lib/kit";

export const metadata: Metadata = {
  title: "Lista de observación",
  robots: { index: false, follow: false },
};

const FILAS = 10;

/** Instrumento del testeo: el facilitador registra qué hace cada participante durante el simulacro. */
export default function ObservacionPage() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-6 print:max-w-none print:p-0">
      <style>{"@page { size: letter landscape; margin: 10mm; }"}</style>
      <div className="mb-4 flex items-center justify-between gap-3 print:hidden">
        <p className="text-sm text-muted">Una hoja por taller (10 participantes). Se imprime horizontal.</p>
        <PrintButton />
      </div>
      <article className="rounded-2xl border border-black/10 bg-white p-5 print:rounded-none print:border-0 print:p-0">
        <h1 className="text-xl font-bold">Lista de observación · Simulacro del taller móvil</h1>
        <div className="mt-2 grid grid-cols-2 gap-x-8 gap-y-1 text-sm sm:grid-cols-4 print:grid-cols-4">
          <p>Taller N°: ______</p>
          <p>Fecha: ____________</p>
          <p>Cuadra / sector: ____________</p>
          <p>Observador: ____________</p>
        </div>
        <p className="mt-2 text-xs text-muted">
          Marque ✓ si el participante revisa o menciona en voz alta cada punto del kit mientras analiza la falsa factura
          (caso 1). Criterio: identifica al menos 3 de las 5 señales.
        </p>
        <div className="mt-3 overflow-x-auto print:overflow-visible">
        <table className="w-full min-w-[56rem] border-collapse text-xs print:min-w-0">
          <thead>
            <tr className="bg-brand-50">
              <th className="border border-black/40 p-1">Código</th>
              {KIT.map((k) => (
                <th key={k.id} className="border border-black/40 p-1">
                  {k.icon} {k.title}
                </th>
              ))}
              <th className="border border-black/40 p-1">Total señales (0–5)</th>
              <th className="border border-black/40 p-1">¿Tocó link o adjunto? (S/N)</th>
              <th className="border border-black/40 p-1">¿Decidió «fraude»? (S/N)</th>
              <th className="border border-black/40 p-1">¿Usó el bot? (S/N)</th>
              <th className="border border-black/40 p-1">¿Entendió la respuesta del bot? (1–5)</th>
              <th className="w-[22%] border border-black/40 p-1">Observaciones (dudas, comentarios, dificultades)</th>
            </tr>
          </thead>
          <tbody>
            {Array.from({ length: FILAS }, (_, n) => (
              <tr key={n} className="h-9">
                <td className="border border-black/40 p-1 text-muted">T__-P{String(n + 1).padStart(2, "0")}</td>
                {Array.from({ length: KIT.length + 6 }, (_, c) => (
                  <td key={c} className="border border-black/40" />
                ))}
              </tr>
            ))}
          </tbody>
        </table>
        </div>
        <p className="mt-3 text-xs text-muted">
          Los datos del simulador digital (señales marcadas, decisiones y clics) se descargan desde el panel del equipo →
          Indicadores → «Eventos del bot (CSV)», filtrando el tipo «simulador» y el código del participante.
        </p>
      </article>
    </div>
  );
}
