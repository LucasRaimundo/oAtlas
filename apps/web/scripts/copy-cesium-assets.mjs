import { cpSync, existsSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { createRequire } from "node:module";
import { dirname, join } from "node:path";

const require = createRequire(import.meta.url);
const cesiumPackageJson = require.resolve("cesium/package.json");
const { version } = JSON.parse(readFileSync(cesiumPackageJson, "utf8"));
const source = join(dirname(cesiumPackageJson), "Build", "Cesium");
const target = join(import.meta.dirname, "..", "public", "cesium");
const versionStamp = join(target, ".version");

if (existsSync(versionStamp) && readFileSync(versionStamp, "utf8") === version) {
  process.exit(0);
}

rmSync(target, { recursive: true, force: true });
for (const dir of ["Workers", "Assets", "Widgets", "ThirdParty"]) {
  cpSync(join(source, dir), join(target, dir), { recursive: true });
}
writeFileSync(versionStamp, version);
console.log(`cesium ${version} assets copiados para public/cesium`);
