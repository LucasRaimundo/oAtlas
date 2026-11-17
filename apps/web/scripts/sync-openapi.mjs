import { writeFile } from "node:fs/promises";

const baseUrl = process.env.ORTELIUS_API_URL;
if (!baseUrl) {
  console.error("Defina ORTELIUS_API_URL (ex.: http://localhost:8000) com o ortelius rodando.");
  process.exit(1);
}

const response = await fetch(new URL("/openapi.json", baseUrl), { signal: AbortSignal.timeout(10_000) });
if (!response.ok) {
  console.error(`O ortelius respondeu ${response.status} para /openapi.json.`);
  process.exit(1);
}

const target = new URL("../lib/api/openapi.json", import.meta.url);
await writeFile(target, `${JSON.stringify(await response.json(), null, 2)}\n`);
console.log("Snapshot do OpenAPI atualizado; rode npm run api:generate.");
