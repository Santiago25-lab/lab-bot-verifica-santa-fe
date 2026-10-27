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

describe("reportar mensajes", () => {
  it("después de un veredicto ofrece reportar y guarda el mensaje sin datos personales", async () => {
    const logged: { type: string; data?: Record<string, unknown> }[] = [];
    const c = { ...ctx, log: async (e: { type: string; data?: Record<string, unknown> }) => void logged.push(e) };
    const first = await handleMessage(
      { kind: "text", text: "Hola Carlos Pérez, compártenos el código. Llámanos al 3105551234 o entra a https://banco-seguro.xyz/u/99" },
      { welcomed: true },
      c,
    );
    expect(first.replies.at(-1)?.buttons?.map((b) => b.id)).toContain("reportar");
    const second = await handleMessage({ kind: "button", id: "reportar" }, first.state, c);
    expect(second.replies[0].text).toContain("Gracias por reportarlo");
    const report = logged.find((e) => e.type === "reporte");
    expect(report).toBeDefined();
    const texto = String(report?.data?.texto);
    expect(texto).not.toMatch(/Carlos|3105551234|\/u\/99/);
    expect(texto).toContain("banco-seguro.xyz");
    expect(second.state.lastReport).toBeUndefined();
  });

  it("si no hay mensaje revisado, pide enviarlo primero", async () => {
    const { replies } = await say("reportar");
    expect(replies[0].text).toContain("Primero envíame");
  });
});

describe("criterio del bot", () => {
  it("en la web ofrece valorar la respuesta y guarda la valoración", async () => {
    const logged: { type: string; data?: Record<string, unknown> }[] = [];
    const c = { ...ctx, log: async (e: { type: string; data?: Record<string, unknown> }) => void logged.push(e) };
    const first = await handleMessage({ kind: "text", text: "compártenos el código que te llegó" }, { welcomed: true }, c);
    expect(first.replies.at(-1)?.buttons?.map((b) => b.id)).toContain("util_si");
    expect(typeof logged.find((e) => e.type === "verificacion")?.data?.ms).toBe("number");
    const second = await handleMessage({ kind: "button", id: "util_si" }, first.state, c);
    expect(second.replies[0].text).toContain("Gracias");
    expect(logged.find((e) => e.type === "feedback")?.data?.util).toBe(true);
  });

  it("en WhatsApp no pasa de 3 botones", async () => {
    const { replies } = await handleMessage(
      { kind: "text", text: "compártenos el código que te llegó" },
      { welcomed: true },
      { ...ctx, channel: "whatsapp" as const },
    );
    for (const r of replies) expect((r.buttons ?? []).length).toBeLessThanOrEqual(3);
  });
});
