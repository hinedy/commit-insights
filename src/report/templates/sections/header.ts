import { escapeHtml } from "../../escape";

export function renderHeader(
  repoName: string,
  period: { start: string; end: string },
): string {
  return `<header class="dashboard-header">
    <h1 class="repo-name">${escapeHtml(repoName)}</h1>
    <p class="repo-period">${escapeHtml(period.start)} – ${escapeHtml(period.end)}</p>
  </header>`;
}
