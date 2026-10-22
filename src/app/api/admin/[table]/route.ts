import { connection } from "next/server";
import { requireAdmin } from "@/lib/adminAuth";
import { sanitize } from "@/lib/admin/sanitize";
import { CONFIG_TABLES, getStore, invalidateConfig, type ConfigTable } from "@/lib/data/store";

type Ctx = { params: Promise<{ table: string }> };

async function tableFrom(params: Ctx["params"]): Promise<ConfigTable | null> {
  const { table } = await params;
  return CONFIG_TABLES.includes(table as ConfigTable) ? (table as ConfigTable) : null;
}

export async function GET(_request: Request, { params }: Ctx) {
  await connection();
  const denied = await requireAdmin();
  if (denied) return denied;
  const table = await tableFrom(params);
  if (!table) return Response.json({ error: "No existe" }, { status: 404 });
  return Response.json(await getStore().list(table));
}

export async function POST(request: Request, { params }: Ctx) {
  const denied = await requireAdmin();
  if (denied) return denied;
  const table = await tableFrom(params);
  if (!table) return Response.json({ error: "No existe" }, { status: 404 });
  const result = sanitize(table, await request.json().catch(() => ({})));
  if (!result.ok) return Response.json({ error: result.error }, { status: 400 });
  const row = { id: crypto.randomUUID(), ...result.row };
  try {
    await getStore().insert(table, row as never);
  } catch (err) {
    return Response.json({ error: (err as Error).message }, { status: 400 });
  }
  invalidateConfig();
  return Response.json(row, { status: 201 });
}
