import { describe, expect, it } from "vitest";
import { CASOS, CASOS_POR_SESION, calificarCaso, casoById, casosDeSesion } from "./casos";

describe("simulador de casos", () => {
  it("cada sesión empieza con la falsa factura y trae al menos un mensaje real", () => {
    for (let k = 0; k < 20; k++) {
      const s = casosDeSesion();
      expect(s).toHaveLength(CASOS_POR_SESION);
      expect(s[0].principal).toBe(true);
      expect(s.some((c) => !c.fraude)).toBe(true);
      expect(new Set(s.map((c) => c.id)).size).toBe(s.length);
    }
  });

  it("la falsa factura tiene las 5 señales del kit", () => {
    expect(Object.keys(CASOS.find((c) => c.principal)!.senales).sort()).toEqual(
      ["adjunto", "ortografia", "remitente", "urgencia", "url"],
    );
  });

  it("califica señales encontradas, omitidas y falsas alarmas", () => {
    const r = calificarCaso(casoById("proveedor-cuenta")!, ["remitente", "url"], true);
    expect(r.correcto).toBe(true);
    expect(r.encontradas).toEqual(["remitente"]);
    expect(r.omitidas.sort()).toEqual(["adjunto", "urgencia"]);
    expect(r.falsasAlarmas).toEqual(["url"]);
  });

  it("los mensajes reales no tienen señales", () => {
    for (const c of CASOS.filter((x) => !x.fraude)) expect(Object.keys(c.senales)).toHaveLength(0);
  });
});
