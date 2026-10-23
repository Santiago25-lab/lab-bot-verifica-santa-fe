import { connection } from "next/server";
import { requireAdmin } from "@/lib/adminAuth";
import { askAiDetailed } from "@/lib/engine/ai";

export const maxDuration = 60;

/** Diagnóstico de la IA: muestra el modelo usado, su opinión o el error exacto. */
export async function GET() {
  await connection();
  const denied = await requireAdmin();
  if (denied) return denied;
  const started = Date.now();
  const result = await askAiDetailed(
    "Hola, soy del banco, te llamamos para confirmar un movimiento, me regalas el código que te llegó?",
    [],
  );
  return Response.json({ ok: Boolean(result.opinion), ms: Date.now() - started, ...result });
}
