import { describe, it, expect } from "vitest";
import { analyzeCommits } from "../src/analyze/index";
import type { Commit } from "../src/extract/types";

function c(overrides: Partial<Commit> = {}): Commit {
  return { hash: "h", parents: [], authorName: "", authorEmail: "", date: "", subject: "", body: "", ...overrides };
}

describe("analyzeCommits", () => {
  it("returns complete AnalysisResult for empty input", () => {
    const result = analyzeCommits([], { ticketPattern: /[A-Z]+\d+/g }, new Map());

    expect(result.classification).toBeDefined();
    expect(result.tickets).toBeDefined();
    expect(result.timeline).toEqual([]);
    expect(result.areas).toBeInstanceOf(Map);
    expect(result.areaCounts).toEqual({});
    expect(result.reviewers).toEqual([]);
  });

  it("derives areaCounts from areaMap", () => {
    const areaMap = new Map<string, string>([
      ["hash1", "Backend"],
      ["hash2", "Backend"],
      ["hash3", "Frontend"],
    ]);
    const commits: Commit[] = [
      c({ hash: "hash1", subject: "fix: backend" }),
      c({ hash: "hash2", subject: "feat: backend" }),
      c({ hash: "hash3", subject: "feat: frontend" }),
    ];

    const result = analyzeCommits(commits, { ticketPattern: /[A-Z]+\d+/g }, areaMap);

    expect(result.areaCounts).toEqual({ Backend: 2, Frontend: 1 });
  });
});
