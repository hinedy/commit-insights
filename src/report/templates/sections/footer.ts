export function renderFooter(version: string, generatedAt: string): string {
  return `<footer class="dashboard-footer">
    <p>Generated at ${generatedAt} &mdash; commit-insights v${escapeHtml(version)}</p>
  </footer>`;
}

function escapeHtml(s: string): string {
  return s.replace(/[&<>"']/g, (c) =>
    ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#x27;" })[c],
  );
}
