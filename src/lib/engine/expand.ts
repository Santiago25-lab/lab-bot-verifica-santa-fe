import { parse } from "tldts";

const PRIVATE_HOST =
  /^(localhost|127\.|10\.|192\.168\.|172\.(1[6-9]|2\d|3[01])\.|169\.254\.|0\.|\[?::1\]?$|\[?f[cd])/i;

/**
 * Sigue las redirecciones de un link acortado leyendo solo los encabezados.
 * Nunca descarga ni muestra la página final.
 */
export async function expandUrl(
  url: string,
  maxHops = 5,
  timeoutMs = 3500,
): Promise<string | null> {
  let current = url;
  for (let hop = 0; hop < maxHops; hop++) {
    let u: URL;
    try {
      u = new URL(current);
    } catch {
      return null;
    }
    if (!/^https?:$/.test(u.protocol)) return null;
    // No seguimos links hacia la red interna del servidor.
    if (PRIVATE_HOST.test(u.hostname) || (!parse(u.hostname).domain && !parse(u.hostname).isIp)) {
      return null;
    }
    const location = await headLocation(u.toString(), timeoutMs);
    if (location === undefined) return hop === 0 ? null : current;
    if (location === null) return current;
    current = new URL(location, u).toString();
  }
  return current;
}

/** undefined = error de red; null = no redirige; string = siguiente URL. */
async function headLocation(url: string, timeoutMs: number): Promise<string | null | undefined> {
  for (const method of ["HEAD", "GET"] as const) {
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), timeoutMs);
    try {
      const res = await fetch(url, {
        method,
        redirect: "manual",
        signal: ctrl.signal,
        headers: { "user-agent": "VerificaSantaFeBot/1.0 (+link-check)" },
      });
      // No leemos el cuerpo de la página.
      await res.body?.cancel().catch(() => {});
      if (res.status >= 300 && res.status < 400) return res.headers.get("location");
      if (method === "HEAD" && (res.status === 405 || res.status === 400 || res.status === 403)) {
        continue;
      }
      return null;
    } catch {
      if (method === "GET") return undefined;
    } finally {
      clearTimeout(timer);
    }
  }
  return undefined;
}
