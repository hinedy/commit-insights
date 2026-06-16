import { defineConfig } from "tsup";
import pkg from "./package.json" with { type: "json" };

export default defineConfig({
  entry: ["src/bin/commit-insights.ts", "src/index.ts"],
  format: ["esm"],
  dts: true,
  clean: true,
  define: {
    __VERSION__: JSON.stringify(pkg.version),
  },
  external: ["better-sqlite3"],
});
