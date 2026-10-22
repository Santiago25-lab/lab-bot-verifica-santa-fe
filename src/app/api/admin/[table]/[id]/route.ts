import { requireAdmin } from "@/lib/adminAuth";
import { sanitize } from "@/lib/admin/sanitize";
import { CONFIG_TABLES, getStore, invalidateConfig, type ConfigTable } from "@/lib/data/store";

type Ctx = { params: Promise<{ table: string; id: string }> };

async function resolve(params: Ctx["params"]) {
  const { table, id } = await params;
  return CONFIG_TABLES.includes(table as ConfigTable)
    ? { table: table as ConfigTable, id: decodeURIComponent(id) }
    : null;
}

export async function PUT(request: Request, { params }: Ctx) {
  const denied = await requireAdmin();
  if (denied) return denied;
  const target = await resolve(params);
  if (!target) return Response.json({ error: "No existe" }, { status: 404 });
  const result = sanitize(target.table, await request.json().catch(() => ({})));
  if (!result.ok) return Response.json({ error: result.error }, { status: 400 });
  try {
    await getStore().update(target.table, target.id, result.row as never);
  } catch (err) {
    return Response.json({ error: (err as Error).message }, { status: 400 });
  }
  invalidateConfig();
  return Response.json({ id: target.id, ...result.row });
}

export async function DELETE(_request: Request, { params }: Ctx) {
  const denied = await requireAdmin();
  if (denied) return denied;
  const target = await resolve(params);
  if (!target) return Response.json({ error: "No existe" }, { status: 404 });
  await getStore().remove(target.table, target.id);
  invalidateConfig();
  return Response.json({ ok: true });
}
