import { connection } from "next/server";
import { webAnonId } from "@/lib/anonId";
import { getStore } from "@/lib/data/store";
import { publicQuiz, scoreQuiz } from "@/lib/quiz";
import { rateLimited } from "@/lib/rateLimit";

type Ctx = { params: Promise<{ slug: string }> };

async function findQuiz(slug: string) {
  const quizzes = await getStore().list("quizzes");
  return quizzes.find((q) => q.slug === slug && q.published);
}

export async function GET(_request: Request, { params }: Ctx) {
  await connection();
  const quiz = await findQuiz((await params).slug);
  if (!quiz) return Response.json({ error: "No existe" }, { status: 404 });
  return Response.json(publicQuiz(quiz));
}

/** Califica las respuestas y las guarda solo con el ID anónimo. */
export async function POST(request: Request, { params }: Ctx) {
  const quiz = await findQuiz((await params).slug);
  if (!quiz) return Response.json({ error: "No existe" }, { status: 404 });
  const body = (await request.json().catch(() => ({}))) as { answers?: unknown };
  const answers = Array.isArray(body.answers) ? body.answers : [];
  const valid =
    answers.length === quiz.questions.length &&
    answers.every(
      (a, i) => Number.isInteger(a) && a >= 0 && a < quiz.questions[i].options.length,
    );
  if (!valid) return Response.json({ error: "Respuestas incompletas" }, { status: 400 });

  const anonId = await webAnonId();
  if (rateLimited(`aula:${anonId}`, 15)) {
    return Response.json({ error: "Demasiados envíos, espera un minuto." }, { status: 429 });
  }
  const result = scoreQuiz(quiz, answers as number[]);
  await getStore().saveAttempt({
    anon_id: anonId,
    quiz_id: quiz.id,
    quiz_slug: quiz.slug,
    kind: quiz.kind,
    score: result.score,
    total: result.total,
    answers: answers as number[],
  });
  return Response.json({ ...result, anonId });
}
