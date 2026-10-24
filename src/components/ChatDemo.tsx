"use client";

import { useEffect, useState } from "react";

interface Scene {
  user: string;
  verdict: "red" | "yellow";
  title: string;
  points: string[];
  tip: string;
}

const SCENES: Scene[] = [
  {
    user: "Hola, somos de Bancolombia. Compártenos el código que te llegó para cancelar la compra.",
    verdict: "red",
    title: "PELIGROSO",
    points: ["Te pide compartir un código. Ningún banco te lo pide nunca."],
    tip: "💡 Los códigos por SMS son la llave de tu cuenta: no se comparten.",
  },
  {
    user: "DIAN: su RUT presenta embargo. Pague hoy en dian-pagos.com",
    verdict: "red",
    title: "PELIGROSO",
    points: ["dian-pagos.com no es de la DIAN. El oficial es dian.gov.co.", "Te apuran con un embargo."],
    tip: "💡 Las entidades públicas usan direcciones que terminan en .gov.co.",
  },
  {
    user: "Mamá cambié de número, guárdalo. Necesito que me consignes 300 mil ya 🙏",
    verdict: "yellow",
    title: "SOSPECHOSO",
    points: ["Dice ser un familiar con número nuevo.", "Pide dinero con urgencia."],
    tip: "👉 Llama al número que ya tenías antes de enviar plata.",
  },
  {
    user: "📷 Captura: «Envío exitoso Nequi $250.000»",
    verdict: "yellow",
    title: "SOSPECHOSO",
    points: ["Es un pantallazo de pago: se puede editar."],
    tip: "👉 Abre TU app y confirma que el dinero llegó antes de entregar.",
  },
];

type Phase = "typing" | "sent" | "read" | "thinking" | "answer" | "buttons" | "leaving";

// Cuánto dura cada fase antes de pasar a la siguiente (ms).
const NEXT: Record<Exclude<Phase, "typing">, [Phase | "next", number]> = {
  sent: ["read", 500],
  read: ["thinking", 400],
  thinking: ["answer", 1400],
  answer: ["buttons", 700],
  buttons: ["leaving", 3800],
  leaving: ["next", 500],
};

/** Conversación de ejemplo del inicio: se escribe, se envía y el bot responde, como en WhatsApp. */
export function ChatDemo() {
  const [i, setI] = useState(0);
  const [typed, setTyped] = useState(0);
  const [phase, setPhase] = useState<Phase>("typing");
  const [still, setStill] = useState(false);
  const scene = SCENES[i];

  useEffect(() => {
    // Con "reducir movimiento" se muestra la conversación terminada, sin animar.
    const t = setTimeout(() => {
      if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
        setStill(true);
        setPhase("buttons");
      }
    }, 0);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    if (still) return;
    if (phase === "typing") {
      const step = Math.max(1, Math.ceil(scene.user.length / 45));
      const t = setTimeout(
        () => {
          if (typed >= scene.user.length) setPhase("sent");
          else setTyped((n) => Math.min(scene.user.length, n + step));
        },
        typed === 0 ? 700 : typed >= scene.user.length ? 350 : 40,
      );
      return () => clearTimeout(t);
    }
    const [next, ms] = NEXT[phase];
    const t = setTimeout(() => {
      if (next === "next") {
        setI((n) => (n + 1) % SCENES.length);
        setTyped(0);
        setPhase("typing");
      } else setPhase(next);
    }, ms);
    return () => clearTimeout(t);
  }, [phase, typed, scene, still]);

  const shown = still ? "buttons" : phase;
  const sent = shown !== "typing";
  const answered = ["answer", "buttons", "leaving"].includes(shown);
  const draft = still || sent ? "" : scene.user.slice(0, typed);

  return (
    <div className="mx-auto w-full max-w-sm rounded-[2rem] border border-black/10 bg-white p-3 shadow-xl" aria-hidden="true">
      <div className="flex items-center gap-2 rounded-t-[1.5rem] bg-brand-800 px-4 py-3 text-white">
        <span className="flex h-9 w-9 items-center justify-center rounded-full bg-white/20">🛡️</span>
        <div>
          <p className="text-sm font-semibold">Verifica Santa Fe</p>
          <p className="text-xs text-brand-100">{shown === "thinking" ? "escribiendo…" : "en línea"}</p>
        </div>
      </div>

      <div
        className={`flex h-[21rem] flex-col justify-end gap-3 overflow-hidden bg-[#efeae2] p-4 text-sm transition-opacity duration-500 ${
          shown === "leaving" ? "opacity-0" : "opacity-100"
        }`}
      >
        {sent && (
          <div className="demo-msg ml-auto max-w-[85%] rounded-xl rounded-tr-sm bg-[#d9fdd3] px-3 pb-1.5 pt-2 shadow-sm">
            <p>{scene.user}</p>
            <p className="mt-0.5 text-right text-[0.65rem] text-black/45">
              10:42{" "}
              <span className={shown === "sent" ? "text-black/40" : "text-sky-500"}>✓✓</span>
            </p>
          </div>
        )}

        {shown === "thinking" && (
          <div className="demo-msg flex w-16 items-center justify-center gap-1 rounded-xl rounded-tl-sm bg-white px-3 py-3 shadow-sm">
            <span className="typing-dot" />
            <span className="typing-dot [animation-delay:0.15s]" />
            <span className="typing-dot [animation-delay:0.3s]" />
          </div>
        )}

        {answered && (
          <div className="demo-msg max-w-[90%] rounded-xl rounded-tl-sm bg-white px-3 pb-1.5 pt-2 shadow-sm">
            <p className="font-bold">
              {scene.verdict === "red" ? "🔴" : "🟡"} {scene.title}
            </p>
            {scene.points.map((p) => (
              <p key={p} className="mt-1">
                • {p}
              </p>
            ))}
            <p className="mt-2">{scene.tip}</p>
            <p className="mt-0.5 text-right text-[0.65rem] text-black/45">10:42</p>
          </div>
        )}

        {(shown === "buttons" || shown === "leaving") && (
          <div className="demo-msg flex flex-wrap gap-2">
            <span className="rounded-full border border-brand-600 bg-white px-3 py-1 text-brand-800">Sí, ya actué</span>
            <span className="rounded-full border border-brand-600 bg-white px-3 py-1 text-brand-800">No, todavía no</span>
          </div>
        )}
      </div>

      {/* Barra para escribir, como en WhatsApp */}
      <div className="flex items-center gap-2 rounded-b-[1.5rem] bg-[#efeae2] px-3 pb-3">
        {/* justify-end: mientras se escribe se ve el final del texto, como en el celular */}
        <div
          className={`flex min-h-10 min-w-0 flex-1 items-center overflow-hidden whitespace-nowrap rounded-full bg-white px-4 py-2 text-sm ${
            draft ? "justify-end" : ""
          }`}
        >
          {draft ? (
            <>
              {draft}
              <span className="typing-caret" />
            </>
          ) : (
            <span className="text-black/40">Mensaje</span>
          )}
        </div>
        <span
          className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-brand-700 text-white transition-transform ${
            phase === "sent" && !still ? "scale-90" : ""
          }`}
        >
          ➤
        </span>
      </div>
    </div>
  );
}
