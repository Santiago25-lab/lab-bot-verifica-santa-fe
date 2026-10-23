import { describe, expect, it } from "vitest";
import {
  defaultContacts,
  defaultDomains,
  defaultKeywords,
  defaultSimulacros,
} from "@/lib/data/defaults";
import { handleMessage } from "@/lib/bot/conversation";
import { analyzeMessage, vocabFor } from "@/lib/engine/analyze";
import { normalize } from "@/lib/text";
import type { AppConfig } from "@/lib/types";
import { correctTypos } from "./typos";

const config: AppConfig = {
  domains: defaultDomains,
  keywords: defaultKeywords,
  contacts: defaultContacts,
  simulacros: defaultSimulacros,
};
const fix = (t: string) => correctTypos(normalize(t), vocabFor(config));

describe("corrector de ortografía", () => {
  it.each([
    ["conpartenos el codijo", "compartenos el codigo"],
    ["grasias", "gracias"],
    ["que es el phisibg", "que es el phishing"],
    ["bancolonbia", "bancolombia"],
    ["ganastes un premo", "ganaste un premio"],
  ])("«%s» → «%s»", (input, expected) => expect(fix(input)).toBe(expected));

  it("no toca links, correos ni números", () => {
    expect(fix("entra a bancolonbia-pagos.com o escribe a soporte@grasias.co, 3105551234")).toBe(
      "entra a bancolonbia-pagos.com o escribe a soporte@grasias.co, 3105551234",
    );
  });

  it("no cambia frases normales", () => {
    for (const t of [
      "hola a que hora abren manana",
      "la clase de manana es a las tres",
      "te espero en la casa del banco",
      "el pedido llega el martes",
    ]) {
      expect(fix(t)).toBe(t);
    }
  });
});

describe("las reglas funcionan con faltas de ortografía", () => {
  it("pedir el código mal escrito sigue siendo peligroso", async () => {
    const a = await analyzeMessage("ola somos de bancolonbia conpartenos el codijo q te yego", config);
    expect(a.verdict).toBe("peligroso");
    expect(a.signals.map((s) => s.id)).toContain("pide_codigo");
  });

  it("detecta el premio aunque esté mal escrito", async () => {
    const a = await analyzeMessage("felisidades ganastes un vono, reclamalo con tus datos", config);
    expect(a.signals.map((s) => s.id)).toContain("gancho");
  });

  it("entiende «grasias» y «que es el phisibg» en la conversación", async () => {
    const ctx = { channel: "web" as const, config, log: async () => {} };
    const a = await handleMessage({ kind: "text", text: "grasias!!" }, { welcomed: true }, ctx);
    expect(a.replies[0].text).toContain("Con gusto");
    const b = await handleMessage({ kind: "text", text: "que es  el phisibg_" }, { welcomed: true }, ctx);
    expect(b.replies[0].text).toContain("smishing");
  });
});
