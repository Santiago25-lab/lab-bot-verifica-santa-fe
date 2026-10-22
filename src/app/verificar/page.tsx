import type { Metadata } from "next";
import { Chat } from "@/components/Chat";

export const metadata: Metadata = {
  title: "Verificar un mensaje",
  description: "Pega un mensaje, link o captura sospechosa y te decimos si tiene señales de fraude.",
};

export default function VerificarPage() {
  return (
    <div className="mx-auto grid max-w-6xl gap-6 px-4 py-6 lg:grid-cols-[1fr_320px]">
      <Chat />
      <aside className="space-y-4 text-sm">
        <div className="rounded-2xl border border-black/5 bg-white p-5">
          <h1 className="text-lg font-bold">Cómo usarlo</h1>
          <ol className="mt-3 list-decimal space-y-2 pl-5 text-muted">
            <li>Copia el mensaje sospechoso y pégalo, o sube una captura con 📷.</li>
            <li>Mira el semáforo: 🔴 peligroso, 🟡 sospechoso, 🟢 sin señales evidentes.</li>
            <li>Si ya pagaste o diste datos, elige «Ya caí» y sigue los pasos.</li>
          </ol>
        </div>
        <div className="rounded-2xl border border-black/5 bg-white p-5">
          <h2 className="font-semibold">🔒 Tu privacidad</h2>
          <p className="mt-2 text-muted">
            Analizamos el mensaje y lo descartamos. Solo guardamos estadísticas anónimas (por
            ejemplo, cuántos mensajes salieron peligrosos), nunca el texto ni tu número.
          </p>
        </div>
      </aside>
    </div>
  );
}
