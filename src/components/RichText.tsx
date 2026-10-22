import { Fragment } from "react";

/**
 * Muestra el formato de WhatsApp (*negrita* y _cursiva_).
 * A propósito NO convierte los links en enlaces: pueden ser fraudulentos.
 */
export function RichText({ text }: { text: string }) {
  const parts = text.split(/(\*[^*\n]+\*|_[^_\n]+_)/g);
  return (
    <>
      {parts.map((p, i) => {
        if (/^\*[^*]+\*$/.test(p)) return <strong key={i}>{p.slice(1, -1)}</strong>;
        if (/^_[^_]+_$/.test(p)) return <em key={i}>{p.slice(1, -1)}</em>;
        return <Fragment key={i}>{p}</Fragment>;
      })}
    </>
  );
}
