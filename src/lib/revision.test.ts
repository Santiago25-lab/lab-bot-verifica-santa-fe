import { describe, expect, it, vi } from "vitest";
import { buildMetrics, toCsv } from "@/lib/admin/metrics";
import { sanitize } from "@/lib/admin/sanitize";
import { handleMessage, sanitizeState } from "@/lib/bot/conversation";
import { defaultContacts, defaultDomains, defaultKeywords, defaultSimulacros } from "@/lib/data/defaults";
import { analyzeMessage } from "@/lib/engine/analyze";
import { extractUrls } from "@/lib/engine/extract";
import type { AppConfig, EventRow } from "@/lib/types";

vi.mock("server-only", () => ({}));

const config: AppConfig = { domains: defaultDomains, keywords: defaultKeywords, contacts: defaultContacts, simulacros: defaultSimulacros };

describe("detección de links", () => {
  it("no confunde una frase sin espacio después del punto con un link", () => {
    expect(extractUrls("Bancolombia: compra aprobada.Si no la reconoces llama")).toEqual([]);
    expect(extractUrls("Ya llegué.Me avisas")).toEqual([]);
  });

  it("sigue detectando links escritos en mayúsculas o con www", () => {
    expect(extractUrls("Ingresa a DIAN-PAGOS.COM ya").map((u) => u.domain)).toEqual(["dian-pagos.com"]);
    expect(extractUrls("Revisa www.Nequi.com.co").map((u) => u.domain)).toEqual(["nequi.com.co"]);
    expect(extractUrls("entra a bancolombia-seguro.co/pago").map((u) => u.domain)).toEqual(["bancolombia-seguro.co"]);
  });

  it("un aviso real del banco sin link queda sin señales", async () => {
    const a = await analyzeMessage("Bancolombia: compra aprobada.Si no la reconoces llama a la línea de tu tarjeta", config);
    expect(a.verdict).toBe("sin_senales");
  });
});

describe("palabras ambiguas", () => {
  it("«te consigné» cuenta un pago hecho, no lo pide", async () => {
    const a = await analyzeMessage("Te consigné.Es para el pedido de mañana", config);
    expect(a.signals.map((s) => s.id)).not.toContain("solicitud");
  });

  it("«consigne a esta cuenta» sí es un pedido de pago", async () => {
    const a = await analyzeMessage("Consigne hoy a esta cuenta para no perder el cupo", config);
    expect(a.signals.map((s) => s.id)).toContain("solicitud");
  });
});

describe("panel: pruebas del aula", () => {
  it("la respuesta correcta no se corre si hay renglones vacíos entre las opciones", () => {
    const r = sanitize("quizzes", {
      title: "Prueba",
      slug: "prueba",
      kind: "prueba",
      questions: [{ prompt: "¿Cuál?", options: ["A", "", "B", "C", ""], correct_index: 3 }],
    });
    expect(r.ok).toBe(true);
    if (r.ok) {
      const q = (r.row.questions as { options: string[]; correct_index: number }[])[0];
      expect(q.options[q.correct_index]).toBe("C");
    }
  });

  it("no acepta como correcta una opción vacía", () => {
    const r = sanitize("quizzes", { title: "P", slug: "p", kind: "prueba", questions: [{ prompt: "x", options: ["A", "", "B"], correct_index: 1 }] });
    expect(r.ok).toBe(false);
  });

  it("limpia el puerto y la consulta de un dominio pegado", () => {
    const r = sanitize("domains", { domain: "https://www.dian.gov.co:443?x=1", list: "blanca" });
    expect(r.ok && r.row.domain).toBe("dian.gov.co");
  });
});

describe("bot: estado y valoración", () => {
  const ctx = { channel: "web" as const, config, log: async () => {} };

  it("un reporte inventado desde el navegador se anonimiza antes de guardarse", () => {
    const s = sanitizeState({ lastReport: { text: "Llama a Carlos Pérez al 3105551234", verdict: "peligroso", signals: [], domains: [] }, canRate: "sí" });
    expect(s.lastReport?.text).not.toMatch(/3105551234/);
    expect(s.canRate).toBeUndefined();
    expect(sanitizeState({ lastReport: { text: "x", verdict: "inventado" } }).lastReport).toBeUndefined();
  });

  it("la valoración se guarda una sola vez por respuesta", async () => {
    const logged: string[] = [];
    const c = { ...ctx, log: async (e: { type: string }) => void logged.push(e.type) };
    const first = await handleMessage({ kind: "text", text: "compártenos el código que te llegó" }, { welcomed: true }, c);
    const second = await handleMessage({ kind: "button", id: "util_si" }, first.state, c);
    await handleMessage({ kind: "button", id: "util_si" }, second.state, c);
    expect(logged.filter((t) => t === "feedback")).toHaveLength(1);
  });

  it("sin una verificación previa no se registra valoración", async () => {
    const logged: string[] = [];
    await handleMessage({ kind: "text", text: "me sirvió" }, { welcomed: true }, { ...ctx, log: async (e: { type: string }) => void logged.push(e.type) });
    expect(logged).not.toContain("feedback");
  });
});

describe("indicadores", () => {
  const ev = (anon: string, at: string, data: Record<string, unknown>): EventRow => ({ anon_id: anon, channel: "web", type: "simulador", created_at: at, data });

  it("el criterio usa el primer intento de cada persona en la falsa factura", () => {
    const m = buildMetrics(
      [
        ev("P01", "2026-11-01T23:00:00Z", { principal: true, encontradas: ["url"], clic: true, presentes: 5 }),
        ev("P01", "2026-11-01T23:10:00Z", { principal: true, encontradas: ["url", "remitente", "urgencia"], clic: false, presentes: 5 }),
        ev("P02", "2026-11-01T23:05:00Z", { principal: true, encontradas: ["url", "remitente", "adjunto"], clic: false, presentes: 5 }),
      ],
      [],
      [],
    );
    expect(m.simulador.criterio).toEqual({ personas: 2, cumplen: 1, seguros: 1 });
  });

  it("cuenta los días en hora de Colombia", () => {
    const at = new Date();
    at.setUTCHours(1, 0, 0, 0); // 1 a. m. UTC = 8 p. m. del día anterior en Bogotá
    const m = buildMetrics([{ anon_id: "a", channel: "web", type: "verificacion", created_at: at.toISOString() }], [], []);
    const dia = at.toLocaleDateString("en-CA", { timeZone: "America/Bogota" });
    expect(m.porDia.find((d) => d.date === dia)?.verificaciones ?? 0).toBe(at.getTime() <= Date.now() ? 1 : 0);
  });

  it("el CSV no deja fórmulas que Excel ejecute", () => {
    expect(toCsv([{ a: "=HYPERLINK(1)" }], ["a"])).toContain("'=HYPERLINK");
  });
});
