import type { Signal } from "@/lib/types";

export interface AiOpinion {
  nivel: "alto" | "medio" | "bajo";
  explicacion: string;
}

const SYSTEM = `Eres un asistente que ayuda a comerciantes de Bogotá (Colombia) a detectar phishing.
Recibes un mensaje ANONIMIZADO y las señales que encontró un motor de reglas.
Responde SOLO un JSON: {"nivel":"alto"|"medio"|"bajo","explicacion":"..."}.
- "nivel" es tu opinión sobre el riesgo de fraude.
- "explicacion": máximo 2 frases cortas, en español sencillo, tuteando, sin tecnicismos, sin emojis.
- Nunca digas que un mensaje es "seguro". Si parece normal, recuerda verificar por otro canal.
- No inventes datos que no estén en el mensaje.`;

export function aiEnabled(): boolean {
  return Boolean(process.env.GEMINI_API_KEY);
}

/** Pide una segunda opinión y una explicación sencilla a Gemini. Devuelve null si falla. */
export async function askAi(anonymizedText: string, signals: Signal[]): Promise<AiOpinion | null> {
  const key = process.env.GEMINI_API_KEY;
  if (!key) return null;
  const model = process.env.GEMINI_MODEL || "gemini-2.5-flash";
  const prompt = `Mensaje:\n"""${anonymizedText.slice(0, 3000)}"""\n\nSeñales de las reglas:\n${
    signals.length ? signals.map((s) => `- ${s.detail}`).join("\n") : "- ninguna"
  }`;
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), 9000);
  try {
    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent`,
      {
        method: "POST",
        signal: ctrl.signal,
        headers: { "content-type": "application/json", "x-goog-api-key": key },
        body: JSON.stringify({
          systemInstruction: { parts: [{ text: SYSTEM }] },
          contents: [{ role: "user", parts: [{ text: prompt }] }],
          generationConfig: {
            temperature: 0.2,
            maxOutputTokens: 1024,
            responseMimeType: "application/json",
          },
        }),
      },
    );
    if (!res.ok) {
      console.warn("Gemini respondió", res.status);
      return null;
    }
    const data = (await res.json()) as {
      candidates?: { content?: { parts?: { text?: string }[] } }[];
    };
    const raw = data.candidates?.[0]?.content?.parts?.map((p) => p.text ?? "").join("") ?? "";
    const parsed = JSON.parse(raw.replace(/^```(json)?|```$/g, "").trim()) as Partial<AiOpinion>;
    if (!parsed.nivel || !["alto", "medio", "bajo"].includes(parsed.nivel)) return null;
    return {
      nivel: parsed.nivel,
      explicacion: String(parsed.explicacion ?? "").slice(0, 400),
    };
  } catch (err) {
    console.warn("Gemini no disponible:", (err as Error).message);
    return null;
  } finally {
    clearTimeout(timer);
  }
}
