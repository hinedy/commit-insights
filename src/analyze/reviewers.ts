import type { Commit } from "../extract/types";

export interface ReviewerStat {
  name: string;
  collaborations: number;
}

const TRAILER_RE = /^(Co-authored-by|Approved-by|Reviewed-by):\s*(.+)$/gm;

function parseTrailer(value: string): { name: string; email?: string } | null {
  const withEmail = value.match(/^(.+?)\s*<([^>]*)>\s*$/);
  if (withEmail) {
    const name = withEmail[1].trim();
    const email = withEmail[2].trim();
    return { name, email: email.includes("@") ? email : undefined };
  }
  const name = value.trim();
  return name.length > 0 ? { name } : null;
}

function getTrailerBlock(body: string): string {
  const idx = body.lastIndexOf("\n\n");
  return idx >= 0 ? body.slice(idx + 2) : body;
}

interface ReviewerKey {
  key: string;
  displayName: string;
}

export function parseReviewers(commits: Commit[]): ReviewerStat[] {
  const dedup = new Map<string, ReviewerKey & { count: number }>();

  for (const c of commits) {
    const trailerBlock = getTrailerBlock(c.body);
    const matches = [...trailerBlock.matchAll(TRAILER_RE)];

    for (const match of matches) {
      const parsed = parseTrailer(match[2]);
      if (!parsed) continue;

      const key = parsed.email ? parsed.email.toLowerCase() : parsed.name.toLowerCase();
      const existing = dedup.get(key);
      if (existing) {
        existing.count++;
      } else {
        dedup.set(key, { key, displayName: parsed.name, count: 1 });
      }
    }
  }

  return [...dedup.values()]
    .map((d) => ({ name: d.displayName, collaborations: d.count }))
    .sort((a, b) => b.collaborations - a.collaborations);
}
