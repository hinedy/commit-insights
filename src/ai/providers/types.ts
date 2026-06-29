export type AIErrorKind = "config" | "auth" | "network" | "rate_limit" | "server" | "empty_response" | "unknown";

export class AIError extends Error {
  kind: AIErrorKind;
  constructor(kind: AIErrorKind, message: string) {
    super(message);
    this.kind = kind;
  }
}

export type Result<T, E> = { ok: true; value: T } | { ok: false; error: E };

export interface AIProvider {
  generate(prompt: string): Promise<Result<{ text: string }, AIError>>;
}

export interface TicketSummary {
  id: string;
  commits: number;
  themeWords: string[];
}

export interface StatsPayload {
  repoName: string;
  totalCommits: number;
  dateRange: { from: string; to: string };
  totalAuthors: number;
  monthlyTimeline: { month: string; count: number }[];
  typeBreakdown: Record<string, number>;
  topTickets: TicketSummary[];
  ticketCommitCount: number;
  topReviewers: { name: string; collaborations: number }[];
  themeWords: string[];
}

