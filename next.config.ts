import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  cacheComponents: true,
  partialPrefetching: true,
  // Tesseract (OCR de capturas) usa workers de Node: no se empaqueta.
  serverExternalPackages: ["tesseract.js"],
  outputFileTracingIncludes: {
    "/api/chat": ["./node_modules/@tesseract.js-data/spa/4.0.0_best_int/**"],
    "/api/whatsapp": ["./node_modules/@tesseract.js-data/spa/4.0.0_best_int/**"],
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
