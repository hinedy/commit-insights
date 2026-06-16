export function renderHeader(
  repoName: string,
  period: { start: string; end: string },
): string {
  return `<header class="dashboard-header">
    <h1 class="repo-name">${repoName}</h1>
    <p class="repo-period">${period.start} – ${period.end}</p>
  </header>`;
}
