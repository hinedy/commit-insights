export function renderStatsBar(totals: {
  commits: number;
  authors: number;
  tickets: number;
}): string {
  const items = [
    `<div class="stats-item"><span class="stats-value">${totals.commits}</span><span class="stats-label">commits</span></div>`,
    `<div class="stats-item"><span class="stats-value">${totals.authors}</span><span class="stats-label">authors</span></div>`,
  ];
  if (totals.tickets > 0) {
    items.push(`<div class="stats-item"><span class="stats-value">${totals.tickets}</span><span class="stats-label">tickets</span></div>`);
  }
  return `<div class="stats-bar">${items.join('')}</div>`;
}
