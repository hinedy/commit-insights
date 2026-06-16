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
          backgroundColor: "rgba(46, 160, 67, 0.6)",
          borderColor: "#2ea043",
          borderWidth: 1,
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: { legend: { display: false } },
      scales: {
        x: { ticks: { color: "#8b949e" }, grid: { color: "#30363d" } },
        y: {
          ticks: { color: "#8b949e", stepSize: 1 },
          grid: { color: "#30363d" },
        },
      },
    },
  };
}

export function typeBreakdownConfig(counts: Record<string, number>): ChartConfig {
  const labels = Object.keys(counts);
  const data = Object.values(counts);
  const COLORS: Record<string, string> = {
    feat: "#2ea043",
    fix: "#d29922",
    chore: "#8b949e",
    docs: "#58a6ff",
    refactor: "#bc8cff",
    test: "#f0883e",
    style: "#3fb950",
    perf: "#db6d28",
    ci: "#795548",
    build: "#607d8b",
    revert: "#e34c26",
    merge: "#c9d1d9",
    other: "#484f58",
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
          labels: { color: "#8b949e", padding: 12 },
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
          backgroundColor: "rgba(88, 166, 255, 0.6)",
          borderColor: "#58a6ff",
          borderWidth: 1,
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: { legend: { display: false } },
      scales: {
        x: {
          ticks: { color: "#8b949e", stepSize: 1 },
          grid: { color: "#30363d" },
        },
        y: { ticks: { color: "#8b949e" }, grid: { display: false } },
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
