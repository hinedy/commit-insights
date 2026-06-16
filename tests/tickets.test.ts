import { describe, it, expect } from "vitest";
import { extractTickets } from "../src/analyze/tickets";
import type { Commit } from "../src/extract/types";

function c(overrides: Partial<Commit> = {}): Commit {
  return { hash: "h", parents: [], authorName: "", authorEmail: "", date: "", subject: "", body: "", ...overrides };
}

const DEFAULT_PATTERN = /[A-Z][A-Z0-9]*-\d+/g;

describe("extractTickets", () => {
  it("extracts single ticket from subject", () => {
    const commits: Commit[] = [c({ hash: "abc", subject: "MEDX-123 fix login" })];

    const result = extractTickets(commits, DEFAULT_PATTERN);

    expect(result.perCommit).toHaveLength(1);
    expect(result.perCommit[0]).toEqual({ hash: "abc", tickets: ["MEDX-123"] });
    expect(result.counts).toEqual({ "MEDX-123": 1 });
  });

  it("extracts multiple tickets from body", () => {
    const commits: Commit[] = [c({ subject: "fix stuff", body: "Refs MEDX-123, MEDX-456" })];

    const result = extractTickets(commits, DEFAULT_PATTERN);

    expect(result.perCommit[0].tickets).toEqual(["MEDX-123", "MEDX-456"]);
  });

  it("returns empty tickets array when no match", () => {
    const commits: Commit[] = [c({ subject: "fix stuff" })];

    const result = extractTickets(commits, DEFAULT_PATTERN);

    expect(result.perCommit[0].tickets).toEqual([]);
  });

  it("derives counts correctly across multiple commits", () => {
    const commits: Commit[] = [
      c({ hash: "a", subject: "MEDX-123 fix" }),
      c({ hash: "b", subject: "MEDX-123 refactor" }),
      c({ hash: "c", subject: "MEDX-456 add" }),
    ];

    const result = extractTickets(commits, DEFAULT_PATTERN);

    expect(result.counts).toEqual({ "MEDX-123": 2, "MEDX-456": 1 });
  });

  it("uses custom pattern", () => {
    const commits: Commit[] = [c({ subject: "GH-1 implemented, MEDX-1 ignored" })];

    const result = extractTickets(commits, /GH-\d+/g);

    expect(result.perCommit[0].tickets).toEqual(["GH-1"]);
  });

  it("deduplicates within a single commit", () => {
    const commits: Commit[] = [c({ body: "Refs MEDX-123, see also MEDX-123" })];

    const result = extractTickets(commits, DEFAULT_PATTERN);

    expect(result.perCommit[0].tickets).toEqual(["MEDX-123"]);
  });
});
