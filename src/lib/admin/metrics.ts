import { POST_SLUG, PRE_SLUG } from "@/lib/data/defaults";
import type { AttemptRow, EventRow, Quiz } from "@/lib/types";

const pct = (a: number, b: number) => (b ? Math.round((a / b) * 100) : 0);

/** Indicadores agregados para el panel. Nunca incluye datos personales. */
export function buildMetrics(events: EventRow[], attempts: AttemptRow[], quizzes: Quiz[]) {
  const people = new Set([...events.map((e) => e.anon_id), ...attempts.map((a) => a.anon_id)]);
  const verifs = events.filter((e) => e.type === "verificacion");
  const sims = events.filter((e) => e.type === "simulacro");
  const simsOk = sims.filter((e) => e.data?.correct === true).length;
  const triage = events.filter((e) => e.type === "triage");

  const count = <T extends string>(items: T[]) =>
    items.reduce<Record<string, number>>((acc, k) => ({ ...acc, [k]: (acc[k] ?? 0) + 1 }), {});

  const signals = count(verifs.flatMap((e) => (e.data?.signals as string[] | undefined) ?? []));

  const days: { date: string; verificaciones: number; simulacros: number }[] = [];
  for (let i = 29; i >= 0; i--) {
    const date = new Date(Date.now() - i * 86400_000).toISOString().slice(0, 10);
    days.push({
      date,
      verificaciones: verifs.filter((e) => e.created_at?.startsWith(date)).length,
      simulacros: sims.filter((e) => e.created_at?.startsWith(date)).length,
    });
  }

  const byQuiz = (q: Quiz) => attempts.filter((a) => a.quiz_id === q.id);
  const pruebas = quizzes
    .filter((q) => q.kind === "prueba")
    .map((q) => {
      const list = byQuiz(q);
      const avg = list.length
        ? Math.round(list.reduce((s, a) => s + pct(a.score, a.total), 0) / list.length)
        : 0;
      return { slug: q.slug, title: q.title, intentos: list.length, promedio: avg };
    });

  const encuestas = quizzes
    .filter((q) => q.kind === "encuesta")
    .map((q) => {
      const list = byQuiz(q);
      return {
        slug: q.slug,
        title: q.title,
        respuestas: list.length,
        preguntas: q.questions.map((question, i) => {
          const picks = list.map((a) => a.answers[i]).filter((x) => Number.isInteger(x));
          const likert = question.options.length === 5;
          return {
            prompt: question.prompt,
            promedio: likert && picks.length
              ? Math.round((picks.reduce((s, x) => s + x + 1, 0) / picks.length) * 10) / 10
              : null,
            distribucion: question.options.map((option, j) => ({
              option,
              count: picks.filter((x) => x === j).length,
            })),
          };
        }),
      };
    });

  // Antes y después: primera prueba de entrada vs. última prueba de salida de cada persona.
  const byTime = [...attempts].sort((x, y) => String(x.created_at).localeCompare(String(y.created_at)));
  const pre = new Map<string, number>();
  const post = new Map<string, number>();
  for (const a of byTime) {
    if (a.quiz_slug === PRE_SLUG && !pre.has(a.anon_id)) pre.set(a.anon_id, pct(a.score, a.total));
    if (a.quiz_slug === POST_SLUG) post.set(a.anon_id, pct(a.score, a.total));
  }
  const pairs = [...pre].filter(([id]) => post.has(id)).map(([id, before]) => [before, post.get(id)!]);
  const avg = (xs: number[]) => (xs.length ? Math.round(xs.reduce((s, x) => s + x, 0) / xs.length) : 0);
  const antesDespues = {
    personas: pairs.length,
    antes: avg(pairs.map(([b]) => b)),
    despues: avg(pairs.map(([, a]) => a)),
    mejoraron: pct(pairs.filter(([b, a]) => a > b).length, pairs.length),
    soloEntrada: pre.size - pairs.length,
  };

  return {
    antesDespues,
    totales: {
      personas: people.size,
      verificaciones: verifs.length,
      simulacros: sims.length,
      aciertoSimulacros: pct(simsOk, sims.length),
      triage: triage.length,
      alertas: events.filter((e) => e.type === "alerta").length,
      reportes: events.filter((e) => e.type === "reporte").length,
      intentosAula: attempts.length,
    },
    porVeredicto: count(verifs.map((e) => e.verdict ?? "sin_senales")),
    porCanal: count(events.filter((e) => e.type !== "inicio").map((e) => e.channel)),
    senales: Object.entries(signals)
      .map(([id, n]) => ({ id, n }))
      .sort((a, b) => b.n - a.n),
    triagePorCaso: count(triage.map((e) => String(e.data?.case ?? "otro"))),
    porDia: days,
    pruebas,
    encuestas,
  };
}

export type Metrics = ReturnType<typeof buildMetrics>;

function csvCell(v: unknown): string {
  if (v === null || v === undefined) return "";
  const s = typeof v === "string" ? v : JSON.stringify(v);
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

export function toCsv(rows: Record<string, unknown>[], columns: string[]): string {
  return [columns.join(","), ...rows.map((r) => columns.map((c) => csvCell(r[c])).join(","))].join(
    "\n",
  );
}
