import { describe, it, expect } from "vitest";
import { renderHeader } from "../src/report/templates/sections/header";
import { renderStatsBar } from "../src/report/templates/sections/statsBar";
import { renderFooter } from "../src/report/templates/sections/footer";
import { renderNarrativeBlock } from "../src/report/templates/sections/narrative";
import { renderMonthlyChart, renderTypeBars, renderAreaBars } from "../src/report/templates/sections/charts";
import { renderTickets } from "../src/report/templates/sections/tickets";
import { renderReviewers } from "../src/report/templates/sections/reviewers";
import { renderRecentCommits } from "../src/report/templates/sections/tables";

describe("renderHeader", () => {
  it("returns header with hero number, repo name and period", () => {
    const html = renderHeader("my-repo", { start: "2026-01", end: "2026-06" }, "2026-06-17T20:00:00.000Z", { commits: 42 });
    expect(html).toContain("42");
    expect(html).toContain("my-repo");
    expect(html).toContain("2026-01");
    expect(html).toContain("2026-06");
    expect(html).toMatch(/<header/i);
  });
});

describe("renderStatsBar", () => {
  it("returns inline stats with values", () => {
    const html = renderStatsBar({ commits: 100, tickets: 5, authors: 3 });
    expect(html).toContain("100");
    expect(html).toContain("5");
    expect(html).toContain("3");
    expect(html).toContain("commits");
    expect(html).toContain("authors");
    expect(html).toContain("tickets");
  });

  it("omits tickets when zero", () => {
    const html = renderStatsBar({ commits: 10, tickets: 0, authors: 2 });
    expect(html).toContain("10");
    expect(html).not.toContain("tickets");
  });
});

describe("renderFooter", () => {
  it("returns footer with version, date, and privacy badge", () => {
    const html = renderFooter("0.2.0", "2026-06-17T12:00:00.000Z");
    expect(html).toContain("0.2.0");
    expect(html).toContain("2026-06-17");
    expect(html).toContain("local");
    expect(html).toMatch(/<footer/i);
  });
});

describe("renderNarrativeBlock", () => {
  it("returns section HTML when text is provided", () => {
    const html = renderNarrativeBlock("Some narrative text.");
    expect(html).toContain("Some narrative text.");
    expect(html).toMatch(/<section/i);
  });

  it("returns empty string when undefined", () => {
    expect(renderNarrativeBlock(undefined)).toBe("");
  });
});

describe("renderMonthlyChart", () => {
  it("returns canvas with monthly chart ID", () => {
    const html = renderMonthlyChart();
    expect(html).toContain("chart-monthly");
    expect(html).toContain("canvas");
  });
});

describe("renderTypeBars", () => {
  it("returns bars for non-zero types", () => {
    const html = renderTypeBars({ feat: 5, fix: 3, other: 1 });
    expect(html).toContain("feat");
    expect(html).toContain("fix");
    expect(html).toContain("5");
    expect(html).toContain("3");
    expect(html).not.toContain("docs");
  });
});

describe("renderAreaBars", () => {
  it("returns bars for area counts", () => {
    const html = renderAreaBars([{ area: "Source", count: 10 }, { area: "Tests", count: 5 }]);
    expect(html).toContain("Source");
    expect(html).toContain("Tests");
    expect(html).toContain("10");
  });

  it("returns empty string for empty array", () => {
    expect(renderAreaBars([])).toBe("");
  });
});

describe("renderTickets", () => {
  it("renders ticket list items", () => {
    const html = renderTickets([
      { id: "PROJ-123", count: 5 },
      { id: "PROJ-456", count: 3 },
    ]);
    expect(html).toContain("PROJ-123");
    expect(html).toContain("5");
    expect(html).toContain("PROJ-456");
  });

  it("handles empty array", () => {
    expect(renderTickets([])).toBe("");
  });
});

describe("renderReviewers", () => {
  it("renders reviewer list items", () => {
    const html = renderReviewers([
      { name: "Alice", collaborations: 5 },
      { name: "Bob", collaborations: 3 },
    ]);
    expect(html).toContain("Alice");
    expect(html).toContain("5");
    expect(html).toContain("Bob");
  });

  it("handles empty array", () => {
    expect(renderReviewers([])).toBe("");
  });
});

describe("renderRecentCommits", () => {
  const makeCommit = (i: number) => ({
    hash: `abc${String(i).padStart(3, "0")}`,
    date: "2026-06-01",
    subject: `commit ${i}`,
    type: "feat",
    area: "Source",
    tickets: [] as string[],
  });

  it("caps at 200 rows", () => {
    const commits = Array.from({ length: 201 }, (_, i) => makeCommit(i));
    const html = renderRecentCommits(commits);
    const dataRows = html.match(/class="commit-row"/g);
    expect(dataRows).toHaveLength(200);
  });

  it("includes type badge pills", () => {
    const commits = [makeCommit(1)];
    const html = renderRecentCommits(commits);
    expect(html).toContain("feat");
  });
});
