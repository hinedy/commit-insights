import { describe, it, expect } from "vitest";
import { AIError } from "../../src/ai/providers/types";

describe("AIError", () => {
  it("is instance of Error with kind and message", () => {
    const err = new AIError("auth", "bad key");
    expect(err).toBeInstanceOf(Error);
    expect(err.kind).toBe("auth");
    expect(err.message).toBe("bad key");
  });
});
