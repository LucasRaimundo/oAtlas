import { defineConfig } from "@hey-api/openapi-ts";

export default defineConfig({
  input: "./lib/api/openapi.json",
  output: "./lib/api/generated",
  plugins: ["zod"],
});
