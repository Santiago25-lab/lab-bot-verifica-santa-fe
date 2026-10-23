import { describe, expect, it } from "vitest";
import {
  defaultContacts,
  defaultDomains,
  defaultKeywords,
  defaultSimulacros,
} from "@/lib/data/defaults";
import type { AppConfig } from "@/lib/types";
import { analyzeMessage } from "./analyze";
import { anonymize } from "./anonymize";
import { extractUrls } from "./extract";

const config: AppConfig = {
  domains: defaultDomains,
  keywords: defaultKeywords,
  contacts: defaultContacts,
  simulacros: defaultSimulacros,
};

const run = (text: string) => analyzeMessage(text, config);

describe("extractUrls", () => {
  it("encuentra links con y sin esquema y descarta correos", () => {
    const urls = extractUrls(
      "Entra a https://dian-col.com/pago o www.bancolombia.com, escribe a soporte@gmail.com. Fin.",
    );
    expect(urls.map((u) => u.domain)).toEqual(["dian-col.com", "bancolombia.com"]);
  });

  it("entiende sufijos colombianos", () => {
    expect(extractUrls("dian.gov.co")[0]).toMatchObject({ domain: "dian.gov.co", label: "dian" });
  });
});

describe("analyzeMessage", () => {
  it("marca como peligroso un dominio que imita a la DIAN con urgencia", async () => {
    const a = await run(
      "DIAN: Su RUT presenta inconsistencias. Evite embargo en 24 horas: https://dian-pagos.com/rut",
    );
    expect(a.verdict).toBe("peligroso");
    expect(a.signals.map((s) => s.id)).toContain("imitacion");
    expect(a.entities).toContain("DIAN");
  });

  it("usa la lista negra", async () => {
    const a = await run("mira esto dian-col.com");
    expect(a.verdict).toBe("peligroso");
    expect(a.signals[0].id).toBe("lista_negra");
  });

  it("detecta errores de escritura en dominios de bancos", async () => {
    const a = await run("Bancolombia: actualice sus datos en bancolonbia.com.co hoy mismo");
    expect(a.verdict).toBe("peligroso");
    expect(a.signals.some((s) => s.id === "imitacion")).toBe(true);
  });

  it("entidad pública con un link que no es .gov.co", async () => {
    const a = await run("Fiscalía: tiene una citación. Descargue: https://citaciones-online.net/doc");
    expect(a.signals.map((s) => s.id)).toContain("gov_sin_govco");
    expect(a.verdict).toBe("peligroso");
  });

  it("links acortados son al menos sospechosos", async () => {
    const a = await run("Mira esto bit.ly/abc123");
    expect(a.verdict).toBe("sospechoso");
  });

  it("comprobantes de pago siempre piden confirmar", async () => {
    const a = await run("Ya te transferí, mira el comprobante");
    expect(a.isReceipt).toBe(true);
    expect(a.verdict).toBe("sospechoso");
  });

  it("un aviso con dominio oficial y sin presión no da señales", async () => {
    const a = await run("Enel Colombia: tu factura ya está disponible en enel.com.co");
    expect(a.verdict).toBe("sin_senales");
    expect(a.officialDomains).toEqual(["enel.com.co"]);
  });

  it("pedido de clave con urgencia sin link también es peligroso", async () => {
    const a = await run("Urgente: su cuenta será bloqueada, envíe su clave y el código de verificación");
    expect(a.verdict).toBe("peligroso");
  });

  it("remitente con correo personal que dice ser la DIAN", async () => {
    const a = await run("De: dian.notificaciones@gmail.com — DIAN le informa una novedad");
    expect(a.signals.map((s) => s.id)).toContain("remitente_no_oficial");
  });

  it("un saludo normal no da señales", async () => {
    const a = await run("Hola, ¿a qué hora abren mañana?");
    expect(a.verdict).toBe("sin_senales");
    expect(a.signals).toHaveLength(0);
  });
});

describe("anonymize", () => {
  it("quita teléfonos, cédulas, nombres y rutas de links", () => {
    const out = anonymize(
      "Hola Carlos Pérez, su cédula 1.023.456.789 y su celular 310 555 1234. Entre a https://dian-col.com/u/8f7a?id=99",
    );
    expect(out).not.toMatch(/Carlos|1\.023|310 555|8f7a/);
    expect(out).toContain("dian-col.com");
    expect(out).toContain("[número]");
  });
});

describe("imitaciones con errores de escritura", () => {
  it("detecta el nombre mal escrito dentro de un dominio con guiones", async () => {
    const a = await run("Bancolombia: revise bancolonbia-seguro.com");
    expect(a.signals.map((s) => s.id)).toContain("imitacion");
  });

  it("no confunde palabras comunes con entidades", async () => {
    for (const text of ["Mira el menú en restaurante-elsol.com", "Contador en asesoria-fiscal.com"]) {
      const a = await run(text);
      expect(a.signals.map((s) => s.id)).not.toContain("imitacion");
    }
  });
});

describe("pedidos de código", () => {
  it("marca como sospechoso pedir el código que llegó", async () => {
    const a = await run("Hola, soy del banco, te llamamos para confirmar un movimiento, me regalas el código que te llegó?");
    expect(a.verdict).not.toBe("sin_senales");
  });
});

describe("palabras clave repetidas", () => {
  it("no muestra una frase que ya está dentro de otra", async () => {
    const a = await run("me regalas el código que te llegó");
    const detail = a.signals.find((s) => s.id === "solicitud")?.detail ?? "";
    expect(detail).toContain("el codigo que te llego");
    expect(detail.match(/codigo que te llego/g)).toHaveLength(1);
  });
});
