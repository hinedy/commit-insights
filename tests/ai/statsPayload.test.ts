import { describe, it, expect } from "vitest";
import { deriveThemeWords, buildTicketSummaries, toStatsPayload } from "../../src/ai/statsPayload";
import type { AnalysisResult } from "../../src/analyze/index";
import type { Commit } from "../../src/extract/types";
import type { Period } from "../../src/types";

function c(overrides: Partial<Commit> = {}): Commit {
  return { hash: "h", parents: [], authorName: "", authorEmail: "", date: "", subject: "", body: "", ...overrides };
}

function buildResult(overrides: Partial<AnalysisResult> = {}): AnalysisResult {
  return {
    classification: { perCommit: [], counts: {} },
    tickets: { perCommit: [], counts: {}, groups: new Map() },
    timeline: [],
    areas: new Map(),
    areaCounts: {},
    reviewers: [],
    totalCommits: 0,
    totalAuthors: 0,
    ...overrides,
  };
}

describe("deriveThemeWords", () => {
  it("extracts most frequent meaningful words", () => {
    const subjects = [
      "feat: add variable binding to formula engine",
      "fix: formula operator precedence",
      "feat: expression testing panel",
    ];

    const result = deriveThemeWords(subjects);

    expect(result[0]).toBe("formula");
    expect(result).toContain("engine");
    expect(result).toContain("expression");
  });

  it("filters stopwords", () => {
    const subjects = ["fix: the with and in on"];

    const result = deriveThemeWords(subjects);

    expect(result).toEqual([]);
  });

  it("filters pure numeric tokens", () => {
    const subjects = ["MEDX-1057 fix formula engine"];

    const result = deriveThemeWords(subjects);

    expect(result).not.toContain("1057");
    expect(result).toContain("formula");
    expect(result).toContain("engine");
  });

  it("filters URL fragments", () => {
    const subjects = ["fix: handle 1057https timeout"];

    const result = deriveThemeWords(subjects);

    expect(result).not.toContain("1057https");
  });

  it("includes two-letter domain terms", () => {
    const subjects = [
      "feat: redesign ui components",
      "feat: polish ui layout",
      "refactor: api layer",
      "fix: db connection",
      "fix: db schema migration",
    ];

    const result = deriveThemeWords(subjects);

    expect(result).toContain("ui");
    expect(result).toContain("api");
    expect(result).toContain("db");
  });

  it("excludes single characters", () => {
    const subjects = ["feat: a b c widget"];

    const result = deriveThemeWords(subjects);

    expect(result).toEqual(["widget"]);
  });

  it("alphabetical tiebreak for equal frequencies", () => {
    const subjects = [
      "apple banana cherry",
      "banana cherry apple",
      "cherry apple banana",
    ];

    const result = deriveThemeWords(subjects);

    expect(result).toEqual(["apple", "banana", "cherry"]);
  });

  it("returns at most 4 words", () => {
    const subjects = [
      "alpha beta gamma delta epsilon",
      "alpha beta gamma delta epsilon",
      "alpha beta gamma delta epsilon",
    ];

    const result = deriveThemeWords(subjects);

    expect(result).toHaveLength(4);
  });

  it("handles empty subjects array", () => {
    const result = deriveThemeWords([]);

    expect(result).toEqual([]);
  });

  it("case insensitive", () => {
    const subjects = ["FormUla engine", "formula EnGinE"];

    const result = deriveThemeWords(subjects);

    expect(result).toContain("formula");
    expect(result).toContain("engine");
    expect(result.filter((w) => w === "formula")).toHaveLength(1);
  });
});

describe("buildTicketSummaries", () => {
  const MIN_COMMITS = 5;

  it("returns top N tickets sorted by commit count", () => {
    const groups = new Map<string, Commit[]>([
      ["TICKET-1", [c({ subject: "feat: widget" }), c({ subject: "feat: widget" })]],
      ["TICKET-2", [c({ subject: "fix: core" }), c({ subject: "fix: core" }), c({ subject: "fix: core" })]],
    ]);

    const result = buildTicketSummaries(groups, 5);

    expect(result).toHaveLength(2);
    expect(result[0].id).toBe("TICKET-2");
    expect(result[0].commits).toBe(3);
    expect(result[1].id).toBe("TICKET-1");
    expect(result[1].commits).toBe(2);
  });

  it("filters tickets with empty theme words below minimum threshold", () => {
    const groups = new Map<string, Commit[]>([
      ["TICKET-LOW", Array.from({ length: 2 }, () => c({ subject: "fix: the and with" }))],
      ["TICKET-HIGH", Array.from({ length: 10 }, () => c({ subject: "feat: formula engine" }))],
    ]);

    const result = buildTicketSummaries(groups, 5);

    expect(result.find((t) => t.id === "TICKET-LOW")).toBeUndefined();
    expect(result.find((t) => t.id === "TICKET-HIGH")?.themeWords).toContain("formula");
  });

  it("includes tickets with empty theme words at or above minimum threshold", () => {
    const subjects = Array.from({ length: 6 }, () => "chore: the and with");
    const commits = subjects.map((s) => c({ subject: s }));
    const groups = new Map<string, Commit[]>([["TICKET-BIG", commits]]);

    const result = buildTicketSummaries(groups, 5);

    expect(result).toHaveLength(1);
    expect(result[0].id).toBe("TICKET-BIG");
    expect(result[0].commits).toBe(6);
    expect(result[0].themeWords).toEqual([]);
  });

  it("returns empty array for empty input", () => {
    const groups = new Map<string, Commit[]>();

    const result = buildTicketSummaries(groups, 5);

    expect(result).toEqual([]);
  });

  it("handles mix of themed and unthemed tickets", () => {
    const groups = new Map<string, Commit[]>([
      ["THEME-1", Array.from({ length: 20 }, () => c({ subject: "feat: real work done" }))],
      ["NO-THEME", Array.from({ length: 7 }, () => c({ subject: "fix: the and" }))],
      ["LOW-NO-THEME", Array.from({ length: 3 }, () => c({ subject: "fix: the and" }))],
    ]);

    const result = buildTicketSummaries(groups, 5);

    expect(result.find((t) => t.id === "THEME-1")?.themeWords).toContain("real");
    expect(result.find((t) => t.id === "NO-THEME")).toBeDefined();
    expect(result.find((t) => t.id === "LOW-NO-THEME")).toBeUndefined();
  });
});

describe("toStatsPayload", () => {
  it("builds complete StatsPayload from AnalysisResult", () => {
    const period: Period = { start: "2026-01-01", end: "2026-06-01" };
    const analysis = buildResult({
      totalCommits: 100,
      totalAuthors: 5,
      classification: { perCommit: [], counts: { feat: 40, fix: 60 } },
      tickets: {
        perCommit: [{ hash: "a", tickets: ["MEDX-1"] }],
        counts: { "MEDX-1": 1 },
        groups: new Map([["MEDX-1", [c({ hash: "a", subject: "feat: formula engine" })]]]),
      },
      timeline: [{ month: "2026-01", count: 10 }],
      reviewers: [{ name: "Alice", collaborations: 5 }],
    });

    const result = toStatsPayload(analysis, {
      repoName: "commit-insights",
      period,
      allSubjects: [],
    });

    expect(result.repoName).toBe("commit-insights");
    expect(result.totalCommits).toBe(100);
    expect(result.totalAuthors).toBe(5);
    expect(result.dateRange.from).toBe("2026-01-01");
    expect(result.dateRange.to).toBe("2026-06-01");
    expect(result.typeBreakdown).toEqual({ feat: 40, fix: 60 });
    expect(result.themeWords).toEqual([]);
  });

  it("topTickets includes themeWords", () => {
    const period: Period = { start: "2026-01-01", end: "2026-06-01" };
    const analysis = buildResult({
      totalCommits: 10,
      totalAuthors: 1,
      tickets: {
        perCommit: [
          { hash: "a", tickets: ["MEDX-1"] },
          { hash: "b", tickets: ["MEDX-1"] },
        ],
        counts: { "MEDX-1": 2 },
        groups: new Map([["MEDX-1", [
          c({ hash: "a", subject: "feat: formula engine" }),
          c({ hash: "b", subject: "fix: engine binding" }),
        ]]]),
      },
    });

    const result = toStatsPayload(analysis, {
      repoName: "repo",
      period,
      allSubjects: [],
    });

    expect(result.topTickets).toHaveLength(1);
    expect(result.topTickets[0].id).toBe("MEDX-1");
    expect(result.topTickets[0].commits).toBe(2);
    expect(result.topTickets[0].themeWords).toContain("formula");
    expect(result.topTickets[0].themeWords).toContain("engine");
  });

  it("includes repo-level themeWords derived from all subjects", () => {
    const period: Period = { start: "2026-01-01", end: "2026-06-01" };
    const analysis = buildResult({ totalCommits: 10, totalAuthors: 1 });
    const subjects = [
      "feat(auth): add auth page",
      "fix(auth): fix auth bug",
      "feat(types): add types schema",
      "fix(types): fix types mapping",
      "fix(ui): fix ui layout",
      "feat(ui): add ui component",
    ];
    const result = toStatsPayload(analysis, {
      repoName: "repo",
      period,
      allSubjects: subjects,
    });
    expect(result.themeWords.length).toBeGreaterThan(0);
    expect(result.themeWords.length).toBeLessThanOrEqual(4);
    expect(result.themeWords).toContain("auth");
    expect(result.themeWords).toContain("types");
    expect(result.themeWords).toContain("ui");
  });
});
