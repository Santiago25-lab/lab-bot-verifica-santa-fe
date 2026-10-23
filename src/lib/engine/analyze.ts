import { FREE_MAIL } from "@/lib/data/defaults";
import { containsPhrase, normalize } from "@/lib/text";
import type { Analysis, AppConfig, DomainEntry, Signal, Verdict } from "@/lib/types";
import { askAi, looksLikeManipulation } from "./ai";
import { anonymize } from "./anonymize";
import { findImitation, findListed, isGov, isShortener, labelOf } from "./domains";
import { expandUrl } from "./expand";
import { extractEmails, extractUrls, parseUrl, type FoundUrl } from "./extract";
import { checkSafeBrowsing } from "./safeBrowsing";

export const THRESHOLDS = { peligroso: 4, sospechoso: 2 };

// Formas de PEDIR algo (imperativos y "me regalas"), no de informar ("te enviamos").
const ASK =
  "(compartenos|compartelo|compartela|comparte|compartir|compartirnos|envianos|enviame|envialo|enviala|mandame|mandanos|dame|danos|dime|dinos|regalame|regalanos|regalas|pasame|pasanos|dictame|dictanos|dicta|digita|reenviame|reenvianos|escribeme|escribenos|indicame|indicanos|confirmame|confirmanos|suministranos|facilitanos)";
const SECRET = "(codigo|clave|contrasena|pin|token|otp)";
const ASK_RE = new RegExp(`\\b${ASK}\\b[^.?!\\n]{0,40}?\\b${SECRET}\\b`, "g");
const NEGATED = /\b(no|nunca|jamas)\s+(\S+\s+){0,2}$/;

/** ¿El mensaje pide compartir un código o clave? Ignora avisos como "no compartas tu código". */
export function asksForSecret(norm: string): string | null {
  for (const m of norm.matchAll(ASK_RE)) {
    if (!NEGATED.test(norm.slice(Math.max(0, m.index - 25), m.index))) return m[0];
  }
  return null;
}

export interface AnalyzeOptions {
  expandLinks?: boolean;
  safeBrowsing?: boolean;
  ai?: boolean;
}

function entityAliases(entry: DomainEntry): string[] {
  const words = normalize(entry.entity).split(/\s+/);
  const aliases = [normalize(entry.entity)];
  if (words.length >= 3) aliases.push(words.slice(0, 3).join(" "));
  const label = labelOf(entry.domain);
  if (label.length >= 4) aliases.push(label);
  return aliases;
}

export function verdictFor(score: number, isReceipt: boolean): Verdict {
  if (score >= THRESHOLDS.peligroso) return "peligroso";
  if (score >= THRESHOLDS.sospechoso || isReceipt) return "sospechoso";
  return "sin_senales";
}

/** Analiza un mensaje y devuelve el semáforo con las señales encontradas. */
export async function analyzeMessage(
  text: string,
  config: AppConfig,
  opts: AnalyzeOptions = {},
): Promise<Analysis> {
  const norm = normalize(text);
  const whitelist = config.domains.filter((d) => d.list === "blanca");
  const signals: Signal[] = [];
  const add = (s: Signal) => {
    if (!signals.some((x) => x.id === s.id && x.detail === s.detail)) signals.push(s);
  };
  const kw = (category: string) => {
    const found = config.keywords
      .filter((k) => k.category === category && containsPhrase(norm, k.phrase))
      .map((k) => normalize(k.phrase));
    // Sin repetir frases contenidas en otra ("codigo que te llego" dentro de "el codigo que te llego").
    return [...new Set(found)].filter((p) => !found.some((o) => o !== p && o.includes(p)));
  };

  // 1. Links, expandiendo los acortados.
  const urls = extractUrls(text);
  const expanded: Analysis["expanded"] = [];
  const finals: FoundUrl[] = [];
  let hasShortener = false;
  for (const u of urls) {
    if (isShortener(u.hostname)) {
      hasShortener = true;
      const to = opts.expandLinks ? await expandUrl(u.url) : null;
      const target = to ? parseUrl(to) : null;
      if (target && !isShortener(target.hostname)) {
        expanded.push({ from: u.hostname, to: target.hostname });
        finals.push(target);
      }
    } else {
      finals.push(u);
    }
  }
  if (hasShortener) {
    add({
      id: "link_acortado",
      detail: expanded.length
        ? `El link está acortado y esconde su destino real: ${expanded.map((e) => e.to).join(", ")}.`
        : "El link está acortado (bit.ly u otro) y esconde a dónde te lleva.",
      weight: 2,
    });
  }

  // 2. Entidades mencionadas en el texto.
  const mentioned = whitelist.filter((e) => entityAliases(e).some((a) => containsPhrase(norm, a)));
  const govWords = kw("entidad_publica");
  const entities = new Set<string>(mentioned.map((e) => e.entity));

  const officialDomains = new Set<string>();
  const suspiciousDomains = new Set<string>();

  for (const u of finals) {
    const black = findListed(u.hostname, config.domains, "negra");
    if (black) {
      suspiciousDomains.add(u.domain);
      add({
        id: "lista_negra",
        detail: `${u.domain} ya fue reportado como fraude.`,
        weight: 99,
      });
      continue;
    }
    const official = findListed(u.hostname, config.domains, "blanca");
    if (official) {
      officialDomains.add(official.domain);
      continue;
    }
    suspiciousDomains.add(u.domain);
    if (u.isIp) {
      add({ id: "ip", detail: "El link usa números (IP) en vez de un nombre de página.", weight: 2 });
      continue;
    }
    const imitated = findImitation(u.hostname, u.label, whitelist);
    if (imitated) {
      entities.add(imitated.entity);
      add({
        id: "imitacion",
        detail:
          imitated.domain === ".gov.co"
            ? `${u.domain} usa "gov" para parecer del Gobierno, pero no termina en .gov.co.`
            : `${u.domain} se hace pasar por ${imitated.entity}. El sitio oficial es ${imitated.domain}.`,
        weight: 3,
      });
      continue;
    }
    if (govWords.length && !isGov(u.hostname)) {
      add({
        id: "gov_sin_govco",
        detail: `El mensaje habla de una entidad pública (${govWords[0].toUpperCase()}), pero el link va a ${u.domain}, que no termina en .gov.co.`,
        weight: 3,
      });
    } else if (mentioned.length) {
      const e = mentioned[0];
      add({
        id: "entidad_link_no_oficial",
        detail: `El mensaje menciona a ${e.entity}, pero el link va a ${u.domain}. El sitio oficial es ${e.domain}.`,
        weight: 3,
      });
    }
    if (!u.https) {
      add({ id: "sin_https", detail: `El link a ${u.domain} no es seguro (http).`, weight: 1 });
    }
  }

  // 3. Remitente (correos dentro del texto reenviado).
  for (const { domain } of extractEmails(text)) {
    const fromOfficial = findListed(domain, config.domains, "blanca");
    if (fromOfficial) continue;
    if (FREE_MAIL.includes(domain) && (mentioned.length || govWords.length)) {
      add({
        id: "remitente_no_oficial",
        detail: `Dice ser ${mentioned[0]?.entity ?? "una entidad"}, pero escribe desde un correo personal (@${domain}).`,
        weight: 2,
      });
      continue;
    }
    const imitated = findImitation(domain, labelOf(domain), whitelist);
    if (imitated) {
      suspiciousDomains.add(domain);
      add({
        id: "remitente_no_oficial",
        detail: `El correo @${domain} imita a ${imitated.entity}.`,
        weight: 2,
      });
    }
  }

  // 4. Pedir un código o clave: ninguna entidad lo hace nunca.
  const asked = asksForSecret(norm);
  if (asked) {
    add({
      id: "pide_codigo",
      detail: `Te pide compartir un código o clave ("${asked}"). Ningún banco ni entidad te lo pide nunca.`,
      weight: THRESHOLDS.peligroso,
    });
  }

  // 5. Palabras clave.
  const pedidos = kw("solicitud");
  if (pedidos.length) {
    add({
      id: "solicitud",
      detail: `Te pide datos, claves o pagos ("${pedidos.slice(0, 2).join('", "')}").`,
      weight: 2,
    });
  }
  const urg = kw("urgencia");
  if (urg.length) {
    add({
      id: "urgencia",
      detail: `Usa urgencia o amenazas para que actúes rápido ("${urg.slice(0, 2).join('", "')}").`,
      weight: Math.min(urg.length, 2),
    });
  }
  const isReceipt = kw("comprobante").length > 0;
  if (isReceipt) {
    add({
      id: "comprobante",
      detail: "Parece un comprobante de pago. Un pantallazo no prueba que el dinero llegó.",
      weight: 0,
    });
  }

  // 6. Reputación externa.
  if (opts.safeBrowsing && finals.length) {
    const bad = await checkSafeBrowsing(finals.map((f) => f.url));
    for (const f of finals) {
      if (bad.has(f.url)) {
        add({
          id: "reputacion",
          detail: `Google reporta ${f.domain} como página peligrosa.`,
          weight: 99,
        });
      }
    }
  }

  let score = signals.reduce((sum, s) => sum + s.weight, 0);
  let verdict = verdictFor(score, isReceipt);

  // 7. IA de apoyo: explica y puede SUBIR el nivel, nunca bajarlo.
  let aiExplanation: string | undefined;
  let offTopic = false;
  if (opts.ai && norm.trim().length >= 12 && !looksLikeManipulation(norm)) {
    const opinion = await askAi(anonymize(text), signals);
    if (opinion && !opinion.esMensaje) {
      // No es un mensaje recibido: no damos veredicto ni explicación de la IA.
      offTopic = signals.length === 0;
    } else if (opinion) {
      aiExplanation = opinion.explicacion || undefined;
      if (verdict === "sin_senales" && opinion.nivel !== "bajo") {
        add({
          id: "ia",
          detail: "La revisión con IA notó un patrón sospechoso en la forma del mensaje.",
          weight: 0,
        });
        verdict = "sospechoso";
        score = Math.max(score, THRESHOLDS.sospechoso);
      }
    }
  }

  return {
    verdict,
    score,
    signals: signals.sort((a, b) => b.weight - a.weight),
    officialDomains: [...officialDomains],
    entities: [...entities],
    suspiciousDomains: [...suspiciousDomains],
    expanded,
    isReceipt,
    aiExplanation,
    hadText: norm.trim().length > 0,
    offTopic,
  };
}
