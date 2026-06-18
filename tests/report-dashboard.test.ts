import { describe, it, expect } from "vitest";
import { buildDashboardData } from "../src/report/dashboard.html";
import { assembleDashboard } from "../src/report/dashboard.html";
import { renderDashboard } from "../src/report/render";
import type { AnalysisResult } from "../src/analyze";
import type { Commit } from "../src/extract/types";
import { readFileSync, existsSync, unlinkSync, mkdtempSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";

const makeCommit = (hash: string, date: string, email: string, subject = "test"): Commit => ({
  hash,
  parents: [],
  authorName: "Test",
  authorEmail: email,
  date,
  subject,
  body: "",
});

const makeAnalysis = (): AnalysisResult => ({
  classification: {
    perCommit: [{ hash: "abc123", type: "feat" }],
    counts: { feat: 1, fix: 0, chore: 0, docs: 0, refactor: 0, test: 0, style: 0, perf: 0, ci: 0, build: 0, revert: 0, merge: 0, other: 0 },
  },
  tickets: {
    perCommit: [{ hash: "abc123", tickets: ["PROJ-1"] }],
    counts: { "PROJ-1": 1 },
  },
  timeline: [{ month: "2026-06", count: 1 }],
  areas: new Map([["abc123", "Source"]]),
  areaCounts: { Source: 1 },
  reviewers: [],
});

describe("buildDashboardData", () => {
  it("shapes analysis into display-ready DashboardData with sorted top-N", () => {
    const commits = [makeCommit("abc123", "2026-06-15", "a@test.com")];
    const analysis = makeAnalysis();
    const data = buildDashboardData(analysis, commits, "test-repo");

    expect(data.repoName).toBe("test-repo");
    expect(data.period).toEqual({ start: "2026-06", end: "2026-06" });
    expect(data.totals).toEqual({ commits: 1, tickets: 1, authors: 1 });
    expect(data.timeline).toHaveLength(1);
    expect(data.typeCounts.feat).toBe(1);
    expect(data.areaCounts).toHaveLength(1);
    expect(data.topTickets).toHaveLength(1);
    expect(data.reviewers).toEqual([]);
    expect(data.recentCommits).toHaveLength(1);
    expect(data.narrative).toBeUndefined();
  });

  it("includes narrative when provided", () => {
    const data = buildDashboardData(makeAnalysis(), [makeCommit("abc123", "2026-06-15", "a@test.com")], "test-repo", "Some AI text");
    expect(data.narrative).toBe("Some AI text");
  });
});

describe("assembleDashboard", () => {
  it("returns full HTML document with all sections", () => {
    const html = assembleDashboard(
      "<header>test</header>",
      "<div>stats</div>",
      "",
      "<section>monthly</section>",
      "<section>types</section>",
      "",
      "",
      "<section>commits</section>",
      "<footer>footer</footer>",
      "// mock chart.js",
      "",
    );

    expect(html).toContain("<!DOCTYPE html>");
    expect(html).toContain("mock chart.js");
    expect(html).toContain("<header>test</header>");
    expect(html).toContain("<div>stats</div>");
    expect(html).toContain("<section>monthly</section>");
    expect(html).toContain("<section>types</section>");
    expect(html).toContain("<section>commits</section>");
    expect(html).toContain("<footer>footer</footer>");
    expect(html).toContain("</html>");
  });
});

describe("renderDashboard", () => {
  it("writes HTML file at outputPath", () => {
    const tmpDir = mkdtempSync(join(tmpdir(), "render-test-"));
    const outPath = join(tmpDir, "out.html");

    const data = buildDashboardData(makeAnalysis(), [makeCommit("abc123", "2026-06-15", "a@test.com")], "test-repo");
    renderDashboard({ outputPath: outPath, data, chartJs: "// chart.js" });

    expect(existsSync(outPath)).toBe(true);
    const content = readFileSync(outPath, "utf-8");
    expect(content).toContain("<!DOCTYPE html>");
    expect(content).toContain("chart.js");

    unlinkSync(outPath);
  });

  it("writes dashboard even with zero commits", () => {
    const tmpDir = mkdtempSync(join(tmpdir(), "render-empty-"));
    const outPath = join(tmpDir, "empty.html");

    renderDashboard({
      outputPath: outPath,
      data: {
        repoName: "test",
        period: { start: "", end: "" },
        totals: { commits: 0, tickets: 0, authors: 0 },
        timeline: [],
        typeCounts: {},
        areaCounts: [],
        topTickets: [],
        reviewers: [],
        recentCommits: [],
      },
      chartJs: "// chart.js",
    });

    expect(existsSync(outPath)).toBe(true);
    const content = readFileSync(outPath, "utf-8");
    expect(content).toContain("<!DOCTYPE html>");
    expect(content).toContain("chart.js");

    unlinkSync(outPath);
  });
});
