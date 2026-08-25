import esbuild from "esbuild";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.dirname(path.dirname(fileURLToPath(import.meta.url)));

await esbuild.build({
  absWorkingDir: root,
  entryPoints: ["worker/index.ts"],
  bundle: true,
  platform: "node",
  format: "cjs",
  outfile: "dist/worker.cjs",
  logLevel: "info",
  alias: { "@": root },
  external: ["better-sqlite3"],
});
