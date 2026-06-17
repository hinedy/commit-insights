import { describe, it, expect, beforeAll, afterAll, afterEach } from "vitest";
import { MockAgent, setGlobalDispatcher } from "undici";
import { AIError } from "../../src/ai/providers/types";
import { AnthropicProvider } from "../../src/ai/providers/anthropic";

const mockAgent = new MockAgent({ connections: 1 });
mockAgent.disableNetConnect();

beforeAll(() => {
  setGlobalDispatcher(mockAgent);
});

afterAll(() => {
  setGlobalDispatcher(mockAgent);
});

afterEach(() => {
  mockAgent.assertNoPendingInterceptors();
});

describe("AnthropicProvider", () => {
  it("throws AIError with kind config when apiKey is missing", () => {
    const fn = () => new AnthropicProvider({});
    expect(fn).toThrow(AIError);
    expect(fn).toThrow("apiKey");
    try { fn(); } catch (e) {
      expect((e as AIError).kind).toBe("config");
    }
  });

  it("returns auth error on 401", async () => {
    const provider = new AnthropicProvider({ apiKey: "sk-test" });
    const scope = mockAgent
      .get("https://api.anthropic.com")
      .intercept({
        path: "/v1/messages",
        method: "POST",
      })
      .reply(401, { error: { message: "Unauthorized" } })
      .times(1);

    const result = await provider.generate("write a summary");

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error).toBeInstanceOf(AIError);
      expect(result.error.kind).toBe("auth");
    }
  });

  it("returns rate_limit error on 429", async () => {
    const provider = new AnthropicProvider({ apiKey: "sk-test" });
    mockAgent
      .get("https://api.anthropic.com")
      .intercept({ path: "/v1/messages", method: "POST" })
      .reply(429, { error: { message: "Rate limit exceeded" } })
      .times(1);

    const result = await provider.generate("write a summary");

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.kind).toBe("rate_limit");
    }
  });

  it("returns text on success", async () => {
    const provider = new AnthropicProvider({ apiKey: "sk-test" });
    mockAgent
      .get("https://api.anthropic.com")
      .intercept({ path: "/v1/messages", method: "POST" })
      .reply(200, {
        id: "msg_123",
        type: "message",
        role: "assistant",
        content: [{ type: "text", text: "project summary here" }],
        model: "claude-sonnet-4-20250514",
        stop_reason: "end_turn",
        stop_sequence: null,
        usage: { input_tokens: 10, output_tokens: 5 },
      }, { headers: { "content-type": "application/json" } })
      .times(1);

    const result = await provider.generate("write a summary");

    if (!result.ok) {
      expect.fail(`expected ok, got error: ${result.error.message}`);
    }
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.text).toBe("project summary here");
    }
  });

  it("returns empty_response error when content is empty", async () => {
    const provider = new AnthropicProvider({ apiKey: "sk-test" });
    mockAgent
      .get("https://api.anthropic.com")
      .intercept({ path: "/v1/messages", method: "POST" })
      .reply(200, {
        id: "msg_456",
        type: "message",
        role: "assistant",
        content: [],
        model: "claude-sonnet-4-20250514",
        stop_reason: "end_turn",
        stop_sequence: null,
        usage: { input_tokens: 10, output_tokens: 0 },
      }, { headers: { "content-type": "application/json" } })
      .times(1);

    const result = await provider.generate("write a summary");

    if (result.ok) {
      expect.fail("expected error, got ok");
    }
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.kind).toBe("empty_response");
    }
  });
});
