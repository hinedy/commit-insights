import { execFileSync } from "node:child_process";
import { resolve, basename } from "node:path";
import { existsSync } from "node:fs";
import type { Command } from "commander";
import { loadEffectiveConfig } from "../config/index.js";
import { syncCache } from "../storage/cache.js";
import { extractCommits } from "../extract/gitLog.js";
import { analyzeCommits } from "../analyze/index.js";
import { mapAreasByFile } from "../analyze/areas.js";
import { buildDashboardData } from "../report/dashboard.html.js";
import { renderDashboard } from "../report/render.js";
import { CHART_JS } from "../report/templates/chartjs-bundle.generated.js";

export function registerGenerateCommand(program: Command): void {
  program
    .command("generate")
    .description("Generate a contribution dashboard from git history")
    .argument("[path]", "Repository path", ".")
    .option("--out <path>", "Output HTML path", "dashboard.html")
    .option("--no-cache", "Skip cache, re-extract everything")
    .option("--all", "Bypass cache entirely, full reconciliation")
    .option("--narrative", "Generate AI narrative (requires provider config)")
    .option("--strict", "Exit with code 1 on AI failure")
    .option("--cdn-charts", "Use CDN-hosted Chart.js instead of bundled")
    .option("--author <name>", "Filter commits by author")
    .action(
      async (
        path: string,
        opts: {
          out: string;
          noCache?: boolean;
          all?: boolean;
          narrative?: boolean;
          strict?: boolean;
          cdnCharts?: boolean;
          author?: string;
        },
      ) => {
        try {
          const repoPath = resolve(path);
          if (!existsSync(repoPath)) {
            console.error(`Error: path does not exist: ${repoPath}`);
            process.exit(1);
          }

          const { config } = loadEffectiveConfig(repoPath);

          console.error("Extracting commits...");
          let commits;
          if (opts.all) {
            commits = await extractCommits(repoPath, opts.author);
          } else {
            const result = await syncCache({
              repoPath,
              noCache: opts.noCache,
              authorFilter: opts.author,
            });
            commits = result.commits;
          }

          if (commits.length === 0) {
            console.error("No commits found.");
            renderDashboard({
              outputPath: opts.out,
              data: {
                repoName: getRepoName(repoPath),
                period: { start: "", end: "" },
                totals: { commits: 0, tickets: 0, authors: 0 },
                timeline: [],
                typeCounts: {},
                areaCounts: [],
                topTickets: [],
                recentCommits: [],
              },
              chartJs: opts.cdnCharts ? "" : CHART_JS,
            });
            console.log(`Dashboard written to ${resolve(opts.out)}`);
            return;
          }

          console.error("Mapping areas...");
          const commitAreaMap = await mapAreasByFile(
            commits.map((c) => c.hash),
            config.areas,
            config.ignorePaths,
            repoPath,
          );

          console.error("Analyzing commits...");
          const analysis = analyzeCommits(commits, config, commitAreaMap);

          let narrative: string | undefined;
          if (opts.narrative) {
            console.error("AI narrative requested but not yet implemented.");
          }

          console.error("Building dashboard...");
          const data = buildDashboardData(analysis, commits, narrative);

          const chartJs = opts.cdnCharts ? "" : CHART_JS;
          const outputPath = resolve(opts.out);
          renderDashboard({ outputPath, data, chartJs });

          console.log(
            `Dashboard written to ${outputPath} (${commits.length} commits, ${data.totals.authors} authors)`,
          );
        } catch (err: unknown) {
          const msg = err instanceof Error ? err.message : String(err);
          console.error(`Error: ${msg}`);
          process.exit(opts.strict ? 1 : 1);
        }
      },
    );
}

function getRepoName(repoPath: string): string {
  try {
    const url = execFileSync("git", ["config", "--get", "remote.origin.url"], {
      cwd: repoPath,
      encoding: "utf-8",
      stdio: ["pipe", "pipe", "pipe"],
    }).trim();
    const match = url.match(/\/([^/]+)\.git$/);
    return match ? match[1] : basename(repoPath);
  } catch {
    return basename(repoPath);
  }
}
