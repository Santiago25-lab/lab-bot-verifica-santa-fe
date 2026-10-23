import type { Signal } from "@/lib/types";

export interface AiOpinion {
  nivel: "alto" | "medio" | "bajo";
  explicacion: string;
}

export interface AiResult {
  opinion: AiOpinion | null;
  model?: string;
  error?: string;
}

const SYSTEM = `Eres un asistente que ayuda a comerciantes de Bogotá (Colombia) a detectar phishing.
Recibes un mensaje ANONIMIZADO y las señales que encontró un motor de reglas.
Responde SOLO un JSON: {"nivel":"alto"|"medio"|"bajo","explicacion":"..."}.
- "nivel" es tu opinión sobre el riesgo de fraude.
- "explicacion": máximo 2 frases cortas, en español sencillo, tuteando, sin tecnicismos, sin emojis.
- Pedir códigos, claves o datos por mensaje o llamada es riesgo alto.
- Nunca digas que un mensaje es "seguro". Si parece normal, recuerda verificar por otro canal.
- No inventes datos que no estén en el mensaje.`;

// Del más rápido al más grande. Si uno tarda demasiado o ya no existe, se prueba el siguiente.
const FALLBACK_MODELS = [
  "gemini-2.5-flash-lite",
  "gemini-flash-lite-latest",
  "gemini-2.5-flash",
  "gemini-flash-latest",
];
const PER_MODEL_MS = 8000;
const TOTAL_MS = 20000;

export function aiEnabled(): boolean {
  return Boolean(process.env.GEMINI_API_KEY);
}

async function callModel(
  model: string,
  prompt: string,
  key: string,
  timeoutMs: number,
  noThinking = true,
): Promise<AiResult> {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), timeoutMs);
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
            maxOutputTokens: 4096,
            responseMimeType: "application/json",
            // Para dos frases no hace falta que el modelo "razone": responde mucho más rápido.
            ...(noThinking ? { thinkingConfig: { thinkingBudget: 0 } } : {}),
          },
        }),
      },
    );
    if (!res.ok) {
      const detail = ((await res.text()) || "").slice(0, 300);
      return { opinion: null, model, error: `HTTP ${res.status}: ${detail}` };
    }
    const data = (await res.json()) as {
      candidates?: { finishReason?: string; content?: { parts?: { text?: string; thought?: boolean }[] } }[];
    };
    const cand = data.candidates?.[0];
    const raw = (cand?.content?.parts ?? [])
      .filter((p) => !p.thought)
      .map((p) => p.text ?? "")
      .join("");
    const match = raw.match(/\{[\s\S]*\}/);
    if (!match) return { opinion: null, model, error: `respuesta sin JSON (fin: ${cand?.finishReason ?? "?"})` };
    const parsed = JSON.parse(match[0]) as Partial<AiOpinion>;
    if (!parsed.nivel || !["alto", "medio", "bajo"].includes(parsed.nivel)) {
      return { opinion: null, model, error: `nivel inválido: ${String(parsed.nivel)}` };
    }
    return {
      model,
      opinion: { nivel: parsed.nivel, explicacion: String(parsed.explicacion ?? "").slice(0, 400) },
    };
  } catch (err) {
    return { opinion: null, model, error: (err as Error).name === "AbortError" ? "tiempo agotado" : (err as Error).message };
  } finally {
    clearTimeout(timer);
  }
}

/** Pide una segunda opinión y una explicación sencilla a Gemini, con el motivo si falla. */
export async function askAiDetailed(anonymizedText: string, signals: Signal[]): Promise<AiResult> {
  const key = process.env.GEMINI_API_KEY;
  if (!key) return { opinion: null, error: "falta GEMINI_API_KEY" };
  const prompt = `Mensaje:\n"""${anonymizedText.slice(0, 3000)}"""\n\nSeñales de las reglas:\n${
    signals.length ? signals.map((s) => `- ${s.detail}`).join("\n") : "- ninguna"
  }`;
  const models = [...new Set([process.env.GEMINI_MODEL, ...FALLBACK_MODELS].filter(Boolean))] as string[];
  const deadline = Date.now() + TOTAL_MS;
  let last: AiResult = { opinion: null, error: "sin modelos" };
  for (const model of models) {
    const left = deadline - Date.now();
    if (left < 2000) break;
    last = await callModel(model, prompt, key, Math.min(PER_MODEL_MS, left));
    // Algunos modelos no aceptan apagar el razonamiento: se reintenta sin esa opción.
    if (/HTTP 400/.test(last.error ?? "") && /thinking/i.test(last.error ?? "")) {
      last = await callModel(model, prompt, key, Math.min(PER_MODEL_MS, deadline - Date.now()), false);
    }
    if (last.opinion) break;
    // Cambiamos de modelo si no existe o tardó; otros errores (llave, cuota) se repetirían igual.
    if (!/HTTP 404|tiempo agotado/.test(last.error ?? "")) break;
  }
  if (last.error) console.warn(`Gemini (${last.model ?? "-"}) falló:`, last.error);
  return last;
}

export async function askAi(anonymizedText: string, signals: Signal[]): Promise<AiOpinion | null> {
  return (await askAiDetailed(anonymizedText, signals)).opinion;
}
