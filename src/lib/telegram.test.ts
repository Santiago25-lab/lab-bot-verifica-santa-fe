import { describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));
const { toTelegramHtml } = await import("./telegram");

describe("formato de Telegram", () => {
  it("convierte negrita y cursiva de WhatsApp a HTML", () => {
    expect(toTelegramHtml("👉 *Qué hacer:* no pagues. _Ojo_")).toBe("👉 <b>Qué hacer:</b> no pagues. <i>Ojo</i>");
  });

  it("escapa el texto del usuario para que no se interprete como HTML", () => {
    expect(toTelegramHtml("<script>alert(1)</script> & más")).toBe("&lt;script&gt;alert(1)&lt;/script&gt; &amp; más");
  });

  it("no toca los guiones bajos dentro de links o palabras", () => {
    expect(toTelegramHtml("entra a mi_banco_seguro.com")).toBe("entra a mi_banco_seguro.com");
  });
});
