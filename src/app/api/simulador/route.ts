import { webAnonId } from "@/lib/anonId";
import { calificarCaso, casoById } from "@/lib/data/casos";
import { getStore } from "@/lib/data/store";
import { KIT_IDS, type KitId } from "@/lib/kit";
import { rateLimited } from "@/lib/rateLimit";

/** Registra un caso respondido en el simulador. Solo se guardan aciertos, nunca datos personales. */
export async function POST(request: Request) {
  const body = (await request.json().catch(() => ({}))) as {
    caso?: unknown;
    marcadas?: unknown;
    fraude?: unknown;
    clic?: unknown;
    sesion?: unknown;
  };
  const caso = typeof body.caso === "string" ? casoById(body.caso) : undefined;
  if (!caso || typeof body.fraude !== "boolean") {
    return Response.json({ error: "Caso inválido" }, { status: 400 });
  }
  const marcadas = (Array.isArray(body.marcadas) ? body.marcadas : []).filter(
    (s): s is KitId => typeof s === "string" && (KIT_IDS as string[]).includes(s),
  );
  const anonId = await webAnonId();
  if (rateLimited(`sim:${anonId}`, 40)) {
    return Response.json({ error: "Demasiados envíos, espera un minuto." }, { status: 429 });
  }
  const r = calificarCaso(caso, [...new Set(marcadas)], body.fraude);
  await getStore().logEvent({
    anon_id: anonId,
    channel: "web",
    type: "simulador",
    data: {
      caso: caso.id,
      principal: Boolean(caso.principal),
      fraude: caso.fraude,
      correcto: r.correcto,
      presentes: r.presentes.length,
      encontradas: r.encontradas,
      omitidas: r.omitidas,
      falsasAlarmas: r.falsasAlarmas.length,
      clic: body.clic === true,
      sesion: typeof body.sesion === "string" ? body.sesion.slice(0, 20) : undefined,
    },
  });
  return Response.json(r);
}
