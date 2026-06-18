import { escapeHtml } from "../../escape";

export function renderHeader(
  repoName: string,
  period: { start: string; end: string },
  generatedAt: string,
  totals: { commits: number },
): string {
  const date = generatedAt.slice(0, 10);
  return `<header class="hero">
    <div class="hero-row"><span class="hero-number">${totals.commits}</span><span class="hero-label">commits</span></div>
    <div class="hero-repo">${escapeHtml(repoName)}</div>
    <div class="hero-period">${escapeHtml(period.start)} – ${escapeHtml(period.end)} <span class="hero-period-gen">· ${escapeHtml(date)}</span></div>
  </header>`;
}
