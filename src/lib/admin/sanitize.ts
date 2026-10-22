import { parse } from "tldts";
import type { ConfigTable } from "@/lib/data/store";
import type { KeywordCategory, QuizQuestion, TriageCase } from "@/lib/types";

type Raw = Record<string, unknown>;
type Result = { ok: true; row: Record<string, unknown> } | { ok: false; error: string };

const str = (v: unknown, max = 500) => (typeof v === "string" ? v.trim().slice(0, max) : "");
const bool = (v: unknown) => v === true || v === "true";
const num = (v: unknown, def = 0) => (Number.isFinite(Number(v)) ? Number(v) : def);

const CATEGORIES: KeywordCategory[] = ["urgencia", "solicitud", "comprobante", "entidad_publica"];
const CASES: TriageCase[] = ["pago", "datos", "extorsion", "clic"];

/** Valida y limpia lo que llega del panel antes de guardarlo. */
export function sanitize(table: ConfigTable, raw: Raw): Result {
  switch (table) {
    case "domains": {
      const domain = str(raw.domain, 200)
        .toLowerCase()
        .replace(/^https?:\/\//, "")
        .replace(/\/.*$/, "")
        .replace(/^www\./, "");
      if (!parse(domain).domain) return { ok: false, error: "Dominio inválido" };
      const list = raw.list === "negra" ? "negra" : "blanca";
      return {
        ok: true,
        row: { domain, entity: str(raw.entity, 120), list, priority: bool(raw.priority) },
      };
    }
    case "keywords": {
      const phrase = str(raw.phrase, 80).toLowerCase();
      const category = raw.category as KeywordCategory;
      if (!phrase) return { ok: false, error: "Escribe la palabra o frase" };
      if (!CATEGORIES.includes(category)) return { ok: false, error: "Categoría inválida" };
      return { ok: true, row: { phrase, category } };
    }
    case "contacts": {
      const name = str(raw.name, 120);
      if (!name) return { ok: false, error: "Escribe el nombre" };
      const url = str(raw.url, 300);
      if (url && !/^https:\/\//.test(url)) return { ok: false, error: "El link debe empezar por https://" };
      const cases = (Array.isArray(raw.cases) ? raw.cases : []).filter((c): c is TriageCase =>
        CASES.includes(c as TriageCase),
      );
      return {
        ok: true,
        row: {
          name,
          phone: str(raw.phone, 40),
          url,
          description: str(raw.description, 300),
          cases,
          sort: num(raw.sort, 10),
        },
      };
    }
    case "simulacros": {
      const message = str(raw.message, 1000);
      if (!message) return { ok: false, error: "Escribe el mensaje del simulacro" };
      return {
        ok: true,
        row: {
          sender: str(raw.sender, 120) || "Desconocido",
          message,
          is_phishing: bool(raw.is_phishing),
          key_signal: str(raw.key_signal, 300),
          explanation: str(raw.explanation, 600),
          active: raw.active === undefined ? true : bool(raw.active),
        },
      };
    }
    case "quizzes": {
      const title = str(raw.title, 120);
      const slug = str(raw.slug, 80)
        .toLowerCase()
        .normalize("NFD")
        .replace(/[̀-ͯ]/g, "")
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-|-$/g, "");
      if (!title || !slug) return { ok: false, error: "Escribe título y enlace (slug)" };
      const kind = raw.kind === "encuesta" ? "encuesta" : "prueba";
      const qs = Array.isArray(raw.questions) ? (raw.questions as Raw[]) : [];
      const questions: QuizQuestion[] = [];
      for (const [i, q] of qs.entries()) {
        const options = (Array.isArray(q.options) ? q.options : [])
          .map((o) => str(o, 200))
          .filter(Boolean);
        const prompt = str(q.prompt, 400);
        if (!prompt || options.length < 2) {
          return { ok: false, error: `La pregunta ${i + 1} necesita texto y al menos 2 opciones` };
        }
        const correct = num(q.correct_index, -1);
        if (kind === "prueba" && (correct < 0 || correct >= options.length)) {
          return { ok: false, error: `Marca la respuesta correcta de la pregunta ${i + 1}` };
        }
        questions.push({
          id: str(q.id, 60) || `q-${crypto.randomUUID().slice(0, 8)}`,
          prompt,
          scenario: str(q.scenario, 1000) || undefined,
          options,
          ...(kind === "prueba" ? { correct_index: correct } : {}),
          explanation: str(q.explanation, 600) || undefined,
        });
      }
      if (!questions.length) return { ok: false, error: "Agrega al menos una pregunta" };
      return {
        ok: true,
        row: {
          title,
          slug,
          description: str(raw.description, 300),
          kind,
          published: bool(raw.published),
          sort: num(raw.sort, 10),
          questions,
        },
      };
    }
  }
}
