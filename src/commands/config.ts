import type { Command } from "commander";
import { loadEffectiveConfig } from "../config/index.js";
import type { ProvenanceMap } from "../config/index.js";

function formatExplain(provenance: ProvenanceMap): string {
  const lines: string[] = [];
  for (const [key, entry] of Object.entries(provenance)) {
    const source = entry.source ? ` (${entry.source})` : "";
    lines.push(`${key} <- ${entry.layer}${source}`);
  }
  return lines.sort().join("\n");
}

export function registerConfigCommand(program: Command): void {
  program
    .command("config")
    .description("Show effective configuration")
    .argument("[path]", "Repository path", ".")
    .option("--json", "Output as JSON")
    .option("--explain", "Show per-key provenance")
    .action((path: string, options: { json?: boolean; explain?: boolean }) => {
      const result = loadEffectiveConfig(path);
      if (options.explain) {
        console.log(formatExplain(result.provenance));
      } else if (options.json) {
        console.log(JSON.stringify(result.config, null, 2));
      } else {
        console.log(JSON.stringify(result.config, null, 2));
      }
    });
}
