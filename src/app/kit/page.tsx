import type { Metadata } from "next";
import QRCode from "qrcode";
import { Logo } from "@/components/Logo";
import { PrintButton } from "@/components/PrintButton";
import { KIT } from "@/lib/kit";

export const metadata: Metadata = {
  title: "Kit de verificación de 5 puntos",
  description: "Sticker para la caja registradora: 5 preguntas antes de pagar, abrir un link o descargar un archivo.",
};

const SITE = (process.env.NEXT_PUBLIC_SITE_URL || "https://lab-bot-verifica-santa-fe.vercel.app").replace(/\/$/, "");

/** Sticker imprimible para la caja registradora (dos por hoja carta). */
export default async function KitPage() {
  const qr = await QRCode.toString(`${SITE}/verificar`, {
    type: "svg",
    margin: 0,
    errorCorrectionLevel: "M",
    color: { dark: "#0c483d", light: "#ffffff" },
  });
  const sticker = (
    <article className="break-inside-avoid rounded-3xl border-4 border-brand-700 bg-white p-5">
      <header className="flex items-center gap-3">
        <Logo className="h-10 w-10" />
        <div>
          <p className="text-xl font-extrabold leading-tight text-brand-800">Antes de pagar, revisa 5 puntos</p>
          <p className="text-sm text-muted">Kit de verificación · Verifica Santa Fe</p>
        </div>
      </header>
      <ol className="mt-4 space-y-2">
        {KIT.map((k, i) => (
          <li key={k.id} className="flex items-center gap-3 rounded-xl bg-brand-50 px-3 py-2">
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-brand-700 font-bold text-white">{i + 1}</span>
            <span className="text-2xl" aria-hidden="true">{k.icon}</span>
            <span>
              <span className="block font-bold leading-tight">{k.title}</span>
              <span className="block text-sm leading-tight">{k.question}</span>
            </span>
          </li>
        ))}
      </ol>
      <div className="mt-4 flex items-center gap-4">
        <div className="w-24 shrink-0" dangerouslySetInnerHTML={{ __html: qr }} />
        <div className="text-sm">
          <p className="font-bold">¿Tienes dudas? Escanea y revisa el mensaje.</p>
          <p className="mt-1">Con una sola señal: <strong>no pagues, no abras, no respondas</strong>.</p>
          <p className="mt-1 font-bold text-danger">¿Ya caíste? Llama gratis al 165</p>
        </div>
      </div>
    </article>
  );
  return (
    <div className="mx-auto max-w-3xl px-4 py-6 print:max-w-none print:p-0">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3 print:hidden">
        <p className="text-sm text-muted">Imprime, recorta y pega el kit cerca de la caja registradora.</p>
        <PrintButton />
      </div>
      <div className="grid gap-6 print:grid-cols-2 print:gap-4">
        {sticker}
        <div className="hidden print:block">{sticker}</div>
      </div>
    </div>
  );
}
