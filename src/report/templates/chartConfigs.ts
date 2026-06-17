import type { TimelineBucket } from "../../analyze/timeline";

export function monthlyActivityConfig(
  timeline: TimelineBucket[],
): ChartConfig {
  return {
    type: "bar",
    data: {
      labels: timeline.map((b) => b.month),
      datasets: [
        {
          label: "Commits",
          data: timeline.map((b) => b.count),
          backgroundColor: "rgba(226, 232, 240, 0.5)",
          borderColor: "rgba(226, 232, 240, 0.8)",
          borderWidth: 1,
          borderRadius: 3,
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: { legend: { display: false } },
      scales: {
        x: { ticks: { color: "#6b7280" }, grid: { color: "rgba(255,255,255,0.06)" } },
        y: {
          ticks: { color: "#6b7280", stepSize: 1 },
          grid: { color: "rgba(255,255,255,0.06)" },
        },
      },
    },
  };
}

export function typeBreakdownConfig(counts: Record<string, number>): ChartConfig {
  const labels = Object.keys(counts);
  const data = Object.values(counts);
  const COLORS: Record<string, string> = {
    feat: "#34d399",
    fix: "#fbbf24",
    chore: "#6b7280",
    docs: "#60a5fa",
    refactor: "#a78bfa",
    test: "#f87171",
    style: "#34d399",
    perf: "#fb923c",
    ci: "#a78bfa",
    build: "#2dd4bf",
    revert: "#f87171",
    merge: "#e2e8f0",
    other: "#4b5563",
  };

  return {
    type: "doughnut",
    data: {
      labels,
      datasets: [
        {
          data,
          backgroundColor: labels.map(
            (l) => COLORS[l] ?? COLORS.other,
          ),
          borderWidth: 0,
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: "bottom",
          labels: { color: "#6b7280", padding: 14, font: { family: "ui-monospace, SFMono-Regular, Consolas, monospace", size: 10 } },
        },
      },
    },
  };
}

export function areaBreakdownConfig(
  areas: Array<{ area: string; count: number }>,
): ChartConfig {
  return {
    type: "bar",
    indexAxis: "y",
    data: {
      labels: areas.map((a) => a.area),
      datasets: [
        {
          label: "Commits",
          data: areas.map((a) => a.count),
          backgroundColor: "rgba(226, 232, 240, 0.5)",
          borderColor: "rgba(226, 232, 240, 0.8)",
          borderWidth: 1,
          borderRadius: 3,
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: { legend: { display: false } },
      scales: {
        x: {
          ticks: { color: "#6b7280", stepSize: 1 },
          grid: { color: "rgba(255,255,255,0.06)" },
        },
        y: { ticks: { color: "#a0aaba" }, grid: { display: false } },
      },
    },
  };
}

export interface ChartConfig {
  type: string;
  data: { labels: string[]; datasets: Dataset[] };
  options: Record<string, unknown>;
  indexAxis?: string;
}

interface Dataset {
  label?: string;
  data: number[];
  backgroundColor?: string | string[];
  borderColor?: string;
  borderWidth?: number;
}
