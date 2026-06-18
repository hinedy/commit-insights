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
          backgroundColor: "#C4763A",
          borderColor: "#C4763A",
          borderWidth: 0,
          borderRadius: 2,
          hoverBackgroundColor: "#D48A4A",
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        tooltip: {
          backgroundColor: "#1A1810",
          titleFont: { size: 11, family: "ui-monospace, SFMono-Regular, Consolas, monospace" },
          bodyFont: { size: 12, family: "ui-monospace, SFMono-Regular, Consolas, monospace" },
          padding: 10,
          cornerRadius: 4,
          borderColor: "rgba(242,237,230,0.12)",
          borderWidth: 1,
        },
      },
      scales: {
        x: {
          ticks: { color: "#7A7060", font: { size: 10, family: "ui-monospace, SFMono-Regular, Consolas, monospace" } },
          grid: { color: "rgba(242,237,230,0.05)" },
        },
        y: {
          ticks: { color: "#7A7060", stepSize: 1, font: { size: 10, family: "ui-monospace, SFMono-Regular, Consolas, monospace" } },
          grid: { color: "rgba(242,237,230,0.05)" },
        },
      },
    },
  };
}

export interface ChartConfig {
  type: string;
  data: { labels: string[]; datasets: Dataset[] };
  options: Record<string, unknown>;
}

interface Dataset {
  label?: string;
  data: number[];
  backgroundColor?: string | string[];
  borderColor?: string;
  borderWidth?: number;
}
