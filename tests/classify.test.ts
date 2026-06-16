import { describe, it, expect } from "vitest";
import { classifyCommits } from "../src/analyze/classify";
import type { Commit } from "../src/extract/types";

function c(overrides: Partial<Commit> = {}): Commit {
  return { hash: "h", parents: [], authorName: "", authorEmail: "", date: "", subject: "", body: "", ...overrides };
}

describe("classifyCommits", () => {
  it("detects feat type from conventional commit subject", () => {
    const commits: Commit[] = [c({ hash: "abc123", subject: "feat: add login" })];

    const result = classifyCommits(commits);

    expect(result.perCommit).toHaveLength(1);
    expect(result.perCommit[0]).toEqual({ hash: "abc123", type: "feat" });
    expect(result.counts).toEqual({ feat: 1 });
  });

  it("detects fix type with scope", () => {
    const commits: Commit[] = [c({ subject: "fix(auth): handle token expiry" })];

    const result = classifyCommits(commits);

    expect(result.perCommit[0].type).toBe("fix");
  });

  it("detects breaking change with ! before colon", () => {
    const commits: Commit[] = [c({ subject: "feat!: drop IE11 support" })];

    const result = classifyCommits(commits);

    expect(result.perCommit[0].type).toBe("feat");
  });

  it("detects chore type", () => {
    const commits: Commit[] = [c({ subject: "chore: update deps" })];

    const result = classifyCommits(commits);

    expect(result.perCommit[0].type).toBe("chore");
  });

  it("detects merge via parents >= 2", () => {
    const commits: Commit[] = [c({ subject: "random msg", parents: ["a", "b"] })];

    const result = classifyCommits(commits);

    expect(result.perCommit[0].type).toBe("merge");
  });

  it("detects merge via subject when single parent", () => {
    const commits: Commit[] = [c({ subject: "Merge branch 'feature'" })];

    const result = classifyCommits(commits);

    expect(result.perCommit[0].type).toBe("merge");
  });

  it("classifies unmatched subject as other", () => {
    const commits: Commit[] = [c({ subject: "some random message" })];

    const result = classifyCommits(commits);

    expect(result.perCommit[0].type).toBe("other");
  });

  it("returns counts in sync with perCommit", () => {
    const commits: Commit[] = [
      c({ hash: "1", subject: "feat: add login" }),
      c({ hash: "2", subject: "fix: handle crash" }),
      c({ hash: "3", subject: "feat: add logout" }),
    ];

    const result = classifyCommits(commits);

    expect(result.perCommit).toHaveLength(3);
    expect(result.counts).toEqual({ feat: 2, fix: 1 });
  });
});
