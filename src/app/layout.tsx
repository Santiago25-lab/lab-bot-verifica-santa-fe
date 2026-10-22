import type { Metadata, Viewport } from "next";
import Link from "next/link";
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
      <body className="flex min-h-full flex-col">
        <header className="sticky top-0 z-20 border-b border-black/5 bg-white/90 backdrop-blur">
          <nav className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3">
            <Link href="/" className="flex items-center gap-2 whitespace-nowrap font-semibold text-brand-800">
              <Logo className="h-8 w-8" />
              <span>Verifica Santa Fe</span>
            </Link>
            <div className="flex items-center gap-1 whitespace-nowrap text-sm font-medium sm:gap-2">
              <Link href="/verificar" className="rounded-lg px-2 py-2 hover:bg-brand-50 sm:px-3">
                Verificar
              </Link>
              <Link href="/aula" className="rounded-lg px-2 py-2 hover:bg-brand-50 sm:px-3">
                Aula<span className="hidden sm:inline"> virtual</span>
              </Link>
            </div>
          </nav>
        </header>
        <main className="flex-1">{children}</main>
        <footer className="border-t border-black/5 bg-white">
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
      </body>
    </html>
  );
}
