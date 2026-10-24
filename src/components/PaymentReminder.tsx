"use client";

import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";

// "admin" = solo en el panel del equipo; "todo" = en todas las páginas. Vacío = desactivado.
const MODE = process.env.NEXT_PUBLIC_AVISO_PAGO;
const EVERY_MS = 2 * 60_000;

/** Recordatorio de pago pendiente del desarrollo. Se quita borrando NEXT_PUBLIC_AVISO_PAGO en Vercel. */
export function PaymentReminder() {
  const pathname = usePathname();
  const active = MODE === "todo" || (MODE === "admin" && pathname.startsWith("/admin"));
  // Sale apenas se entra a la página y luego cada 2 minutos.
  const [open, setOpen] = useState(active);
  const closeRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!active) return;
    const timer = setInterval(() => setOpen(true), EVERY_MS);
    return () => clearInterval(timer);
  }, [active]);

  useEffect(() => {
    if (!open) return;
    closeRef.current?.focus();
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  if (!active || !open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 print:hidden" onClick={() => setOpen(false)}>
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="aviso-pago-titulo"
        className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <p id="aviso-pago-titulo" className="text-xl font-bold">
          👋 Hola, te recordamos que tienes pendiente el 50% del pago
        </p>
        <p className="mt-3 text-muted">
          Para que esta ventana ya no salga, recuerda hacer tu pago. Al hacer el pago, esta ventana no
          volverá a aparecer.
        </p>
        <button
          ref={closeRef}
          type="button"
          onClick={() => setOpen(false)}
          className="mt-5 w-full rounded-lg bg-brand-700 px-4 py-3 font-semibold text-white hover:bg-brand-800"
        >
          Entendido
        </button>
      </div>
    </div>
  );
}
