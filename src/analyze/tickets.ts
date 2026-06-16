import type { Commit } from "../extract/types";

export interface TicketResult {
  perCommit: Array<{ hash: string; tickets: string[] }>;
  counts: Record<string, number>;
}

export function extractTickets(commits: Commit[], pattern: RegExp): TicketResult {
  const perCommit: TicketResult["perCommit"] = [];
  const counts: Record<string, number> = {};

  for (const c of commits) {
    const text = `${c.subject}\n${c.body}`;
    const matches = [...text.matchAll(pattern)].map((m) => m[0]);
    const unique = [...new Set(matches)];
    perCommit.push({ hash: c.hash, tickets: unique });
    for (const t of unique) {
      counts[t] = (counts[t] ?? 0) + 1;
    }
  }

  return { perCommit, counts };
}
