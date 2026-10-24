"use client";

import { useEffect, useState } from "react";

const TIPS = [
  "¡No caigas en la estafa! 👍",
  "Nadie de verdad te pide el código del SMS 🔑",
  "Antes de entregar, mira TU app del banco 📱",
  "¿Te llegó algo raro? Revísalo aquí primero 🔍",
  "¿Ya caíste? Llama gratis a la línea 165 📞",
];

const NAVY = "#1c2740";
const NAVY_DARK = "#111a2e";
const NEON = "#d4f53c";
const SKIN = "#e7b58a";
const SKIN_DARK = "#cf9a6c";

/** Agente animado (dibujo propio, sin escudos oficiales) que levanta el pulgar y da consejos. */
export function PoliceMascot() {
  const [tip, setTip] = useState(0);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const t = setInterval(() => setTip((n) => (n + 1) % TIPS.length), 4000);
    return () => clearInterval(t);
  }, []);

  return (
    <div className="flex items-end gap-2">
      <svg viewBox="0 0 220 300" className="mascot h-44 w-auto shrink-0 sm:h-52" role="img" aria-label="Agente de policía animado levantando el pulgar">
        <ellipse cx="110" cy="292" rx="58" ry="7" fill="#000" opacity="0.12" />
        <g className="mascot-body">
          {/* Piernas y botas */}
          <rect x="80" y="232" width="25" height="50" rx="8" fill={NAVY_DARK} />
          <rect x="115" y="232" width="25" height="50" rx="8" fill={NAVY_DARK} />
          <rect x="74" y="274" width="34" height="13" rx="6" fill="#0a0a0a" />
          <rect x="112" y="274" width="34" height="13" rx="6" fill="#0a0a0a" />

          {/* Brazo izquierdo, abajo */}
          <path d="M66 166 Q50 196 54 226" stroke={NAVY} strokeWidth="20" strokeLinecap="round" fill="none" />
          <circle cx="54" cy="230" r="11" fill={SKIN} />

          {/* Torso y chaleco */}
          <rect x="60" y="152" width="100" height="90" rx="24" fill={NAVY} />
          <path d="M66 168 Q66 156 80 154 L140 154 Q154 156 154 168 L154 236 Q110 246 66 236 Z" fill={NAVY_DARK} />
          <path d="M100 154 L110 172 L120 154" fill={SKIN} />
          <rect x="60" y="152" width="22" height="9" rx="4" fill={NEON} />
          <rect x="138" y="152" width="22" height="9" rx="4" fill={NEON} />
          {/* Radio */}
          <rect x="78" y="172" width="11" height="17" rx="2" fill="#0a0a0a" />
          <rect x="82" y="164" width="3" height="9" fill="#0a0a0a" />
          <text x="110" y="208" textAnchor="middle" fontSize="15" fontWeight="900" fill={NEON} fontFamily="system-ui, sans-serif" letterSpacing="0.5">
            POLICÍA
          </text>
          {/* Franja de cuadros */}
          <g>
            {Array.from({ length: 11 }, (_, k) => (
              <rect key={k} x={70 + k * 7.6} y={216 + (k % 2) * 4} width="7.6" height="4" fill={NEON} />
            ))}
            <rect x="70" y="216" width="83.6" height="8" fill="none" stroke={NEON} strokeWidth="1" />
          </g>

          {/* Cabeza */}
          <circle cx="70" cy="112" r="9" fill={SKIN_DARK} />
          <circle cx="150" cy="112" r="9" fill={SKIN_DARK} />
          <rect x="100" y="138" width="20" height="18" fill={SKIN_DARK} />
          <circle cx="110" cy="108" r="40" fill={SKIN} />
          <circle cx="90" cy="127" r="6" fill="#f08a7a" opacity="0.45" />
          <circle cx="130" cy="127" r="6" fill="#f08a7a" opacity="0.45" />
          <path d="M89 105 q7 -5 14 0" stroke="#3b2414" strokeWidth="3.5" strokeLinecap="round" fill="none" />
          <path d="M117 105 q7 -5 14 0" stroke="#3b2414" strokeWidth="3.5" strokeLinecap="round" fill="none" />
          <g className="mascot-eyes">
            <ellipse cx="96" cy="115" rx="4.5" ry="5.5" fill="#1b1b1b" />
            <ellipse cx="124" cy="115" rx="4.5" ry="5.5" fill="#1b1b1b" />
            <circle cx="97.5" cy="113" r="1.5" fill="#fff" />
            <circle cx="125.5" cy="113" r="1.5" fill="#fff" />
          </g>
          <path d="M97 129 Q110 145 123 129 Z" fill="#7a2a1c" />
          <path d="M99 130 Q110 135 121 130 Z" fill="#fff" />

          {/* Gorra */}
          <path d="M68 90 Q66 50 110 46 Q154 50 152 90 Z" fill={NAVY} />
          <rect x="68" y="80" width="84" height="10" fill={NAVY_DARK} />
          <text x="110" y="75" textAnchor="middle" fontSize="11" fontWeight="900" fill={NEON} fontFamily="system-ui, sans-serif">
            POLICÍA
          </text>
          <path d="M64 88 Q110 96 156 88 L158 93 Q110 104 62 93 Z" fill="#0a0f1c" />

          {/* Brazo derecho con el pulgar arriba */}
          <g className="mascot-arm">
            <path d="M154 166 Q176 150 184 122" stroke={NAVY} strokeWidth="20" strokeLinecap="round" fill="none" />
            <rect x="175" y="112" width="20" height="6" rx="3" fill={NEON} />
            <g className="mascot-thumb">
              <rect x="172" y="92" width="26" height="24" rx="8" fill={SKIN} />
              <rect x="179" y="72" width="10" height="26" rx="5" fill={SKIN} />
              <path d="M174 100 h20 M174 106 h20" stroke={SKIN_DARK} strokeWidth="1.6" strokeLinecap="round" />
            </g>
          </g>
        </g>
      </svg>

      <div className="relative mb-24 rounded-2xl rounded-bl-sm border-2 border-brand-700 bg-white px-4 py-3 shadow-md sm:mb-28">
        <p key={tip} className="mascot-tip text-base font-bold leading-snug text-brand-900 sm:text-lg" aria-live="polite">
          {TIPS[tip]}
        </p>
      </div>
    </div>
  );
}
