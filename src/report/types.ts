export interface DashboardData {
  repoName: string;
  period: { start: string; end: string };
  totals: { commits: number; tickets: number; authors: number };
  timeline: Array<{ month: string; count: number }>;
  typeCounts: Record<string, number>;
  areaCounts: Array<{ area: string; count: number }>;
  topTickets: Array<{ id: string; count: number }>;
  recentCommits: Array<{
    hash: string;
    date: string;
    subject: string;
    type: string;
    area: string;
    tickets: string[];
  }>;
  narrative?: string;
}
