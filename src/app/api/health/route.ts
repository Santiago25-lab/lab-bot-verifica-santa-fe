import { connection } from "next/server";

/** Comprobación rápida de que la app está en línea. */
export async function GET() {
  await connection();
  return Response.json({ ok: true, at: new Date().toISOString() });
}
