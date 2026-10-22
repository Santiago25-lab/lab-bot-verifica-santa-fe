"use client";

import { useEffect, useState } from "react";
import type { Quiz, QuizQuestion } from "@/lib/types";
import { api } from "./api";

const LIKERT = [
  "1 · Totalmente en desacuerdo",
  "2 · En desacuerdo",
  "3 · Ni de acuerdo ni en desacuerdo",
  "4 · De acuerdo",
  "5 · Totalmente de acuerdo",
];

type Draft = Omit<Quiz, "id"> & { id?: string };

const empty = (): Draft => ({
  slug: "",
  title: "",
  description: "",
  kind: "prueba",
  published: false,
  sort: 10,
  questions: [newQuestion("prueba")],
});

function newQuestion(kind: Quiz["kind"]): QuizQuestion {
  return kind === "prueba"
    ? { id: "", prompt: "", options: ["🚩 Es fraude", "✅ Es real"], correct_index: 0, explanation: "" }
    : { id: "", prompt: "", options: [...LIKERT] };
}

const input = "w-full rounded-lg border border-black/10 bg-white px-3 py-2 text-sm";

export function QuizEditor() {
  const [quizzes, setQuizzes] = useState<Quiz[] | null>(null);
  const [draft, setDraft] = useState<Draft | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const load = () =>
    api<Quiz[]>("/api/admin/quizzes")
      .then(setQuizzes)
      .catch((e) => setError(e.message));

  useEffect(() => {
    void load();
  }, []);

  const setQ = (i: number, patch: Partial<QuizQuestion>) =>
    setDraft((d) => d && { ...d, questions: d.questions.map((q, j) => (j === i ? { ...q, ...patch } : q)) });

  async function save(e: React.FormEvent) {
    e.preventDefault();
    if (!draft) return;
    setSaving(true);
    setError(null);
    try {
      await api(draft.id ? `/api/admin/quizzes/${encodeURIComponent(draft.id)}` : "/api/admin/quizzes", {
        method: draft.id ? "PUT" : "POST",
        body: JSON.stringify(draft),
      });
      setDraft(null);
      await load();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setSaving(false);
    }
  }

  async function remove(q: Quiz) {
    if (!confirm(`¿Eliminar «${q.title}»? Las respuestas ya guardadas se conservan.`)) return;
    await api(`/api/admin/quizzes/${encodeURIComponent(q.id)}`, { method: "DELETE" }).catch((e) => setError(e.message));
    await load();
  }

  return (
    <section className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="text-xl font-bold">Aula virtual</h2>
          <p className="text-sm text-muted">
            Pruebas (con respuesta correcta) y encuestas (de opinión). Solo se ven las publicadas.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setDraft(empty())}
          className="rounded-lg bg-brand-700 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-800"
        >
          + Nueva prueba o encuesta
        </button>
      </div>

      {error && <p role="alert" className="rounded-lg bg-red-50 p-3 text-sm text-danger">{error}</p>}

      {draft && (
        <form onSubmit={save} className="space-y-5 rounded-2xl border border-brand-200 bg-brand-50 p-5">
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="space-y-1 text-sm font-medium">
              Título
              <input className={input} value={draft.title} onChange={(e) => setDraft({ ...draft, title: e.target.value })} />
            </label>
            <label className="space-y-1 text-sm font-medium">
              Enlace (slug)
              <input
                className={input}
                value={draft.slug}
                placeholder="ej. prueba-dian"
                onChange={(e) => setDraft({ ...draft, slug: e.target.value })}
              />
            </label>
            <label className="space-y-1 text-sm font-medium sm:col-span-2">
              Descripción
              <input className={input} value={draft.description} onChange={(e) => setDraft({ ...draft, description: e.target.value })} />
            </label>
            <label className="space-y-1 text-sm font-medium">
              Tipo
              <select
                className={input}
                value={draft.kind}
                onChange={(e) => {
                  const kind = e.target.value as Quiz["kind"];
                  setDraft({ ...draft, kind, questions: draft.questions.map((q) => ({ ...newQuestion(kind), ...q, correct_index: kind === "prueba" ? (q.correct_index ?? 0) : undefined })) });
                }}
              >
                <option value="prueba">Prueba (con respuesta correcta)</option>
                <option value="encuesta">Encuesta (opinión)</option>
              </select>
            </label>
            <label className="space-y-1 text-sm font-medium">
              Orden
              <input type="number" className={input} value={draft.sort} onChange={(e) => setDraft({ ...draft, sort: Number(e.target.value) })} />
            </label>
            <label className="flex items-center gap-2 text-sm font-medium">
              <input type="checkbox" className="h-4 w-4" checked={draft.published} onChange={(e) => setDraft({ ...draft, published: e.target.checked })} />
              Publicada (visible en el aula)
            </label>
          </div>

          <div className="space-y-4">
            {draft.questions.map((q, i) => (
              <fieldset key={i} className="space-y-3 rounded-xl border border-black/10 bg-white p-4">
                <legend className="px-1 text-sm font-semibold">Pregunta {i + 1}</legend>
                <label className="block space-y-1 text-sm font-medium">
                  Pregunta
                  <input className={input} value={q.prompt} onChange={(e) => setQ(i, { prompt: e.target.value })} />
                </label>
                <label className="block space-y-1 text-sm font-medium">
                  Mensaje de ejemplo (opcional, se muestra como chat)
                  <textarea rows={2} className={input} value={q.scenario ?? ""} onChange={(e) => setQ(i, { scenario: e.target.value })} />
                </label>
                <label className="block space-y-1 text-sm font-medium">
                  Opciones (una por línea)
                  <textarea
                    rows={Math.max(2, q.options.length)}
                    className={input}
                    value={q.options.join("\n")}
                    onChange={(e) => setQ(i, { options: e.target.value.split("\n") })}
                  />
                </label>
                {draft.kind === "prueba" && (
                  <div className="grid gap-3 sm:grid-cols-2">
                    <label className="space-y-1 text-sm font-medium">
                      Respuesta correcta
                      <select
                        className={input}
                        value={q.correct_index ?? 0}
                        onChange={(e) => setQ(i, { correct_index: Number(e.target.value) })}
                      >
                        {q.options.map((o, j) => (
                          <option key={j} value={j}>
                            {o || `Opción ${j + 1}`}
                          </option>
                        ))}
                      </select>
                    </label>
                    <label className="space-y-1 text-sm font-medium">
                      Explicación
                      <input className={input} value={q.explanation ?? ""} onChange={(e) => setQ(i, { explanation: e.target.value })} />
                    </label>
                  </div>
                )}
                <button
                  type="button"
                  disabled={draft.questions.length === 1}
                  onClick={() => setDraft({ ...draft, questions: draft.questions.filter((_, j) => j !== i) })}
                  className="text-sm text-danger disabled:opacity-40"
                >
                  Quitar pregunta
                </button>
              </fieldset>
            ))}
            <button
              type="button"
              onClick={() => setDraft({ ...draft, questions: [...draft.questions, newQuestion(draft.kind)] })}
              className="rounded-lg border border-brand-600 bg-white px-4 py-2 text-sm font-medium text-brand-800"
            >
              + Agregar pregunta
            </button>
          </div>

          <div className="flex gap-2">
            <button type="submit" disabled={saving} className="rounded-lg bg-brand-700 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50">
              {saving ? "Guardando…" : "Guardar"}
            </button>
            <button type="button" onClick={() => setDraft(null)} className="rounded-lg border border-black/10 bg-white px-4 py-2 text-sm">
              Cancelar
            </button>
          </div>
        </form>
      )}

      <div className="grid gap-3 md:grid-cols-2">
        {!quizzes && <p className="text-muted">Cargando…</p>}
        {quizzes?.map((q) => (
          <div key={q.id} className="rounded-2xl border border-black/5 bg-white p-5">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="font-semibold">{q.title}</p>
                <p className="text-sm text-muted">
                  {q.kind === "prueba" ? "Prueba" : "Encuesta"} · {q.questions.length} preguntas · /aula/{q.slug}
                </p>
              </div>
              <span className={`rounded-full px-2 py-1 text-xs font-semibold ${q.published ? "bg-brand-100 text-brand-800" : "bg-black/5 text-muted"}`}>
                {q.published ? "Publicada" : "Borrador"}
              </span>
            </div>
            <div className="mt-3 flex gap-2 text-sm">
              <button type="button" onClick={() => setDraft(structuredClone(q))} className="rounded px-2 py-1 text-brand-700 hover:bg-brand-50">
                Editar
              </button>
              <button type="button" onClick={() => void remove(q)} className="rounded px-2 py-1 text-danger hover:bg-red-50">
                Eliminar
              </button>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
