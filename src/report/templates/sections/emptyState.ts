export function renderEmptyState(message: string): string {
  return `<div class="empty-state"><span class="empty-icon" aria-hidden="true">~</span><p>${escapeHtml(message)}</p></div>`;
}

function escapeHtml(s: string): string {
  return s.replace(/[&<>"']/g, (c) =>
    ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#x27;" })[c],
  );
}
