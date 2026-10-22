import type { Quiz } from "@/lib/types";

/** Versión pública de una prueba: sin respuestas correctas ni explicaciones. */
export function publicQuiz(q: Quiz) {
  return {
    id: q.id,
    slug: q.slug,
    title: q.title,
    description: q.description,
    kind: q.kind,
    questions: q.questions.map((x) => ({
      id: x.id,
      prompt: x.prompt,
      scenario: x.scenario,
      options: x.options,
    })),
  };
}

export type PublicQuiz = ReturnType<typeof publicQuiz>;

export function scoreQuiz(q: Quiz, answers: number[]) {
  const results = q.questions.map((x, i) => {
    const given = answers[i];
    const hasAnswer = typeof x.correct_index === "number";
    return {
      given,
      correct: hasAnswer ? given === x.correct_index : null,
      correct_index: hasAnswer ? x.correct_index : null,
      explanation: x.explanation ?? null,
    };
  });
  const gradable = results.filter((r) => r.correct !== null);
  return {
    score: gradable.filter((r) => r.correct).length,
    total: gradable.length,
    results,
  };
}
