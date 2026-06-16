import { describe, it, expect } from "vitest";
import { parseReviewers } from "../src/analyze/reviewers";
import type { Commit } from "../src/extract/types";

function c(overrides: Partial<Commit> = {}): Commit {
  return { hash: "h", parents: [], authorName: "", authorEmail: "", date: "", subject: "", body: "", ...overrides };
}

describe("parseReviewers", () => {
  it("parses single Co-authored-by trailer", () => {
    const commits: Commit[] = [c({ body: "Co-authored-by: Alice <alice@x.com>" })];

    const result = parseReviewers(commits);

    expect(result).toEqual([{ name: "Alice", collaborations: 1 }]);
  });

  it("parses multiple trailers from one commit", () => {
    const commits: Commit[] = [c({
      body: "Co-authored-by: Alice <alice@x.com>\nApproved-by: Bob <bob@x.com>",
    })];

    const result = parseReviewers(commits);

    expect(result).toHaveLength(2);
  });

  it("returns empty array when body has no trailers", () => {
    const commits: Commit[] = [c({ body: "just a fix" })];

    const result = parseReviewers(commits);

    expect(result).toEqual([]);
  });

  it("sorts descending by collaboration count", () => {
    const commits: Commit[] = [
      c({ hash: "a", body: "Co-authored-by: Alice <alice@x.com>" }),
      c({ hash: "b", body: "Co-authored-by: Alice <alice@x.com>" }),
      c({ hash: "c", body: "Co-authored-by: Alice <alice@x.com>" }),
      c({ hash: "d", body: "Co-authored-by: Bob <bob@x.com>" }),
    ];

    const result = parseReviewers(commits);

    expect(result).toEqual([
      { name: "Alice", collaborations: 3 },
      { name: "Bob", collaborations: 1 },
    ]);
  });

  it("merges same email across multiple commits", () => {
    const commits: Commit[] = [
      c({ body: "Co-authored-by: Alice <alice@x.com>" }),
      c({ body: "Co-authored-by: A. Lee <alice@x.com>" }),
    ];

    const result = parseReviewers(commits);

    // Same email → merged, first display name wins
    expect(result).toEqual([{ name: "Alice", collaborations: 2 }]);
  });

  it("treats same name with different emails as separate", () => {
    const commits: Commit[] = [
      c({ body: "Co-authored-by: Alice <alice@corp.com>" }),
      c({ body: "Co-authored-by: Alice <alice@gmail.com>" }),
    ];

    const result = parseReviewers(commits);

    expect(result).toHaveLength(2);
    expect(result.every((r) => r.collaborations === 1)).toBe(true);
  });

  it("parses Reviewed-by trailer", () => {
    const commits: Commit[] = [c({ body: "Reviewed-by: Carol <carol@x.com>" })];

    const result = parseReviewers(commits);

    expect(result).toEqual([{ name: "Carol", collaborations: 1 }]);
  });

  it("ignores trailers in quoted/reverted text (not in trailer block)", () => {
    const commits: Commit[] = [c({
      body: "Reverts previous change.\n\nThis reverts abc123 which had:\nCo-authored-by: Alice <alice@x.com>\n\nReviewed-by: Bob <bob@x.com>",
    })];

    // The last \n\n is before "Reviewed-by"
    // Trailer block: "Reviewed-by: Bob <bob@x.com>"
    // "Co-authored-by: Alice" is in a prior paragraph → excluded
    const result = parseReviewers(commits);

    expect(result).toEqual([{ name: "Bob", collaborations: 1 }]);
  });

  it("parses no-email trailer (no angle brackets)", () => {
    const commits: Commit[] = [c({ body: "Co-authored-by: Alice" })];

    const result = parseReviewers(commits);

    expect(result).toEqual([{ name: "Alice", collaborations: 1 }]);
  });

  it("treats empty angle brackets as no email", () => {
    const commits: Commit[] = [c({ body: "Co-authored-by: Alice <>" })];

    const result = parseReviewers(commits);

    expect(result).toEqual([{ name: "Alice", collaborations: 1 }]);
  });
});
