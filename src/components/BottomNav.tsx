"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const ITEMS = [
  { href: "/", icon: "🏠", label: "Inicio" },
  { href: "/verificar", icon: "🔍", label: "Revisar" },
  { href: "/simulador", icon: "🎯", label: "Practicar" },
  { href: "/ayuda", icon: "🆘", label: "Ya caí" },
];

/** Barra inferior para celular: las cuatro acciones siempre a un toque. */
export function BottomNav() {
  const path = usePathname();
  if (path.startsWith("/admin")) return null;
  return (
    <nav
      aria-label="Navegación principal"
      className="fixed inset-x-0 bottom-0 z-30 print:hidden border-t border-black/10 bg-white/95 pb-[env(safe-area-inset-bottom)] backdrop-blur sm:hidden"
    >
      <ul className="grid grid-cols-4">
        {ITEMS.map((item) => {
          const active = item.href === "/" ? path === "/" : path.startsWith(item.href);
          return (
            <li key={item.href}>
              <Link
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={`flex min-h-16 flex-col items-center justify-center gap-0.5 text-xs font-semibold ${
                  active ? "text-brand-800" : "text-muted"
                } ${item.href === "/ayuda" ? "text-danger" : ""}`}
              >
                <span className={`text-2xl ${active ? "" : "opacity-80"}`} aria-hidden="true">
                  {item.icon}
                </span>
                {item.label}
                <span className={`h-1 w-6 rounded-full ${active ? "bg-brand-600" : "bg-transparent"}`} aria-hidden="true" />
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
