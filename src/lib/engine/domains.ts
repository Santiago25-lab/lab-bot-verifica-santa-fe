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
