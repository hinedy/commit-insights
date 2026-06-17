import { describe, it, expect } from "vitest";
import { buildPrompt } from "../../src/ai/prompts";
import type { StatsPayload } from "../../src/ai/providers/types";

const stats: StatsPayload = {
  totalCommits: 42,
  dateRange: { from: "2025-01-01", to: "2025-06-01" },
  totalAuthors: 3,
  monthlyTimeline: [
    { month: "2025-01", count: 10 },
    { month: "2025-02", count: 15 },
  ],
  typeBreakdown: { feat: 20, fix: 10, chore: 12 },
  topTickets: [{ id: "PROJ-123", count: 5 }],
  ticketSummary: "42 commits reference 3 tickets",
  topReviewers: [{ name: "Alice", collaborations: 8 }],
};

describe("buildPrompt", () => {
  it("does not contain raw commit hashes, subjects, or file paths", () => {
    const prompt = buildPrompt(stats);
    expect(prompt).not.toMatch(/[a-f0-9]{40,}/i);
    expect(prompt).not.toMatch(/^(?:feat|fix|chore|docs|refactor|test|style|perf|ci|build|revert)(?:\(.+\))?: /m);
    expect(prompt).not.toMatch(/\w+\.(?:ts|js|tsx|jsx)\b/);
  });

  it("resume variant differs from manager variant", () => {
    const resume = buildPrompt(stats, { audience: "resume" });
    const manager = buildPrompt(stats, { audience: "manager" });
    expect(resume).not.toBe(manager);
    expect(resume.toLowerCase()).toContain("resume");
    expect(manager.toLowerCase()).toContain("manager");
  });
});
