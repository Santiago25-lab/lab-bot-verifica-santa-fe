import { requireAdmin } from "@/lib/adminAuth";
import { getStore } from "@/lib/data/store";

type Ctx = { params: Promise<{ id: string }> };

const ESTADOS = ["nuevo", "revisado", "fraude", "descartado"];

/** Cambia el estado de un reporte (nuevo, revisado, fraude, descartado). */
export async function PUT(request: Request, { params }: Ctx) {
  const denied = await requireAdmin();
  if (denied) return denied;
  const { id } = await params;
  const { estado } = (await request.json().catch(() => ({}))) as { estado?: string };
  if (!estado || !ESTADOS.includes(estado)) {
    return Response.json({ error: "Estado inválido" }, { status: 400 });
  }
  const store = getStore();
  const report = (await store.listEvents()).find((e) => e.id === id && e.type === "reporte");
  if (!report) return Response.json({ error: "No existe" }, { status: 404 });
  await store.updateEventData(id, { ...report.data, estado });
  return Response.json({ ok: true });
}
