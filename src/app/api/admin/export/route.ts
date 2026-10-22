import { connection } from "next/server";
import { toCsv } from "@/lib/admin/metrics";
import { requireAdmin } from "@/lib/adminAuth";
import { getStore } from "@/lib/data/store";

/** Exporta eventos o respuestas del aula en CSV (solo IDs anónimos). */
export async function GET(request: Request) {
  await connection();
  const denied = await requireAdmin();
  if (denied) return denied;
  const type = new URL(request.url).searchParams.get("type");
  const store = getStore();
  let csv: string;
  if (type === "respuestas") {
    const rows = await store.listAttempts();
    csv = toCsv(rows as never, [
      "created_at",
      "anon_id",
      "quiz_slug",
      "kind",
      "score",
      "total",
      "answers",
    ]);
  } else {
    const rows = await store.listEvents();
    csv = toCsv(rows as never, ["created_at", "anon_id", "channel", "type", "verdict", "data"]);
  }
  const name = type === "respuestas" ? "respuestas-aula" : "eventos-bot";
  return new Response(`﻿${csv}`, {
    headers: {
      "content-type": "text/csv; charset=utf-8",
      "content-disposition": `attachment; filename="${name}.csv"`,
    },
  });
}
