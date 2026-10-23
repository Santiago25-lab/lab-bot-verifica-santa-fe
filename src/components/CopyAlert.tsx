"use client";

import { useState } from "react";

const ALERT =
  "⚠️ ALERTA VECINAL: están circulando mensajes falsos que se hacen pasar por bancos, la DIAN o Nequi. " +
  "No abras links, no compartas códigos y no envíes dinero. " +
  "Si te llega uno raro, revísalo gratis en Verifica Santa Fe. Denuncias: línea 165.";

export function CopyAlert() {
  const [copied, setCopied] = useState(false);
  async function copy() {
    try {
      await navigator.clipboard.writeText(`${ALERT} ${window.location.origin}`);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      setCopied(false);
    }
  }

  return (
    <div className="mt-4 rounded-2xl border border-black/10 bg-white p-4">
      <p className="bubble rounded-xl bg-[#d9fdd3] p-3 text-sm">{ALERT}</p>
      <div className="mt-3 grid gap-2 sm:grid-cols-2">
        <button
          type="button"
          onClick={() => void copy()}
          className="min-h-12 rounded-xl bg-brand-700 px-4 py-3 font-semibold text-white hover:bg-brand-800"
        >
          {copied ? "✓ Copiado" : "📋 Copiar mensaje"}
        </button>
        <a
          href={`https://wa.me/?text=${encodeURIComponent(ALERT)}`}
          target="_blank"
          rel="noopener noreferrer"
          className="flex min-h-12 items-center justify-center rounded-xl border-2 border-[#25d366] px-4 py-3 font-semibold text-[#128c4a]"
        >
          💬 Enviar por WhatsApp
        </a>
      </div>
    </div>
  );
}
