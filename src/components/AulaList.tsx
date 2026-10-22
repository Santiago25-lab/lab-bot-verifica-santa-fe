"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

interface Item {
  slug: string;
  title: string;
  description: string;
  kind: "prueba" | "encuesta";
  questions: number;
}

export function AulaList() {
  const [items, setItems] = useState<Item[] | null>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    fetch("/api/aula")
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then(setItems)
      .catch(() => setError(true));
  }, []);

  if (error) return <p className="text-danger">No pudimos cargar el aula. Intenta de nuevo.</p>;
  if (!items) return <p className="text-muted">Cargando…</p>;
  if (!items.length) return <p className="text-muted">Todavía no hay pruebas publicadas.</p>;

  return (
    <div className="grid gap-4 md:grid-cols-3">
      {items.map((q) => (
        <Link
          key={q.slug}
          href={`/aula/${q.slug}`}
          className="group flex flex-col rounded-2xl border border-black/5 bg-white p-6 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
        >
          <span
            className={`w-fit rounded-full px-3 py-1 text-xs font-semibold ${
              q.kind === "prueba" ? "bg-brand-100 text-brand-800" : "bg-amber-100 text-amber-900"
            }`}
          >
            {q.kind === "prueba" ? "Prueba" : "Encuesta"} · {q.questions} preguntas
          </span>
          <h2 className="mt-3 text-lg font-semibold">{q.title}</h2>
          <p className="mt-1 flex-1 text-sm text-muted">{q.description}</p>
          <span className="mt-4 font-semibold text-brand-700 group-hover:underline">Empezar →</span>
        </Link>
      ))}
    </div>
  );
}
