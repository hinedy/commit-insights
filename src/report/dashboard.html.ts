import { execFileSync } from "node:child_process";
import { basename } from "node:path";
import { type DashboardData } from "./types";
import type { AnalysisResult } from "../analyze";
import type { Commit } from "../extract/types";
import { renderHeader } from "./templates/sections/header";
import { renderMetricCards } from "./templates/sections/metricCards";
import { renderChartContainers } from "./templates/sections/charts";
import { renderTopTickets, renderRecentCommits } from "./templates/sections/tables";
import { renderNarrativeBlock } from "./templates/sections/narrative";
import { renderFooter } from "./templates/sections/footer";
import { buildChartInitScript } from "./charts";
import { STYLES } from "./templates/styles";

export interface SectionHTML {
  header: string;
  metricCards: string;
  charts: string;
  topTickets: string;
  recentCommits: string;
  narrative: string;
  footer: string;
}

export function buildDashboardData(
  analysis: AnalysisResult,
  commits: Commit[],
  narrative?: string,
): DashboardData {
  const authors = new Set(commits.map((c) => c.authorEmail));
  const period = computePeriod(commits);
  const topTickets = Object.entries(analysis.tickets.counts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 15)
    .map(([id, count]) => ({ id, count }));

  const typeLookup = new Map(
    analysis.classification.perCommit.map((c) => [c.hash, c.type]),
  );
  const areaLookup = analysis.areas;

  const recentCommits = commits
    .slice()
    .reverse()
    .slice(0, 200)
    .map((c) => ({
      hash: c.hash,
      date: c.date,
      subject: c.subject,
      type: typeLookup.get(c.hash) ?? "other",
      area: areaLookup.get(c.hash) ?? "Uncategorized",
      tickets: analysis.tickets.perCommit.find(
        (t) => t.hash === c.hash,
      )?.tickets ?? [],
    }));

  const areaCountsArr = Object.entries(analysis.areaCounts)
    .sort((a, b) => b[1] - a[1])
    .map(([area, count]) => ({ area, count }));

  return {
    repoName: getRepoName(),
    period,
    totals: {
      commits: commits.length,
      tickets: topTickets.length,
      authors: authors.size,
    },
    timeline: analysis.timeline,
    typeCounts: analysis.classification.counts,
    areaCounts: areaCountsArr,
    topTickets,
    recentCommits,
    narrative,
    version: "0.0.0-dev",
    generatedAt: new Date().toISOString(),
  };
}

function computePeriod(commits: Commit[]): { start: string; end: string } {
  if (commits.length === 0) return { start: "", end: "" };
  const dates = commits.map((c) => c.date).sort();
  const start = dates[0].slice(0, 7);
  const end = dates[dates.length - 1].slice(0, 7);
  return { start, end };
}

function getRepoName(): string {
  try {
    const url = execFileSync("git", ["config", "--get", "remote.origin.url"], {
      encoding: "utf-8",
      stdio: ["pipe", "pipe", "pipe"],
    }).trim();
    const match = url.match(/\/([^/]+)\.git$/);
    return match ? match[1] : basename(process.cwd());
  } catch {
    return basename(process.cwd());
  }
}

export function assembleDashboard(
  sections: SectionHTML,
  chartJs: string,
  chartInitScript: string,
): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Commit Insights</title>
<style>${STYLES}</style>
<script>${chartJs}</script>
</head>
<body>
${sections.header}
${sections.metricCards}
${sections.narrative}
${sections.charts}
${sections.topTickets}
${sections.recentCommits}
${sections.footer}
<script>${chartInitScript}</script>
</body>
</html>`;
}

export function buildSections(data: DashboardData, chartJs: string, chartInitScript: string): string {
  const sections: SectionHTML = {
    header: renderHeader(data.repoName, data.period),
    metricCards: renderMetricCards(data.totals),
    charts: renderChartContainers(),
    topTickets: renderTopTickets(data.topTickets),
    recentCommits: renderRecentCommits(data.recentCommits),
    narrative: renderNarrativeBlock(data.narrative),
    footer: renderFooter(data.version ?? "0.0.0-dev", data.generatedAt ?? new Date().toISOString()),
  };
  return assembleDashboard(sections, chartJs, chartInitScript);
}
