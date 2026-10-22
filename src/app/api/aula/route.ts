import { connection } from "next/server";
import { getStore } from "@/lib/data/store";

/** Lista de pruebas y encuestas publicadas en el aula virtual. */
export async function GET() {
  await connection();
  const quizzes = await getStore().list("quizzes");
  return Response.json(
    quizzes
      .filter((q) => q.published)
      .map((q) => ({
        slug: q.slug,
        title: q.title,
        description: q.description,
        kind: q.kind,
        questions: q.questions.length,
      })),
  );
}
