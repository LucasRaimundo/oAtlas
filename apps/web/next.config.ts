import type { NextConfig } from "next";

// Lido no build: as rewrites entram no manifesto. Basta o endereço; a API não precisa estar no ar.
const orteliusApiUrl = process.env.ORTELIUS_API_URL;
if (!orteliusApiUrl) console.warn("ORTELIUS_API_URL não definida no build: as capas das entidades não vão carregar.");

const nextConfig: NextConfig = {
  cacheComponents: true,
  partialPrefetching: true,
  // O navegador pede as imagens ao próprio Atlas; o Next repassa ao ortelius. A API não fica exposta e não há CORS.
  async rewrites() {
    if (!orteliusApiUrl) return [];
    return [{ source: "/midia/:path*", destination: `${orteliusApiUrl.replace(/\/$/, "")}/v1/media/:path*` }];
  },
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
