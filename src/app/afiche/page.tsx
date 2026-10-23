import type { Metadata } from "next";
import QRCode from "qrcode";
import { Logo } from "@/components/Logo";
import { PrintButton } from "@/components/PrintButton";
import { PRE_SLUG } from "@/lib/data/defaults";

export const metadata: Metadata = {
  title: "Afiche con QR",
  robots: { index: false, follow: false },
};

const SITE = (process.env.NEXT_PUBLIC_SITE_URL || "https://lab-bot-verifica-santa-fe.vercel.app").replace(/\/$/, "");
const WA = (process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || "").replace(/\D/g, "");

const qr = (url: string) =>
  QRCode.toString(url, { type: "svg", margin: 1, errorCorrectionLevel: "M", color: { dark: "#0c483d", light: "#ffffff" } });

/** Afiche imprimible para la Escuela Móvil: los comerciantes escanean y empiezan. */
export default async function AfichePage() {
  const codes = [
    { title: "Revisar un mensaje", text: "Pega el mensaje sospechoso o sube una captura.", url: `${SITE}/verificar` },
    { title: "Prueba de entrada", text: "6 preguntas para saber cuánto reconoces hoy.", url: `${SITE}/aula/${PRE_SLUG}` },
    ...(WA
      ? [{ title: "Bot por WhatsApp", text: "Guárdalo y reenvíale los mensajes raros.", url: `https://wa.me/${WA}?text=Hola` }]
      : []),
  ];
  const svgs = await Promise.all(codes.map((c) => qr(c.url)));

  return (
    <div className="mx-auto max-w-4xl px-4 py-6 print:max-w-none print:p-0">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3 print:hidden">
        <p className="text-sm text-muted">Imprímelo en tamaño carta u oficio para la Escuela Móvil.</p>
        <PrintButton />
      </div>
      <article className="rounded-3xl border-4 border-brand-700 bg-white p-6 sm:p-10 print:rounded-none print:border-0">
        <header className="flex items-center gap-3">
          <Logo className="h-14 w-14" />
          <div>
            <p className="text-3xl font-extrabold text-brand-800">Verifica Santa Fe</p>
            <p className="text-muted">Bot anti-fraude gratis para comerciantes</p>
          </div>
        </header>
        <h1 className="mt-6 text-4xl font-extrabold leading-tight">
          ¿Te llegó un mensaje raro? <span className="text-brand-700">Revísalo antes de pagar.</span>
        </h1>
        <div className={`mt-8 grid gap-6 ${codes.length === 3 ? "sm:grid-cols-3" : "sm:grid-cols-2"}`}>
          {codes.map((c, i) => (
            <figure key={c.title} className="rounded-2xl border border-black/10 p-4 text-center">
              <div className="mx-auto w-44" dangerouslySetInnerHTML={{ __html: svgs[i] }} />
              <figcaption className="mt-3">
                <p className="text-xl font-bold">{c.title}</p>
                <p className="text-sm text-muted">{c.text}</p>
              </figcaption>
            </figure>
          ))}
        </div>
        <ol className="mt-8 grid gap-3 text-lg sm:grid-cols-3">
          <li>1️⃣ <strong>Escanea</strong> con la cámara del celular.</li>
          <li>2️⃣ <strong>Pega</strong> el mensaje que te llegó.</li>
          <li>3️⃣ <strong>Mira el color</strong>: 🔴 🟡 🟢 y sigue el consejo.</li>
        </ol>
        <p className="mt-8 rounded-2xl bg-danger px-5 py-4 text-center text-xl font-bold text-white">
          ¿Ya caíste? Llama gratis a la línea 165 de la Policía
        </p>
        <p className="mt-3 text-center text-sm text-muted">{SITE.replace(/^https?:\/\//, "")}</p>
      </article>
    </div>
  );
}
