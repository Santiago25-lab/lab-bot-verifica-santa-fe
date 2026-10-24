import fs from "node:fs";
import path from "node:path";
import type { NextConfig } from "next";

/** Carpeta de un paquete y de todas sus dependencias (para incluirlas en el despliegue). */
function packageTree(name: string, from = process.cwd(), seen = new Set<string>()): Set<string> {
  let dir = from;
  for (;;) {
    const pkgJson = path.join(dir, "node_modules", name, "package.json");
    if (fs.existsSync(pkgJson)) {
      const pkgDir = path.dirname(pkgJson);
      const rel = `./${path.relative(process.cwd(), pkgDir).split(path.sep).join("/")}`;
      if (seen.has(rel)) return seen;
      seen.add(rel);
      const { dependencies = {} } = JSON.parse(fs.readFileSync(pkgJson, "utf8"));
      for (const dep of Object.keys(dependencies)) packageTree(dep, pkgDir, seen);
      return seen;
    }
    const up = path.dirname(dir);
    if (up === dir) return seen;
    dir = up;
  }
}

// El worker de Tesseract corre aparte y carga sus librerías, su motor WebAssembly y el
// idioma de forma dinámica: el empaquetador no los detecta, así que van a mano.
const OCR_FILES = [
  ...[...packageTree("tesseract.js")].map((dir) => `${dir}/**`),
  "./node_modules/@tesseract.js-data/spa/4.0.0_best_int/**",
];

const nextConfig: NextConfig = {
  cacheComponents: true,
  partialPrefetching: true,
  // Tesseract (OCR de capturas) usa workers de Node: no se empaqueta.
  serverExternalPackages: ["tesseract.js"],
  outputFileTracingIncludes: {
    "/api/chat": OCR_FILES,
    "/api/whatsapp": OCR_FILES,
    "/api/telegram": OCR_FILES,
    "/api/admin/ocr": OCR_FILES,
  },
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "X-Frame-Options", value: "DENY" },
        ],
      },
    ];
  },
};

export default nextConfig;
