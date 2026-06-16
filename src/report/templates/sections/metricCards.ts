export function renderMetricCards(totals: {
  commits: number;
  tickets: number;
  authors: number;
}): string {
  return `<div class="metric-cards">
    <div class="metric-card"><span class="metric-value">${totals.commits}</span><span class="metric-label">Commits</span></div>
    <div class="metric-card"><span class="metric-value">${totals.tickets}</span><span class="metric-label">Tickets</span></div>
    <div class="metric-card"><span class="metric-value">${totals.authors}</span><span class="metric-label">Authors</span></div>
  </div>`;
}
