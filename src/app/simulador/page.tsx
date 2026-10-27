import type { Metadata } from "next";
import { Simulador } from "@/components/Simulador";
import { KIT } from "@/lib/kit";

export const metadata: Metadata = {
  title: "Simulador de casos",
  description: "Practica con mensajes falsos y reales usando el kit de verificación de 5 puntos.",
};

export default function SimuladorPage() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <p className="text-sm font-semibold text-brand-700">🎯 Capacitación</p>
      <h1 className="text-3xl font-bold sm:text-4xl">Simulador de casos</h1>
      <p className="mt-2 max-w-2xl text-muted">
        Revisa mensajes como los que llegan a tu negocio y descubre si caerías. Usa el kit de 5
        puntos: el mismo del sticker de tu caja registradora.
      </p>
      <ul className="mt-5 flex flex-wrap gap-2" aria-label="Kit de verificación">
        {KIT.map((k) => (
          <li key={k.id} className="rounded-full border border-brand-200 bg-white px-3 py-1 text-sm font-semibold text-brand-800">
            {k.icon} {k.title}
          </li>
        ))}
      </ul>
      <div className="mt-8">
        <Simulador />
      </div>
    </div>
  );
}
