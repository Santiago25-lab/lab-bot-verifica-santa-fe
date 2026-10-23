import type { Signal } from "@/lib/types";

export interface AiOpinion {
  nivel: "alto" | "medio" | "bajo";
  explicacion: string;
}

export interface AiResult {
  opinion: AiOpinion | null;
  model?: string;
  error?: string;
  /** Cada intento (modelo, forma de pedirlo y error), para el diagnóstico. */
  intentos?: string[];
}

// Formas de pedir que el modelo no "razone" (cambian según la generación del modelo).
type Thinking = "budget0" | "minimal" | "none";
const THINKING: Record<Thinking, object> = {
  budget0: { thinkingConfig: { thinkingBudget: 0 } },
  minimal: { thinkingConfig: { thinkingLevel: "minimal" } },
  none: {},
};

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
const PER_MODEL_MS = 9000;
const TOTAL_MS = 25000;

export function aiEnabled(): boolean {
  return Boolean(process.env.GEMINI_API_KEY);
}

async function callModel(
  model: string,
  prompt: string,
  key: string,
  timeoutMs: number,
  thinking: Thinking,
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
            ...THINKING[thinking],
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
  const intentos: string[] = [];
  let last: AiResult = { opinion: null, error: "sin modelos" };
  outer: for (const model of models) {
    // Si el modelo rechaza la petición (HTTP 400), probamos la siguiente forma de pedirla.
    for (const thinking of ["budget0", "minimal", "none"] as Thinking[]) {
      const left = deadline - Date.now();
      if (left < 2000) break outer;
      last = await callModel(model, prompt, key, Math.min(PER_MODEL_MS, left), thinking);
      intentos.push(`${model} [${thinking}]: ${last.opinion ? "ok" : (last.error ?? "").slice(0, 120)}`);
      if (last.opinion) break outer;
      if (!/HTTP 400/.test(last.error ?? "") || /API key/i.test(last.error ?? "")) break;
    }
    // Cambiamos de modelo si no existe, tardó o no aceptó ninguna forma; una llave
    // inválida o la cuota agotada se repetirían igual en todos.
    if (/API key|HTTP 403|HTTP 429/i.test(last.error ?? "")) break;
  }
  if (last.error) console.warn("Gemini falló:", intentos.join(" | "));
  return { ...last, intentos };
}

export async function askAi(anonymizedText: string, signals: Signal[]): Promise<AiOpinion | null> {
  return (await askAiDetailed(anonymizedText, signals)).opinion;
}
