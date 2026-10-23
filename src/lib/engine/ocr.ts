import path from "node:path";

// Datos del idioma español incluidos en el proyecto: no se descargan en cada arranque.
const LANG_PATH = path.join(
  process.cwd(),
  "node_modules/@tesseract.js-data/spa/4.0.0_best_int",
);

export interface OcrResult {
  text: string;
  ms: number;
  error?: string;
}

/** Lee el texto de una imagen y explica el error si no pudo. */
export async function ocrDetailed(image: Buffer, timeoutMs = 30000): Promise<OcrResult> {
  const started = Date.now();
  const { createWorker } = await import("tesseract.js");
  let worker: Awaited<ReturnType<typeof createWorker>> | null = null;
  let timer: ReturnType<typeof setTimeout> | undefined;
  let failWorker: (err: Error) => void = () => {};
  // Los errores internos del worker no llegan como excepción: los convertimos en una.
  const workerFailed = new Promise<never>((_, reject) => {
    failWorker = reject;
  });

  try {
    const text = await Promise.race([
      (async () => {
        worker = await createWorker("spa", 1, {
          langPath: LANG_PATH,
          cacheMethod: "none",
          errorHandler: (e: unknown) => failWorker(e instanceof Error ? e : new Error(String(e))),
        });
        const { data } = await worker.recognize(image);
        return data.text.trim();
      })(),
      workerFailed,
      new Promise<never>((_, reject) => {
        timer = setTimeout(() => reject(new Error(`tiempo agotado (${timeoutMs} ms)`)), timeoutMs);
      }),
    ]);
    return { text, ms: Date.now() - started };
  } catch (err) {
    const error = (err as Error).message || String(err);
    console.warn("OCR falló:", error);
    return { text: "", ms: Date.now() - started, error };
  } finally {
    clearTimeout(timer);
    const w = worker as { terminate(): Promise<unknown> } | null;
    w?.terminate().catch(() => {});
  }
}

/** Lee el texto de una captura de pantalla. Devuelve "" si no se pudo leer a tiempo. */
export async function ocrImage(image: Buffer): Promise<string> {
  return (await ocrDetailed(image)).text;
}
