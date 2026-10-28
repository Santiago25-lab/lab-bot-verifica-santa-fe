import { parse } from "tldts";

export interface FoundUrl {
  raw: string;
  url: string;
  hostname: string;
  /** Dominio registrable, ej. "dian-col.com" o "dian.gov.co". */
  domain: string;
  /** Dominio sin sufijo, ej. "dian-col". */
  label: string;
  isIp: boolean;
  https: boolean;
}

const EMAIL_RE = /[a-z0-9._%+-]+@([a-z0-9-]+(?:\.[a-z0-9-]+)+)/gi;
const URL_RE =
  /\b(?:https?:\/\/[^\s<>"'`]+|www\.[^\s<>"'`]+|(?:[a-z0-9-]+\.)+[a-z]{2,}(?:\/[^\s<>"'`]*)?)/gi;

export function extractEmails(text: string): { email: string; domain: string }[] {
  return [...text.matchAll(EMAIL_RE)].map((m) => ({
    email: m[0].toLowerCase(),
    domain: m[1].toLowerCase(),
  }));
}

export function parseUrl(raw: string): FoundUrl | null {
  const cleaned = raw.replace(/[),.;:!?¿¡\]}»”’'"]+$/u, "");
  const withScheme = /^https?:\/\//i.test(cleaned) ? cleaned : `http://${cleaned}`;
  let u: URL;
  try {
    u = new URL(withScheme);
  } catch {
    return null;
  }
  const info = parse(u.hostname);
  if (info.isIp) {
    return {
      raw: cleaned,
      url: u.toString(),
      hostname: u.hostname,
      domain: u.hostname,
      label: u.hostname,
      isIp: true,
      https: u.protocol === "https:",
    };
  }
  // Solo dominios con un sufijo público real (.com, .com.co, .gov.co...).
  if (!info.domain || !info.isIcann || !info.domainWithoutSuffix) return null;
  return {
    raw: cleaned,
    url: u.toString(),
    hostname: u.hostname.toLowerCase(),
    domain: info.domain.toLowerCase(),
    label: info.domainWithoutSuffix.toLowerCase(),
    isIp: false,
    // Sin esquema escrito no sabemos si es https; no lo penalizamos.
    https: /^https:\/\//i.test(cleaned) || !/^http:\/\//i.test(cleaned),
  };
}

/**
 * "aprobada.Si no la reconoces" o "llegué.Me avisas" no son links: falta el espacio después
 * del punto y la siguiente palabra empieza en mayúscula. Los links reales casi nunca se escriben
 * así (todo en minúsculas o todo en mayúsculas, o con http/www).
 */
function looksLikeSentence(raw: string): boolean {
  if (/^(https?:\/\/|www\.)/i.test(raw)) return false;
  const host = raw.split("/")[0];
  const dot = host.lastIndexOf(".");
  const before = host.slice(0, dot);
  const after = host.slice(dot + 1);
  return /^[A-ZÁÉÍÓÚÑ]/.test(after) && /[a-záéíóúñ]/.test(before) && !/[A-Z]/.test(before);
}

export function extractUrls(text: string): FoundUrl[] {
  const withoutEmails = text.replace(EMAIL_RE, " ");
  const seen = new Set<string>();
  const out: FoundUrl[] = [];
  for (const m of withoutEmails.matchAll(URL_RE)) {
    if (looksLikeSentence(m[0])) continue;
    const found = parseUrl(m[0]);
    if (!found || seen.has(found.url)) continue;
    seen.add(found.url);
    out.push(found);
  }
  return out;
}
