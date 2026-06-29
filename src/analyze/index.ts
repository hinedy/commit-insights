import type { Commit } from "../extract/types";
import { classifyCommits } from "./classify";
import type { ClassificationResult } from "./classify";
import { extractTickets } from "./tickets";
import type { TicketResult } from "./tickets";
import { buildTimeline } from "./timeline";
import type { TimelineBucket } from "./timeline";
import { parseReviewers } from "./reviewers";
import type { ReviewerStat } from "./reviewers";

export interface AnalysisResult {
  classification: ClassificationResult;
  tickets: TicketResult;
  timeline: TimelineBucket[];
  areas: Map<string, string>;
  areaCounts: Record<string, number>;
  reviewers: ReviewerStat[];
  totalCommits: number;
  totalAuthors: number;
}

export function analyzeCommits(
  commits: Commit[],
  config: { ticketPattern: RegExp },
  commitAreaMap: Map<string, string>,
): AnalysisResult {
  const classification = classifyCommits(commits);
  const tickets = extractTickets(commits, config.ticketPattern);
  const timeline = buildTimeline(commits);
  const reviewers = parseReviewers(commits);

  const areaCounts: Record<string, number> = {};
  for (const area of commitAreaMap.values()) {
    areaCounts[area] = (areaCounts[area] ?? 0) + 1;
  }

  return {
    classification,
    tickets,
    timeline,
    areas: commitAreaMap,
    areaCounts,
    reviewers,
    totalCommits: commits.length,
    totalAuthors: new Set(commits.map((c) => c.authorEmail)).size,
  };
}
