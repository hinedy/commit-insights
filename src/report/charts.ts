import type { DashboardData } from "./types";
import type { ChartConfig } from "./templates/chartConfigs";
import {
  monthlyActivityConfig,
  typeBreakdownConfig,
  areaBreakdownConfig,
} from "./templates/chartConfigs";

export function buildMonthlyConfig(data: DashboardData): ChartConfig {
  return monthlyActivityConfig(data.timeline);
}

export function buildTypeConfig(data: DashboardData): ChartConfig {
  return typeBreakdownConfig(data.typeCounts);
}

export function buildAreaConfig(data: DashboardData): ChartConfig {
  return areaBreakdownConfig(data.areaCounts);
}

export function buildChartInitScript(data: DashboardData): string {
  const monthly = JSON.stringify(buildMonthlyConfig(data));
  const types = JSON.stringify(buildTypeConfig(data));
  const areas = JSON.stringify(buildAreaConfig(data));

  return `
document.addEventListener("DOMContentLoaded", function () {
  new Chart(document.getElementById("chart-monthly"), ${monthly});
  new Chart(document.getElementById("chart-types"), ${types});
  new Chart(document.getElementById("chart-areas"), ${areas});
});`;
}
