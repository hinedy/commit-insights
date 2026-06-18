import { escapeHtml } from "../../escape";

export function renderReviewers(
  reviewers: Array<{ name: string; collaborations: number }>,
): string {
  if (reviewers.length === 0) return "";
  const items = reviewers
    .map(
      (r) =>
        `<li><span class="reviewer-name">${escapeHtml(r.name)}</span><span class="reviewer-count">${r.collaborations}</span></li>`,
    )
    .join("");
  return `<section>
    <h2 class="eyebrow">Reviewers</h2>
    <ul class="reviewer-list">${items}</ul>
  </section>`;
}
