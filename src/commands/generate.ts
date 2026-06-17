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
import { createProvider } from "../ai/providers/index.js";
import { generateNarrative } from "../ai/narratives.js";

export function registerGenerateCommand(program: Command): void {
  program
    .command("generate")
    .description("Generate a contribution dashboard from git history")
    .argument("[path]", "Repository path", ".")
    .option("--out <path>", "Output HTML path", "dashboard.html")
    .option("--no-cache", "Skip cache, re-extract everything")
    .option("--all", "Bypass cache entirely, full reconciliation")
    .option("--narrative", "Generate AI narrative (requires provider config)")
    .option("--narrative-audience <audience>", "Narrative audience: manager, retro, resume, self", "self")
    .option("--narrative-length <length>", "Narrative length: short, normal", "normal")
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
          narrativeAudience?: string;
          narrativeLength?: string;
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
              const aiConfig = config.ai;
              if (!aiConfig?.provider) {
              console.error("Warning: --narrative requires an AI provider (set ai.provider in config).");
              if (opts.strict) process.exit(1);
            } else {
              const { provider, error } = createProvider(aiConfig);
              if (error || !provider) {
                console.error(`Warning: AI narrative unavailable: ${error?.message ?? "unknown error"}.`);
                if (opts.strict) process.exit(1);
              } else {
                console.error("Generating AI narrative...");
                const authors = new Set(commits.map((c) => c.authorEmail));
                const dates = commits.map((c) => c.date).filter(Boolean).sort();
                const totalCommits = commits.length;
                const narrativeText = await generateNarrative(provider, {
                  totalCommits,
                  dateRange: { from: dates[0] ?? "", to: dates[dates.length - 1] ?? "" },
                  totalAuthors: authors.size,
                  monthlyTimeline: analysis.timeline,
                  typeBreakdown: analysis.classification.counts,
                  topTickets: Object.entries(analysis.tickets.counts)
                    .sort((a, b) => b[1] - a[1])
                    .slice(0, 15)
                    .map(([id, count]) => ({ id, count })),
                  ticketSummary: `${analysis.tickets.perCommit.filter((t) => t.tickets.length > 0).length} commits reference tickets`,
                  topReviewers: analysis.reviewers.slice(0, 10),
                }, {
                  audience: opts.narrativeAudience,
                  length: opts.narrativeLength,
                });
                if (narrativeText) {
                  narrative = narrativeText;
                } else {
                  console.error("Warning: AI narrative generation failed.");
                  if (opts.strict) process.exit(1);
                }
              }
            }
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
