import { escapeHtml } from "../../escape";

const TYPE_ORDER = ["feat", "fix", "docs", "refactor", "style", "test", "perf", "ci", "build", "chore", "revert", "merge", "other"];

export function renderMonthlyChart(): string {
  return `<section>
    <h2 class="eyebrow">Activity</h2>
    <div class="chart-container"><canvas id="chart-monthly" height="200"></canvas></div>
  </section>`;
}

export function renderTypeBars(typeCounts: Record<string, number>): string {
  const max = Math.max(...Object.values(typeCounts), 1);
  const rows = TYPE_ORDER
    .filter((t) => typeCounts[t])
    .map((t) => {
      const pct = (typeCounts[t] / max) * 100;
      return `<div class="bar-row">
        <span class="bar-label">${escapeHtml(t)}</span>
        <div class="bar-track"><div class="bar-fill bar-type-${escapeHtml(t)}" style="width:${pct}%"></div></div>
        <span class="bar-count">${typeCounts[t]}</span>
      </div>`;
    })
    .join("");
  return `<section>
    <h2 class="eyebrow">Types</h2>
    <div class="type-bars">${rows}</div>
  </section>`;
}

export function renderAreaBars(areaCounts: Array<{ area: string; count: number }>): string {
  if (areaCounts.length === 0) return "";
  const max = Math.max(...areaCounts.map((a) => a.count), 1);
  const rows = areaCounts
    .map((a) => {
      const pct = (a.count / max) * 100;
      return `<div class="bar-row">
        <span class="bar-label">${escapeHtml(a.area)}</span>
        <div class="bar-track"><div class="bar-fill bar-type-area" style="width:${pct}%"></div></div>
        <span class="bar-count">${a.count}</span>
      </div>`;
    })
    .join("");
  return `<section>
    <h2 class="eyebrow">Areas</h2>
    <div class="area-bars">${rows}</div>
  </section>`;
}
