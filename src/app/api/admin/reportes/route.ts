import { connection } from "next/server";
import { requireAdmin } from "@/lib/adminAuth";
import { getStore } from "@/lib/data/store";

/** Mensajes reportados por los usuarios (sin datos personales) y dominios más reportados. */
export async function GET() {
  await connection();
  const denied = await requireAdmin();
  if (denied) return denied;
  const store = getStore();
  const [events, domains] = await Promise.all([store.listEvents(), store.list("domains")]);
  const reports = events
    .filter((e) => e.type === "reporte")
    .sort((a, b) => String(b.created_at).localeCompare(String(a.created_at)))
    .map((e) => ({
      id: e.id,
      fecha: e.created_at,
      canal: e.channel,
      veredicto: e.verdict,
      texto: String(e.data?.texto ?? ""),
      dominios: (e.data?.dominios as string[] | undefined) ?? [],
      estado: String(e.data?.estado ?? "nuevo"),
    }));
  const negra = new Set(domains.filter((d) => d.list === "negra").map((d) => d.domain));
  const counts = new Map<string, number>();
  for (const r of reports) for (const d of r.dominios) counts.set(d, (counts.get(d) ?? 0) + 1);
  const masReportados = [...counts]
    .map(([dominio, veces]) => ({ dominio, veces, enListaNegra: negra.has(dominio) }))
    .sort((a, b) => b.veces - a.veces)
    .slice(0, 15);
  return Response.json({ reports, masReportados });
}
