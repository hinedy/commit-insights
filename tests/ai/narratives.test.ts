import { describe, it, expect, vi } from "vitest";
import { generateNarrative } from "../../src/ai/narratives";
import type { AIProvider, StatsPayload } from "../../src/ai/providers/types";
import { AIError } from "../../src/ai/providers/types";

const stats: StatsPayload = {
  totalCommits: 42,
  dateRange: { from: "2025-01-01", to: "2025-06-01" },
  totalAuthors: 3,
  monthlyTimeline: [{ month: "2025-01", count: 10 }],
  typeBreakdown: { feat: 20, fix: 10, chore: 12 },
  topTickets: [{ id: "PROJ-123", count: 5 }],
  ticketSummary: "42 commits reference 3 tickets",
  topReviewers: [{ name: "Alice", collaborations: 8 }],
};

describe("generateNarrative", () => {
  it("returns text when provider succeeds", async () => {
    const provider: AIProvider = {
      generate: vi.fn().mockResolvedValue({ ok: true as const, value: { text: "narrative text" } }),
    };
    const result = await generateNarrative(provider, stats);
    expect(result).toBe("narrative text");
  });

  it("returns null when provider returns error", async () => {
    const provider: AIProvider = {
      generate: vi.fn().mockResolvedValue({ ok: false as const, error: new AIError("auth", "bad key") }),
    };
    const result = await generateNarrative(provider, stats);
    expect(result).toBeNull();
  });

  it("passes text through as-is (splitting is render-layer concern)", async () => {
    const multiParagraph = "First paragraph.\n\nSecond paragraph.\n\nThird paragraph.";
    const provider: AIProvider = {
      generate: vi.fn().mockResolvedValue({ ok: true as const, value: { text: multiParagraph } }),
    };
    const result = await generateNarrative(provider, stats);
    expect(result).toBe(multiParagraph);
  });

  it("returns null when dynamic import fails (SDK not installed)", async () => {
    const provider: AIProvider = {
      generate: vi.fn().mockResolvedValue({
        ok: false as const,
        error: new AIError("config", "Cannot find module '@anthropic-ai/sdk'. Try: npm install @anthropic-ai/sdk"),
      }),
    };
    const result = await generateNarrative(provider, stats);
    expect(result).toBeNull();
  });
});
