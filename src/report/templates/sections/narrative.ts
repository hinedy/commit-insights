export function renderNarrativeBlock(text: string | undefined): string {
  if (!text) return "";
  const paragraphs = text
    .split(/\n\n+/)
    .map((p) => `<p>${escapeHtml(p.trim())}</p>`)
    .join("");
  return `<section class="narrative-section">
    <h2 class="section-label">Summary</h2>
    <div class="narrative-content">${paragraphs}</div>
  </section>`;
}

function escapeHtml(s: string): string {
  return s.replace(/[&<>"']/g, (c) =>
    ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#x27;" })[c],
  );
}
