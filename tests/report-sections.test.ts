import { describe, it, expect } from "vitest";
import { renderHeader } from "../src/report/templates/sections/header";
import { renderMetricCards } from "../src/report/templates/sections/metricCards";
import { renderFooter } from "../src/report/templates/sections/footer";
import { renderNarrativeBlock } from "../src/report/templates/sections/narrative";
import { renderEmptyState } from "../src/report/templates/sections/emptyState";
import { renderChartContainers } from "../src/report/templates/sections/charts";
import {
  renderTopTickets,
  renderRecentCommits,
} from "../src/report/templates/sections/tables";

describe("renderHeader", () => {
  it("returns header with repo name and period", () => {
    const html = renderHeader("my-repo", { start: "2026-01", end: "2026-06" });
    expect(html).toContain("my-repo");
    expect(html).toContain("2026-01");
    expect(html).toContain("2026-06");
    expect(html).toMatch(/<header/i);
  });
});

describe("renderMetricCards", () => {
  it("returns 3 cards with correct values, HTML-escaped", () => {
    const html = renderMetricCards({ commits: 100, tickets: 5, authors: 3 });
    expect(html).toContain("100");
    expect(html).toContain("5");
    expect(html).toContain("3");
    const cards = html.match(/<div class="metric-card"/g);
    expect(cards).toHaveLength(3);
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
  it("returns card HTML when text is provided", () => {
    const html = renderNarrativeBlock("Some narrative text.");
    expect(html).toContain("Some narrative text.");
    expect(html).toMatch(/<div/i);
  });

  it("returns empty string when undefined", () => {
    expect(renderNarrativeBlock(undefined)).toBe("");
  });
});

describe("renderEmptyState", () => {
  it("returns centered placeholder with message", () => {
    const html = renderEmptyState("No commits found");
    expect(html).toContain("No commits found");
    expect(html).toMatch(/<div/i);
  });
});

describe("renderChartContainers", () => {
  it("returns canvas wrappers with expected DOM IDs", () => {
    const html = renderChartContainers();
    expect(html).toContain("chart-monthly");
    expect(html).toContain("chart-types");
    expect(html).toContain("chart-areas");
  });
});

describe("renderTopTickets", () => {
  it("renders top tickets table rows", () => {
    const html = renderTopTickets([
      { id: "PROJ-123", count: 5 },
      { id: "PROJ-456", count: 3 },
    ]);
    expect(html).toContain("PROJ-123");
    expect(html).toContain("5");
    expect(html).toContain("PROJ-456");
  });

  it("handles empty array", () => {
    expect(renderTopTickets([])).toBe("");
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
    const dataRows = html.match(/<tr><td/g);
    expect(dataRows).toHaveLength(200);
  });

  it("includes type badge pills", () => {
    const commits = [makeCommit(1)];
    const html = renderRecentCommits(commits);
    expect(html).toContain("feat");
  });
});
