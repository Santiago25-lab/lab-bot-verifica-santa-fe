import { describe, expect, it } from "vitest";
import {
  defaultContacts,
  defaultDomains,
  defaultKeywords,
  defaultSimulacros,
} from "@/lib/data/defaults";
import type { AppConfig } from "@/lib/types";
import { handleMessage, type BotState } from "./conversation";

const ctx = {
  channel: "web" as const,
  config: {
    domains: defaultDomains,
    keywords: defaultKeywords,
    contacts: defaultContacts,
    simulacros: defaultSimulacros,
  } satisfies AppConfig,
  log: async () => {},
};

const say = (text: string, state: BotState = { welcomed: true }) =>
  handleMessage({ kind: "text", text }, state, ctx);

describe("conversación", () => {
  it("da un consejo para aprender después del veredicto", async () => {
    const { replies } = await say("compártenos el código que te llegó");
    expect(replies[0].text).toContain("🔴");
    expect(replies[0].text).toContain("💡");
  });

  it("detecta el gancho del falso familiar", async () => {
    const { replies } = await say("Hola mamá, cambié de número, guárdalo. Necesito que me consignes hoy mismo");
    expect(replies[0].text).toMatch(/familiar/);
    expect(replies[0].text).not.toContain("🟢");
  });

  it("entiende «gracias» sin analizarlo como mensaje", async () => {
    const { replies } = await say("muchas gracias!");
    expect(replies[0].text).toContain("Con gusto");
  });

  it("«¿qué hago?» después de un veredicto lleva al triage", async () => {
    const first = await say("DIAN: evite el embargo en 24 horas en dian-pagos.com");
    const { replies } = await say("¿y ahora qué hago?", first.state);
    expect(replies[0].list?.rows.map((r) => r.id)).toContain("case_pago");
  });

  it("explica qué es phishing", async () => {
    const { replies } = await say("¿Qué es phishing?");
    expect(replies[0].text).toContain("smishing");
  });

  it("explica cómo denunciar con la línea 165", async () => {
    const { replies } = await say("cómo denuncio");
    expect(replies[0].text).toContain("165");
  });
});
