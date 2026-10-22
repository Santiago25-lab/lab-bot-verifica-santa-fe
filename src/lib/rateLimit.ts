const hits = new Map<string, number[]>();

/** Límite simple en memoria: máximo `max` solicitudes por `windowMs` para una clave. */
export function rateLimited(key: string, max = 20, windowMs = 60_000): boolean {
  const now = Date.now();
  const recent = (hits.get(key) ?? []).filter((t) => now - t < windowMs);
  recent.push(now);
  hits.set(key, recent);
  if (hits.size > 5000) hits.clear();
  return recent.length > max;
}
