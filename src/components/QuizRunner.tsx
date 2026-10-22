"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import type { PublicQuiz } from "@/lib/quiz";

interface Result {
  score: number;
  total: number;
  results: {
    given: number;
    correct: boolean | null;
    correct_index: number | null;
    explanation: string | null;
  }[];
}

export function QuizRunner() {
  const { slug } = useParams<{ slug: string }>();
  const [quiz, setQuiz] = useState<PublicQuiz | null>(null);
  const [missing, setMissing] = useState(false);
  const [answers, setAnswers] = useState<number[]>([]);
  const [step, setStep] = useState(0);
  const [result, setResult] = useState<Result | null>(null);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch(`/api/aula/${encodeURIComponent(slug)}`)
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then(setQuiz)
      .catch(() => setMissing(true));
  }, [slug]);

  if (missing) {
    return (
      <p className="text-muted">
        Esta prueba no existe o ya no está publicada.{" "}
        <Link href="/aula" className="text-brand-700 underline">
          Volver al aula
        </Link>
      </p>
    );
  }
  if (!quiz) return <p className="text-muted">Cargando…</p>;

  const q = quiz.questions[step];
  const isLast = step === quiz.questions.length - 1;

  async function submit(final: number[]) {
    setSending(true);
    setError(null);
    try {
      const res = await fetch(`/api/aula/${encodeURIComponent(slug)}`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ answers: final }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "No se pudo enviar");
      setResult(data);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setSending(false);
    }
  }

  function choose(i: number) {
    const next = [...answers];
    next[step] = i;
    setAnswers(next);
    if (isLast) void submit(next);
    else setStep(step + 1);
  }

  if (result) {
    const pct = result.total ? Math.round((result.score / result.total) * 100) : 0;
    return (
      <div className="space-y-6">
        <div className="rounded-2xl bg-brand-900 p-8 text-white">
          {quiz.kind === "prueba" ? (
            <>
              <p className="text-sm text-brand-100">Tu resultado</p>
              <p className="mt-1 text-5xl font-bold">
                {result.score}/{result.total}
              </p>
              <p className="mt-2 text-brand-100">
                {pct >= 80
                  ? "¡Excelente! Reconoces muy bien las trampas."
                  : pct >= 50
                    ? "Vas bien. Repasa las explicaciones de abajo."
                    : "Sigue practicando: revisa cada explicación."}
              </p>
            </>
          ) : (
            <>
              <p className="text-3xl font-bold">¡Gracias por responder!</p>
              <p className="mt-2 text-brand-100">Tus respuestas son anónimas y nos ayudan a mejorar.</p>
            </>
          )}
        </div>
        {quiz.kind === "prueba" && (
          <ol className="space-y-4">
            {quiz.questions.map((question, i) => {
              const r = result.results[i];
              return (
                <li key={question.id} className="rounded-2xl border border-black/5 bg-white p-5">
                  <p className="font-semibold">
                    {r.correct ? "✅" : "❌"} {i + 1}. {question.prompt}
                  </p>
                  {question.scenario && (
                    <p className="bubble mt-2 rounded-xl bg-[#d9fdd3] p-3 text-sm">{question.scenario}</p>
                  )}
                  <p className="mt-2 text-sm">
                    Respuesta correcta: <strong>{question.options[r.correct_index ?? 0]}</strong>
                    {!r.correct && <> · Elegiste: {question.options[r.given]}</>}
                  </p>
                  {r.explanation && <p className="mt-1 text-sm text-muted">{r.explanation}</p>}
                </li>
              );
            })}
          </ol>
        )}
        <div className="flex flex-wrap gap-3">
          <Link href="/aula" className="rounded-xl bg-brand-700 px-5 py-3 font-semibold text-white hover:bg-brand-800">
            Volver al aula
          </Link>
          <Link href="/verificar" className="rounded-xl border border-brand-700 px-5 py-3 font-semibold text-brand-800 hover:bg-brand-50">
            Verificar un mensaje
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm text-muted">{quiz.title}</p>
        <div className="mt-2 flex items-center gap-3">
          <div
            className="h-2 flex-1 overflow-hidden rounded-full bg-black/10"
            role="progressbar"
            aria-valuemin={0}
            aria-valuemax={quiz.questions.length}
            aria-valuenow={step + 1}
          >
            <div
              className="h-full rounded-full bg-brand-600 transition-all"
              style={{ width: `${((step + 1) / quiz.questions.length) * 100}%` }}
            />
          </div>
          <span className="text-sm font-medium text-muted">
            {step + 1}/{quiz.questions.length}
          </span>
        </div>
      </div>
      <div className="rounded-2xl border border-black/5 bg-white p-6 shadow-sm">
        <h2 className="text-xl font-semibold">{q.prompt}</h2>
        {q.scenario && (
          <div className="mt-4 rounded-xl bg-[#efeae2] p-4">
            <p className="bubble max-w-[90%] rounded-xl rounded-tl-sm bg-white p-3 text-sm shadow-sm">
              {q.scenario}
            </p>
          </div>
        )}
        <div className="mt-5 grid gap-3">
          {q.options.map((o, i) => (
            <button
              key={i}
              type="button"
              disabled={sending}
              onClick={() => choose(i)}
              className={`rounded-xl border px-4 py-3 text-left font-medium transition hover:border-brand-600 hover:bg-brand-50 disabled:opacity-50 ${
                answers[step] === i ? "border-brand-600 bg-brand-50" : "border-black/10"
              }`}
            >
              {o}
            </button>
          ))}
        </div>
        {error && <p role="alert" className="mt-3 text-sm text-danger">{error}</p>}
      </div>
      {step > 0 && (
        <button type="button" onClick={() => setStep(step - 1)} className="text-sm text-muted hover:text-ink">
          ← Pregunta anterior
        </button>
      )}
    </div>
  );
}
