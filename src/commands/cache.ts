import { Command } from "commander";
import { getCacheStats, clearCache } from "../storage/cache.js";

export function registerCacheCommand(program: Command): void {
  const cache = program.command("cache").description("Manage commit cache");

  cache
    .command("status")
    .description("Show cache statistics")
    .action(() => {
      try {
        const stats = getCacheStats(process.cwd());
        console.log(`Commit count:  ${stats.commitCount}`);
        console.log(`Last run at:   ${stats.lastRunAt ?? "never"}`);
        console.log(`Last head:     ${stats.lastHead ?? "none"}`);
        console.log(`DB size:       ${stats.dbSizeBytes} bytes`);
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : String(err);
        console.error(`Error: ${msg}`);
        process.exit(1);
      }
    });

  cache
    .command("clear")
    .description("Clear the commit cache")
    .action(() => {
      try {
        clearCache(process.cwd());
        console.log("Cache cleared.");
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : String(err);
        console.error(`Error: ${msg}`);
        process.exit(1);
      }
    });
}
