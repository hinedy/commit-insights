export function renderChartContainers(): string {
  return `<div class="charts-grid">
    <div class="chart-wrapper"><h3>Monthly Activity</h3><div class="chart-container"><canvas id="chart-monthly" height="280"></canvas></div></div>
    <div class="chart-wrapper"><h3>Type Breakdown</h3><div class="chart-container"><canvas id="chart-types" height="280"></canvas></div></div>
    <div class="chart-wrapper"><h3>Top Areas</h3><div class="chart-container"><canvas id="chart-areas" height="280"></canvas></div></div>
  </div>`;
}
