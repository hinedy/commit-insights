import type { Commit } from "../extract/types";

export interface TimelineBucket {
  month: string;
  count: number;
}

function nextMonth(ym: string): string {
  const [y, m] = ym.split("-").map(Number);
  return m === 12
    ? `${y + 1}-01`
    : `${y}-${String(m + 1).padStart(2, "0")}`;
}

export function buildTimeline(commits: Commit[]): TimelineBucket[] {
  if (commits.length === 0) return [];

  const sorted = [...commits].sort((a, b) => a.date.localeCompare(b.date));

  const counts = new Map<string, number>();
  for (const c of sorted) {
    const month = c.date.slice(0, 7);
    counts.set(month, (counts.get(month) ?? 0) + 1);
  }

  const first = sorted[0].date.slice(0, 7);
  const last = sorted[sorted.length - 1].date.slice(0, 7);
  const result: TimelineBucket[] = [];
  let cursor = first;
  while (cursor <= last) {
    result.push({ month: cursor, count: counts.get(cursor) ?? 0 });
    cursor = nextMonth(cursor);
  }

  return result;
}
