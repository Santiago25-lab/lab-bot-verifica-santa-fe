import { parse } from "tldts";
import { SHORTENERS } from "@/lib/data/defaults";
import { levenshtein } from "@/lib/text";
import type { DomainEntry } from "@/lib/types";

function matches(hostname: string, domain: string): boolean {
  const d = domain.toLowerCase().trim();
  return hostname === d || hostname.endsWith(`.${d}`);
}

export function findListed(
  hostname: string,
  domains: DomainEntry[],
  list: DomainEntry["list"],
): DomainEntry | undefined {
  return domains.find((d) => d.list === list && matches(hostname, d.domain));
}

export function isGov(hostname: string): boolean {
  return hostname === "gov.co" || hostname.endsWith(".gov.co");
}

export function isShortener(hostname: string): boolean {
  return SHORTENERS.some((s) => matches(hostname, s));
}

/** Etiqueta del dominio oficial, ej. "dian" para dian.gov.co o "bancolombia". */
export function labelOf(domain: string): string {
  return (parse(domain).domainWithoutSuffix ?? domain).toLowerCase();
}

/**
 * ¿El dominio imita a una entidad de la lista blanca?
 * - Contiene el nombre oficial como palabra (dian.pagos-online.com, dian-col.com).
 * - O se escribe casi igual (bancolonbia.com).
 * - O usa "gov" sin ser realmente .gov.co.
 */
export function findImitation(
  hostname: string,
  label: string,
  whitelist: DomainEntry[],
): DomainEntry | { entity: string; domain: string } | undefined {
  const tokens = hostname.split(/[^a-z0-9]+/).filter(Boolean);
  // Errores de escritura tolerados según el largo del nombre (nequl, bancolonbia).
  const maxTypos = (n: number) => (n >= 8 ? 2 : n >= 5 ? 1 : 0);
  for (const entry of whitelist) {
    const official = labelOf(entry.domain);
    if (official.length >= 4 && tokens.includes(official)) return entry;
    const allowed = maxTypos(official.length);
    const near = (t: string) =>
      t !== official &&
      Math.abs(t.length - official.length) <= 1 &&
      levenshtein(t, official) <= allowed;
    if (allowed && [label, ...tokens].some(near)) {
      return entry;
    }
  }
  if (!isGov(hostname) && tokens.includes("gov")) {
    return { entity: "una entidad del Gobierno", domain: ".gov.co" };
  }
  return undefined;
}

// Terminaciones baratas o gratuitas, muy usadas en páginas falsas.
const CHEAP_TLDS = new Set([
  "xyz", "top", "online", "site", "click", "live", "shop", "buzz", "icu", "vip", "info", "store",
  "website", "space", "fun", "monster", "rest", "cfd", "sbs", "tk", "ml", "ga", "cf", "gq", "work",
]);
// Palabras que los estafadores ponen en la dirección para dar confianza.
const BAIT_WORDS = [
  "seguro", "segura", "seguridad", "verifica", "verificar", "verificacion", "actualiza", "actualizar",
  "actualizacion", "pago", "pagos", "login", "soporte", "bloqueo", "desbloqueo", "desbloquear",
  "clientes", "validar", "validacion", "premio", "premios", "bono", "bonos", "beneficio", "oficial",
  "sucursal", "portal", "reembolso", "citacion", "multas",
];

/**
 * Rasgos de una dirección desconocida que un sitio oficial casi nunca tiene.
 * Devuelve las razones encontradas y cuánto suman (máx. 3).
 */
export function domainOddities(hostname: string, domain: string, label: string): { reasons: string[]; weight: number } {
  const reasons: string[] = [];
  let weight = 0;
  if (hostname.split(".").some((p) => p.startsWith("xn--"))) {
    reasons.push("usa letras disfrazadas que parecen normales (xn--)");
    weight += 3;
  }
  const tld = domain.slice(label.length + 1);
  if (CHEAP_TLDS.has(tld)) {
    reasons.push(`termina en .${tld}, muy usado en páginas falsas`);
    weight += 1;
  }
  if ((label.match(/-/g) ?? []).length >= 2) {
    reasons.push("tiene muchos guiones");
    weight += 1;
  }
  if (/[a-z]/.test(label) && /\d/.test(label)) {
    reasons.push("mezcla números con el nombre");
    weight += 1;
  }
  const tokens = hostname.split(/[^a-z0-9]+/);
  const bait = BAIT_WORDS.filter((w) => tokens.includes(w) || label.includes(w));
  if (bait.length) {
    reasons.push(`usa palabras para dar confianza («${bait.slice(0, 2).join("», «")}»)`);
    weight += 1;
  }
  if (label.length > 25) {
    reasons.push("es demasiado larga");
    weight += 1;
  }
  return { reasons, weight: Math.min(weight, 3) };
}
