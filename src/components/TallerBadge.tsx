"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

/** Recordatorio flotante del modo taller: muestra el participante y lleva de vuelta al panel del taller. */
export function TallerBadge() {
  const path = usePathname();
  const [code, setCode] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/taller")
      .then((r) => r.json())
      .then((d: { code: string | null }) => setCode(d.code))
      .catch(() => setCode(null));
  }, [path]);

  if (!code || path.startsWith("/taller") || path.startsWith("/admin")) return null;
  return (
    <Link
      href="/taller"
      className="fixed bottom-[calc(4.5rem+env(safe-area-inset-bottom))] left-3 z-40 rounded-full bg-brand-800 px-4 py-2 text-sm font-semibold text-white shadow-lg print:hidden sm:bottom-4"
    >
      👥 {code} · volver al taller
    </Link>
  );
}
