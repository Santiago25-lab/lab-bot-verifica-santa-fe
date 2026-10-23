import type { Metadata, Viewport } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { BottomNav } from "@/components/BottomNav";
import { Logo } from "@/components/Logo";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "Verifica Santa Fe · ¿Es fraude ese mensaje?",
    template: "%s · Verifica Santa Fe",
  },
  description:
    "Verifica mensajes, links y capturas sospechosas antes de pagar o dar datos. Bot gratuito para comerciantes de la localidad de Santa Fe, Bogotá.",
};

export const viewport: Viewport = {
  themeColor: "#0a6f5a",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="es" className="h-full antialiased">
      <body className="flex min-h-full flex-col pb-[calc(4rem+env(safe-area-inset-bottom))] sm:pb-0">
        <a
          href="#contenido"
          className="sr-only z-50 rounded-lg bg-white px-4 py-2 focus:not-sr-only focus:fixed focus:left-2 focus:top-2"
        >
          Saltar al contenido
        </a>
        <header className="sticky top-0 z-20 print:hidden border-b border-black/5 bg-white/90 backdrop-blur">
          <nav className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3">
            <Link href="/" className="flex items-center gap-2 whitespace-nowrap font-semibold text-brand-800">
              <Logo className="h-8 w-8" />
              <span>Verifica Santa Fe</span>
            </Link>
            {/* En celular la navegación está abajo; arriba queda la llamada de emergencia. */}
            <a
              href="tel:165"
              className="rounded-full bg-red-50 px-3 py-2 text-sm font-bold text-danger sm:hidden"
              aria-label="Llamar a la línea 165 de la Policía"
            >
              📞 165
            </a>
            <div className="hidden items-center gap-2 whitespace-nowrap text-sm font-medium sm:flex">
              <Link href="/verificar" className="rounded-lg px-3 py-2 hover:bg-brand-50">
                Revisar mensaje
              </Link>
              <Link href="/aula" className="rounded-lg px-3 py-2 hover:bg-brand-50">
                Aula virtual
              </Link>
              <Link href="/ayuda" className="rounded-lg bg-red-50 px-3 py-2 font-semibold text-danger hover:bg-red-100">
                🆘 Ya caí
              </Link>
            </div>
          </nav>
        </header>
        <main id="contenido" className="flex-1">
          {children}
        </main>
        <footer className="border-t border-black/5 bg-white print:hidden">
          <div className="mx-auto flex max-w-6xl flex-col gap-3 px-4 py-6 text-sm text-muted sm:flex-row sm:items-center sm:justify-between">
            <p>
              ¿Ya caíste? Llama gratis a la <strong className="text-ink">línea 165</strong> de la
              Policía · Emergencias <strong className="text-ink">123</strong>
            </p>
            <div className="flex gap-4">
              <Link href="/privacidad" className="hover:text-ink">
                Aviso de privacidad
              </Link>
              <Link href="/admin" className="hover:text-ink">
                Equipo
              </Link>
            </div>
          </div>
        </footer>
        {/* Lee la ruta actual: va en Suspense para no frenar el resto de la página. */}
        <Suspense fallback={null}>
          <BottomNav />
        </Suspense>
      </body>
    </html>
  );
}
