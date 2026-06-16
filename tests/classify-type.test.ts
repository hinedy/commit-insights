import { describe, it, expect } from "vitest";
import { COMMIT_TYPES, CONVENTIONAL_RE } from "../src/analyze/classify";

const STRUCTURAL_TYPES = new Set(["merge", "other"]);

describe("CONVENTIONAL_RE generation", () => {
  it("includes all conventional types in the regex source", () => {
    for (const type of COMMIT_TYPES) {
      if (STRUCTURAL_TYPES.has(type)) continue;
      // Each type should appear as a word boundary in the regex source
      expect(CONVENTIONAL_RE.source).toContain(type);
    }
  });

  it("excludes structural types from the regex source", () => {
    expect(CONVENTIONAL_RE.source).not.toContain("merge");
    expect(CONVENTIONAL_RE.source).not.toContain("other");
  });
});
