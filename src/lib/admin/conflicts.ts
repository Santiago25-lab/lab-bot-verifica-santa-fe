import "server-only";
import { getStore, type ConfigTable } from "@/lib/data/store";

/**
 * Evita registros que confunden al bot: el mismo link dos veces, un link en Links oficiales y
 * en Páginas falsas a la vez, o dos pruebas con el mismo enlace del aula.
 * Devuelve el mensaje de error o null si no hay conflicto.
 */
export async function conflictFor(table: ConfigTable, row: Record<string, unknown>): Promise<string | null> {
  const store = getStore();
  if (table === "domains") {
    const domains = await store.list("domains");
    const same = domains.filter((d) => d.domain === row.domain && d.id !== row.id);
    if (same.some((d) => d.list === row.list)) return `${row.domain} ya está en esta lista.`;
    const other = same.find((d) => d.list !== row.list);
    if (other) {
      return other.list === "blanca"
        ? `${row.domain} está en Links oficiales. Si de verdad es falso, quítalo primero de esa lista.`
        : `${row.domain} está en Páginas falsas. Quítalo primero de esa lista.`;
    }
  }
  if (table === "quizzes") {
    const quizzes = await store.list("quizzes");
    if (quizzes.some((q) => q.slug === row.slug && q.id !== row.id)) {
      return `Ya existe una prueba con el enlace «${row.slug}». Usa otro.`;
    }
  }
  return null;
}
