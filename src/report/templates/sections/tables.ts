import { escapeHtml } from "../../escape";

export function renderRecentCommits(
  commits: Array<{
    hash: string;
    date: string;
    subject: string;
    type: string;
    area: string;
    tickets: string[];
  }>,
): string {
  const limited = commits.slice(0, 200);
  const header = `<div class="commit-grid-header">
    <div class="commit-cell hash">Hash</div>
    <div class="commit-cell date">Date</div>
    <div class="commit-cell type">Type</div>
    <div class="commit-cell subject">Subject</div>
  </div>`;
  const rows = limited
    .map(
      (c) => `<div class="commit-row">
        <div class="commit-cell hash">${escapeHtml(c.hash.slice(0, 7))}</div>
        <div class="commit-cell date">${escapeHtml(c.date)}</div>
        <div class="commit-cell type"><span class="type-badge type-${escapeHtml(c.type)}">${escapeHtml(c.type)}</span></div>
        <div class="commit-cell subject">${escapeHtml(c.subject)}</div>
      </div>`,
    )
    .join("");
  return `<section>
    <h2 class="eyebrow">Recent Commits</h2>
    <div class="commit-scroll">${header}${rows}</div>
  </section>`;
}
