import { normalize } from "@/lib/text";

/**
 * Corrector de ortografía "a oído" para el bot.
 * La gente escribe como suena ("conpartenos el codijo", "grasias", "phisibg"): llevamos cada
 * palabra a una forma fonética y, si se parece mucho a una palabra importante del vocabulario,
 * la reemplazamos por la correcta. Así las reglas funcionan aunque haya faltas.
 */

/** Forma fonética: v=b, z/ce/ci=s, ll=y, h muda, c/qu=k, ge/gi=je/ji, sin letras repetidas. */
export function phonetic(word: string): string {
  return word
    .replace(/ph/g, "f")
    .replace(/(?<!c)h/g, "")
    .replace(/ll/g, "y")
    .replace(/v/g, "b")
    .replace(/z/g, "s")
    .replace(/c(?=[ei])/g, "s")
    .replace(/qu(?=[ei])/g, "k")
    .replace(/c(?!h)/g, "k")
    .replace(/g(?=[ei])/g, "j")
    .replace(/m(?=[pb])/g, "n")
    .replace(/(.)\1+/g, "$1");
}

// Teclas vecinas en un teclado de celular o computador (QWERTY en español).
const ROWS = ["qwertyuiop", "asdfghjklñ", "zxcvbnm"];
const NEAR = new Set<string>();
ROWS.forEach((row, r) => {
  [...row].forEach((ch, i) => {
    const around = [row[i - 1], row[i + 1], ROWS[r - 1]?.[i], ROWS[r - 1]?.[i + 1], ROWS[r + 1]?.[i], ROWS[r + 1]?.[i - 1]];
    for (const o of around) if (o) NEAR.add(ch + o);
  });
});
// Letras que la gente confunde porque suenan parecido.
for (const pair of ["gj", "yi", "nm", "sx", "kg"]) {
  NEAR.add(pair);
  NEAR.add(pair[1] + pair[0]);
}

/**
 * Distancia de edición pensada para faltas reales: sobra o falta una letra = 1; cambiar una
 * letra por una vecina en el teclado o que suena parecido = 1; por cualquier otra = 2.
 * Así "phisibg"≈"phishing" (b/n vecinas) pero "estufa"≠"estafa" y "encargo"≠"embargo".
 */
export function typoDistance(a: string, b: string): number {
  const prev = Array.from({ length: b.length + 1 }, (_, i) => i);
  for (let i = 1; i <= a.length; i++) {
    let diag = prev[0];
    prev[0] = i;
    for (let j = 1; j <= b.length; j++) {
      const tmp = prev[j];
      const subCost = a[i - 1] === b[j - 1] ? 0 : NEAR.has(a[i - 1] + b[j - 1]) ? 1 : 2;
      prev[j] = Math.min(prev[j] + 1, prev[j - 1] + 1, diag + subCost);
      diag = tmp;
    }
  }
  return prev[b.length];
}

/** Errores permitidos según el largo de la palabra. Las cortas no se corrigen. */
function tolerance(length: number): number {
  if (length >= 8) return 2;
  if (length >= 5) return 1;
  return 0;
}

// Palabras comunes que se parecen a una del vocabulario y nunca se deben cambiar.
const KEEP = new Set(["clase", "clases", "casa", "cosa", "pena", "pino", "codo", "banco", "bancos"]);

export interface Vocab {
  words: Map<string, string>; // forma fonética -> palabra correcta
  byFirst: Map<string, [string, string][]>;
}

/**
 * @param words palabras que se corrigen aunque tengan letras de más o de menos.
 * @param exactOnly palabras que solo se corrigen si suenan igual (p. ej. conjugaciones:
 *   "enviamos" no debe volverse "envianos").
 */
export function buildVocab(words: Iterable<string>, exactOnly: Iterable<string> = []): Vocab {
  const map = new Map<string, string>();
  const fuzzy = new Map<string, string>();
  const add = (raw: string, target: Map<string, string>) => {
    for (const w of normalize(raw).split(/[^a-zñ]+/)) {
      if (w.length >= 4 && !map.has(phonetic(w))) {
        map.set(phonetic(w), w);
        target.set(phonetic(w), w);
      }
    }
  };
  for (const raw of exactOnly) add(raw, new Map());
  for (const raw of words) add(raw, fuzzy);
  const byFirst = new Map<string, [string, string][]>();
  for (const [ph, w] of fuzzy) {
    const list = byFirst.get(ph[0]) ?? [];
    list.push([ph, w]);
    byFirst.set(ph[0], list);
  }
  return { words: map, byFirst };
}

/** Corrige un texto ya normalizado. No toca links, correos ni números. */
export function correctTypos(norm: string, vocab: Vocab): string {
  return norm.replace(/[^\s]+/g, (chunk) => {
    // Links, correos y cosas con números quedan tal cual.
    if (/[./@:\d]/.test(chunk.replace(/[.,;:!?¿¡]+$/, ""))) return chunk;
    return chunk.replace(/[a-zñ]+/g, (word) => {
      if (word.length < 4 || KEEP.has(word)) return word;
      const ph = phonetic(word);
      const exact = vocab.words.get(ph);
      if (exact) return exact;
      const candidates = vocab.byFirst.get(ph[0]) ?? [];
      let best: string | null = null;
      let bestDist = Infinity;
      for (const [vph, w] of candidates) {
        const tol = tolerance(vph.length);
        if (!tol || Math.abs(vph.length - ph.length) > tol) continue;
        const d = typoDistance(ph, vph);
        if (d <= tol && d < bestDist) {
          best = w;
          bestDist = d;
        }
      }
      return best ?? word;
    });
  });
}
