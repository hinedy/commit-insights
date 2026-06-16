export function renderNarrativeBlock(text: string | undefined): string {
  if (!text) return "";
  const paragraphs = text
    .split(/\n\n+/)
    .map((p) => `<p>${escapeHtml(p.trim())}</p>`)
    .join("");
  return `<div class="narrative-card">
    <h3 class="narrative-heading">Summary</h3>
    ${paragraphs}
  </div>`;
}

function escapeHtml(s: string): string {
  return s.replace(/[&<>"']/g, (c) =>
    ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#x27;" })[c],
  );
}
