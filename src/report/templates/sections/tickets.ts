import { escapeHtml } from "../../escape";

export function renderTickets(
  tickets: Array<{ id: string; count: number }>,
): string {
  if (tickets.length === 0) return "";
  const items = tickets
    .map(
      (t) =>
        `<li><span class="ticket-id">${escapeHtml(t.id)}</span><span class="ticket-count">${t.count}</span></li>`,
    )
    .join("");
  return `<section>
    <h2 class="eyebrow">Top Tickets</h2>
    <ul class="ticket-list">${items}</ul>
  </section>`;
}
