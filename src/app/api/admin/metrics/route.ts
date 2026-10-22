import { connection } from "next/server";
import { buildMetrics } from "@/lib/admin/metrics";
import { requireAdmin } from "@/lib/adminAuth";
import { getStore } from "@/lib/data/store";

export async function GET() {
  await connection();
  const denied = await requireAdmin();
  if (denied) return denied;
  const store = getStore();
  const [events, attempts, quizzes] = await Promise.all([
    store.listEvents(),
    store.listAttempts(),
    store.list("quizzes"),
  ]);
  return Response.json(buildMetrics(events, attempts, quizzes));
}
