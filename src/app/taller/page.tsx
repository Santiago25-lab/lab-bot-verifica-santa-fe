import type { Metadata } from "next";
import Link from "next/link";
import { TallerPanel } from "@/components/TallerPanel";

export const metadata: Metadata = {
  title: "Modo taller",
  robots: { index: false, follow: false },
};

export default function TallerPage() {
  return (
    <div className="mx-auto max-w-4xl space-y-6 px-4 py-8">
      <div>
        <p className="text-sm font-semibold text-brand-700">👥 Para el facilitador</p>
        <h1 className="text-3xl font-bold">Modo taller</h1>
        <p className="mt-2 max-w-2xl text-muted">
          Úsalo cuando varias personas comparten la misma tablet o celular. Cada participante recibe
          un código y sus pruebas y casos quedan separados, sin pedir nombres.
        </p>
      </div>
      <TallerPanel />
      <div className="grid gap-3 sm:grid-cols-2">
        <Link href="/taller/consentimiento" className="rounded-2xl border border-black/10 bg-white p-4 hover:border-brand-300">
          <span className="block font-semibold">🖨️ Consentimiento informado</span>
          <span className="block text-sm text-muted">Formato para imprimir y firmar antes del simulacro.</span>
        </Link>
        <Link href="/taller/observacion" className="rounded-2xl border border-black/10 bg-white p-4 hover:border-brand-300">
          <span className="block font-semibold">🖨️ Lista de observación</span>
          <span className="block text-sm text-muted">Para registrar lo que hace cada participante.</span>
        </Link>
        <Link href="/kit" className="rounded-2xl border border-black/10 bg-white p-4 hover:border-brand-300">
          <span className="block font-semibold">🖨️ Kit de 5 puntos (sticker)</span>
          <span className="block text-sm text-muted">Para pegar en la caja registradora.</span>
        </Link>
        <Link href="/afiche" className="rounded-2xl border border-black/10 bg-white p-4 hover:border-brand-300">
          <span className="block font-semibold">🖨️ Afiche con QR</span>
          <span className="block text-sm text-muted">Para que los comerciantes entren desde su celular.</span>
        </Link>
      </div>
    </div>
  );
}
