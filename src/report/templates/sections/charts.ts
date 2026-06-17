export function renderChartContainers(): string {
  return `<section class="charts-section">
    <h2 class="section-label">Activity</h2>
    <div class="chart-full">
      <div class="chart-wrapper">
        <div class="chart-container"><canvas id="chart-monthly" height="240"></canvas></div>
      </div>
    </div>
    <div class="charts-split">
      <div class="chart-wrapper">
        <h3>Type</h3>
        <div class="chart-container"><canvas id="chart-types" height="240"></canvas></div>
      </div>
      <div class="chart-wrapper">
        <h3>Area</h3>
        <div class="chart-container"><canvas id="chart-areas" height="240"></canvas></div>
      </div>
    </div>
  </section>`;
}
