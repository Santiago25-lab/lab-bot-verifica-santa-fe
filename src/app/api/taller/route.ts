import { connection } from "next/server";
import { currentTallerCode, setTallerId, TALLER_CODE_RE } from "@/lib/anonId";

/** Participante activo del modo taller en este navegador. */
export async function GET() {
  await connection();
  return Response.json({ code: await currentTallerCode() });
}

/** El facilitador asigna un código de participante (después del consentimiento firmado). */
export async function POST(request: Request) {
  const body = (await request.json().catch(() => ({}))) as { code?: unknown; consentimiento?: unknown };
  const code = typeof body.code === "string" ? body.code.trim().toUpperCase().replace(/\s+/g, "-") : "";
  if (!TALLER_CODE_RE.test(code)) {
    return Response.json({ error: "Usa solo letras, números y guiones (ej. T1-P01)." }, { status: 400 });
  }
  if (body.consentimiento !== true) {
    return Response.json({ error: "Confirma que el participante firmó el consentimiento." }, { status: 400 });
  }
  await setTallerId(code);
  return Response.json({ code });
}

/** Termina con el participante: el navegador vuelve a un ID anónimo nuevo. */
export async function DELETE() {
  await setTallerId(null);
  return Response.json({ ok: true });
}
