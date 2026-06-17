import { escapeHtml } from "../../escape";

export function renderTopTickets(
  tickets: Array<{ id: string; count: number }>,
): string {
  if (tickets.length === 0) return "";
  const rows = tickets
    .map(
      (t) =>
        `<tr><td class="ticket-id">${escapeHtml(t.id)}</td><td class="ticket-count">${t.count}</td></tr>`,
    )
    .join("");
  return `<section class="tickets-table"><h2 class="section-label">Top Tickets</h2><table><thead><tr><th>Ticket</th><th>Commits</th></tr></thead><tbody>${rows}</tbody></table></section>`;
}

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
  const rows = limited
    .map(
      (c) =>
        `<tr><td class="commit-hash"><code>${escapeHtml(c.hash.slice(0, 7))}</code></td><td class="commit-date">${escapeHtml(c.date)}</td><td class="commit-subject">${escapeHtml(c.subject)}</td><td><span class="type-badge type-${escapeHtml(c.type)}">${escapeHtml(c.type)}</span></td><td class="commit-area">${escapeHtml(c.area)}</td><td class="commit-tickets">${c.tickets.map((t) => escapeHtml(t)).join(", ")}</td></tr>`,
    )
    .join("");
  return `<section class="recent-commits"><h2 class="section-label">Recent Commits</h2><div class="table-scroll"><table><thead><tr><th>Hash</th><th>Date</th><th>Subject</th><th>Type</th><th>Area</th><th>Tickets</th></tr></thead><tbody>${rows}</tbody></table></div></section>`;
}
