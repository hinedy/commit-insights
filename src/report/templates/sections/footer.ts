export function renderFooter(version: string, generatedAt: string): string {
  const date = generatedAt.slice(0, 10);
  return `<footer class="dashboard-footer">
    <p>Generated ${date} &mdash; commit-insights v${escapeHtml(version)}</p>
    <span class="footer-badge">local &middot; private</span>
  </footer>`;
}

function escapeHtml(s: string): string {
  return s.replace(/[&<>"']/g, (c) =>
    ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#x27;" })[c],
  );
}
