"use client";

export function PrintButton() {
  return (
    <button
      type="button"
      onClick={() => window.print()}
      className="min-h-12 rounded-xl bg-brand-700 px-5 py-3 font-semibold text-white hover:bg-brand-800 print:hidden"
    >
      🖨️ Imprimir o guardar en PDF
    </button>
  );
}
