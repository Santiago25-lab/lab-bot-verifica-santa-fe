import path from "node:path";

// Datos del idioma español incluidos en el proyecto: no se descargan en cada arranque.
const LANG_PATH = path.join(
  process.cwd(),
  "node_modules/@tesseract.js-data/spa/4.0.0_best_int",
);

/**
 * Lee el texto de una captura de pantalla. Devuelve "" si no se pudo leer a tiempo.
 */
export async function ocrImage(image: Buffer, timeoutMs = 30000): Promise<string> {
  const { createWorker } = await import("tesseract.js");
  let worker: Awaited<ReturnType<typeof createWorker>> | null = null;
  let timedOut = false;
  let timer: ReturnType<typeof setTimeout> | undefined;

  const work = (async () => {
    worker = await createWorker("spa", 1, { langPath: LANG_PATH, cacheMethod: "none" });
    if (timedOut) return "";
    const { data } = await worker.recognize(image);
    return data.text.trim();
  })();

  try {
    return await Promise.race([
      work,
      new Promise<string>((resolve) => {
        timer = setTimeout(() => {
          timedOut = true;
          resolve("");
        }, timeoutMs);
      }),
    ]);
  } catch (err) {
    console.warn("OCR falló:", (err as Error).message);
    return "";
  } finally {
    clearTimeout(timer);
    if (timedOut) console.warn("OCR: se agotó el tiempo leyendo la captura.");
    work.catch(() => {}).finally(() => (worker as { terminate(): Promise<unknown> } | null)?.terminate().catch(() => {}));
  }
}
