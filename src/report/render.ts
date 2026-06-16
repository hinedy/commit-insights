import { writeFileSync } from "node:fs";
import type { DashboardData } from "./types";
import { buildSections } from "./dashboard.html";
import { buildChartInitScript } from "./charts";

export interface RenderOpts {
  outputPath: string;
  data: DashboardData;
  chartJs: string;
}

export function renderDashboard(opts: RenderOpts): string {
  const chartInitScript = buildChartInitScript(opts.data);
  const html = buildSections(opts.data, opts.chartJs, chartInitScript);
  writeFileSync(opts.outputPath, html, "utf-8");
  return opts.outputPath;
}
