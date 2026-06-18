declare const __VERSION__: string;

import type { DashboardData } from "./types";
import type { AnalysisResult } from "../analyze";
import type { Commit } from "../extract/types";
import { renderHeader } from "./templates/sections/header";
import { renderStatsBar } from "./templates/sections/statsBar";
import { renderMonthlyChart, renderTypeBars, renderAreaBars } from "./templates/sections/charts";
import { renderTickets } from "./templates/sections/tickets";
import { renderReviewers } from "./templates/sections/reviewers";
import { renderRecentCommits } from "./templates/sections/tables";
import { renderNarrativeBlock } from "./templates/sections/narrative";
import { renderFooter } from "./templates/sections/footer";
import { buildChartInitScript } from "./charts";
import { STYLES } from "./templates/styles";

export function buildDashboardData(
  analysis: AnalysisResult,
  commits: Commit[],
  repoName: string,
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
    repoName,
    period,
    totals: {
      commits: commits.length,
      tickets: Object.keys(analysis.tickets.counts).length,
      authors: authors.size,
    },
    timeline: analysis.timeline,
    typeCounts: analysis.classification.counts,
    areaCounts: areaCountsArr,
    topTickets,
    reviewers: analysis.reviewers,
    recentCommits,
    narrative,
    version: typeof __VERSION__ !== "undefined" ? __VERSION__ : "dev",
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

export function assembleDashboard(
  header: string,
  statsBar: string,
  narrative: string,
  monthlyChart: string,
  typeBars: string,
  areaBars: string,
  sideBySide: string,
  recentCommits: string,
  footer: string,
  chartJs: string,
  chartInitScript: string,
): string {
  const scrollObserver = `document.addEventListener("DOMContentLoaded",function(){if(window.matchMedia("(prefers-reduced-motion:reduce)").matches)return;var o=new IntersectionObserver(function(e){e.forEach(function(e,i){if(e.isIntersecting){setTimeout(function(){e.target.classList.add("section-visible")},i*80);o.unobserve(e.target)}})},{threshold:0.1});document.querySelectorAll("section").forEach(function(e){o.observe(e)})});`;

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
${header}
${statsBar}
${narrative}
${monthlyChart}
${typeBars}
${areaBars}
${sideBySide}
${recentCommits}
${footer}
<script>${chartInitScript}</script>
<script>${scrollObserver}</script>
</body>
</html>`;
}

export function buildSections(data: DashboardData, chartJs: string, chartInitScript: string): string {
  const generatedAt = data.generatedAt ?? new Date().toISOString();
  const ticketsHtml = renderTickets(data.topTickets);
  const reviewersHtml = renderReviewers(data.reviewers);
  let sideBySide = "";
  if (ticketsHtml && reviewersHtml) {
    sideBySide = `<div class="side-grid">${ticketsHtml}${reviewersHtml}</div>`;
  } else {
    sideBySide = ticketsHtml + reviewersHtml;
  }
  return assembleDashboard(
    renderHeader(data.repoName, data.period, generatedAt, data.totals),
    renderStatsBar(data.totals),
    renderNarrativeBlock(data.narrative),
    renderMonthlyChart(),
    renderTypeBars(data.typeCounts),
    renderAreaBars(data.areaCounts),
    sideBySide,
    renderRecentCommits(data.recentCommits),
    renderFooter(data.version ?? "0.0.0-dev", generatedAt),
    chartJs,
    chartInitScript,
  );
}
