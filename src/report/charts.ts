import type { DashboardData } from "./types";
import type { ChartConfig } from "./templates/chartConfigs";
import { monthlyActivityConfig } from "./templates/chartConfigs";

export function buildMonthlyConfig(data: DashboardData): ChartConfig {
  return monthlyActivityConfig(data.timeline);
}

export function buildChartInitScript(data: DashboardData): string {
  const monthly = JSON.stringify(buildMonthlyConfig(data));

  return `
document.addEventListener("DOMContentLoaded", function () {
  new Chart(document.getElementById("chart-monthly"), ${monthly});
});`;
}
