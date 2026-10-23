import { requireAdmin } from "@/lib/adminAuth";
import { getConfig } from "@/lib/data/store";
import { analyzeMessage } from "@/lib/engine/analyze";
import { extractUrls } from "@/lib/engine/extract";

export const maxDuration = 30;

/** Muestra cómo clasifica el sistema un link: oficial, falso conocido, imitación o rasgos raros. */
export async function POST(request: Request) {
  const denied = await requireAdmin();
  if (denied) return denied;
  const { url } = (await request.json().catch(() => ({}))) as { url?: string };
  const text = String(url ?? "").trim().slice(0, 500);
  if (!extractUrls(text).length) {
    return Response.json({ error: "Escribe un link o dominio, por ejemplo dian-pagos.com" }, { status: 400 });
  }
  const a = await analyzeMessage(text, await getConfig(), { expandLinks: true, safeBrowsing: true, ai: false });
  return Response.json({
    verdict: a.verdict,
    oficial: a.officialDomains,
    sospechosos: a.suspiciousDomains,
    expandido: a.expanded,
    senales: a.signals.map((s) => s.detail),
  });
}
