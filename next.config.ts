import type { NextConfig } from "next";

const OCR_FILES = [
  "./node_modules/tesseract.js/**",
  "./node_modules/tesseract.js-core/**",
  "./node_modules/@tesseract.js-data/spa/4.0.0_best_int/**",
];

const nextConfig: NextConfig = {
  cacheComponents: true,
  partialPrefetching: true,
  // Tesseract (OCR de capturas) usa workers de Node: no se empaqueta.
  serverExternalPackages: ["tesseract.js"],
  // Tesseract carga su motor (WebAssembly) y el idioma de forma dinámica: el empaquetador
  // no los detecta, así que los incluimos a mano en las funciones que leen capturas.
  outputFileTracingIncludes: {
    "/api/chat": OCR_FILES,
    "/api/whatsapp": OCR_FILES,
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
