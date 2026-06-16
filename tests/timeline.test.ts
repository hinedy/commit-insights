import { describe, it, expect } from "vitest";
import { buildTimeline } from "../src/analyze/timeline";
import type { Commit } from "../src/extract/types";

function c(date: string): Commit {
  return { hash: "h", parents: [], authorName: "", authorEmail: "", date, subject: "", body: "" };
}

describe("buildTimeline", () => {
  it("groups commits into single month bucket", () => {
    const commits: Commit[] = [c("2026-06-01"), c("2026-06-15")];

    const result = buildTimeline(commits);

    expect(result).toEqual([{ month: "2026-06", count: 2 }]);
  });

  it("creates buckets for multiple months", () => {
    const commits: Commit[] = [c("2026-06-01"), c("2026-07-10")];

    const result = buildTimeline(commits);

    expect(result).toEqual([
      { month: "2026-06", count: 1 },
      { month: "2026-07", count: 1 },
    ]);
  });

  it("returns empty array for empty input", () => {
    expect(buildTimeline([])).toEqual([]);
  });

  it("sorts ascending regardless of input order", () => {
    const commits: Commit[] = [c("2026-07-01"), c("2026-06-01")];

    const result = buildTimeline(commits);

    expect(result).toEqual([
      { month: "2026-06", count: 1 },
      { month: "2026-07", count: 1 },
    ]);
  });

  it("fills gaps with zero-count months", () => {
    const commits: Commit[] = [c("2026-01-15"), c("2026-03-10")];

    const result = buildTimeline(commits);

    expect(result).toEqual([
      { month: "2026-01", count: 1 },
      { month: "2026-02", count: 0 },
      { month: "2026-03", count: 1 },
    ]);
  });
});
