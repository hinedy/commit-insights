import type { AnalysisResult } from "../analyze/index";
import type { Period } from "../types";
import type { StatsPayload, TicketSummary } from "./providers/types";
import type { Commit } from "../extract/types";

const STOPWORDS = new Set([
  "the", "a", "an", "and", "or", "for", "to", "in", "on", "of", "with",
  "this", "that", "from", "into",
  "fix", "feat", "chore", "refactor", "style", "test", "add", "update",
  "remove", "bump", "set", "use", "make",
  "change", "show", "handle", "apply", "create", "check",
  "send", "edit", "view", "step", "merge", "merged", "branch",
]);

const MINIMUM_COMMITS_WITHOUT_THEME = 5;

export function deriveThemeWords(subjects: string[]): string[] {
  const counts = new Map<string, number>();
  for (const subject of subjects) {
    const words = subject
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, " ")
      .split(/\s+/)
      .filter(
        (w) =>
          w.length >= 2 &&
          !STOPWORDS.has(w) &&
          !/^\d+$/.test(w) &&
          !/https?/.test(w),
      );
    for (const w of words) {
      counts.set(w, (counts.get(w) ?? 0) + 1);
    }
  }

  return [...counts.entries()]
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
    .slice(0, 4)
    .map(([word]) => word);
}

export function buildTicketSummaries(
  ticketGroups: Map<string, Commit[]>,
  topN = 8,
): TicketSummary[] {
  return [...ticketGroups.entries()]
    .sort((a, b) => b[1].length - a[1].length)
    .slice(0, topN)
    .map(([id, commits]) => ({
      id,
      commits: commits.length,
      themeWords: deriveThemeWords(commits.map((c) => c.subject)),
    }))
    .filter(
      (t) => t.themeWords.length > 0 || t.commits >= MINIMUM_COMMITS_WITHOUT_THEME,
    );
}

/**
 * Builds the AI stats payload from a completed analysis.
 * Precondition: analysis.totalCommits > 0 (empty-repo path is handled upstream).
 */
export function toStatsPayload(
  analysis: AnalysisResult,
  context: {
    repoName: string;
    period: Period;
    allSubjects: string[];
  },
): StatsPayload {
  return {
    repoName: context.repoName,
    totalCommits: analysis.totalCommits,
    dateRange: { from: context.period.start, to: context.period.end },
    totalAuthors: analysis.totalAuthors,
    monthlyTimeline: analysis.timeline,
    typeBreakdown: analysis.classification.counts,
    topTickets: buildTicketSummaries(analysis.tickets.groups, 8),
    ticketCommitCount: analysis.tickets.perCommit.filter(
      (t) => t.tickets.length > 0,
    ).length,
    topReviewers: analysis.reviewers.slice(0, 10),
    themeWords: deriveThemeWords(context.allSubjects),
  };
}
