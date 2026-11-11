// MapLibre v6 memuat web worker dari file terpisah; bundler tidak menyalinnya.
// Salin ke public/ agar bisa dimuat dari /maplibre/maplibre-gl-worker.mjs.
import { copyFileSync, mkdirSync } from "node:fs";
import { createRequire } from "node:module";
import { dirname, join } from "node:path";

const require = createRequire(import.meta.url);
const dist = dirname(require.resolve("maplibre-gl/package.json")) + "/dist";
mkdirSync("public/maplibre", { recursive: true });
copyFileSync(join(dist, "maplibre-gl-worker.mjs"), "public/maplibre/maplibre-gl-worker.mjs");
console.log("maplibre worker copied");
