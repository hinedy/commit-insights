import { describe, it, expect, beforeAll, afterAll, afterEach } from "vitest";
import { MockAgent, setGlobalDispatcher } from "undici";
import { AIError } from "../../src/ai/providers/types";
import { OpenAIProvider } from "../../src/ai/providers/openai";

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

describe("OpenAIProvider", () => {
  it("throws AIError with kind config when apiKey is missing", () => {
    const fn = () => new OpenAIProvider({});
    expect(fn).toThrow(AIError);
    expect(fn).toThrow("apiKey");
    try { fn(); } catch (e) {
      expect((e as AIError).kind).toBe("config");
    }
  });

  it("returns auth error on 401", async () => {
    const provider = new OpenAIProvider({ apiKey: "sk-test" });
    mockAgent
      .get("https://api.openai.com")
      .intercept({ path: "/v1/chat/completions", method: "POST" })
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
    const provider = new OpenAIProvider({ apiKey: "sk-test" });
    mockAgent
      .get("https://api.openai.com")
      .intercept({ path: "/v1/chat/completions", method: "POST" })
      .reply(429, { error: { message: "Rate limit" } })
      .times(1);

    const result = await provider.generate("write a summary");

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.kind).toBe("rate_limit");
    }
  });

  it("returns text on success", async () => {
    const provider = new OpenAIProvider({ apiKey: "sk-test" });
    mockAgent
      .get("https://api.openai.com")
      .intercept({ path: "/v1/chat/completions", method: "POST" })
      .reply(200, {
        id: "chatcmpl-123",
        object: "chat.completion",
        created: 1677652288,
        model: "gpt-4o",
        choices: [
          {
            index: 0,
            message: { role: "assistant", content: "project summary here" },
            finish_reason: "stop",
          },
        ],
        usage: { prompt_tokens: 9, completion_tokens: 12, total_tokens: 21 },
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
    const provider = new OpenAIProvider({ apiKey: "sk-test" });
    mockAgent
      .get("https://api.openai.com")
      .intercept({ path: "/v1/chat/completions", method: "POST" })
      .reply(200, {
        id: "chatcmpl-456",
        object: "chat.completion",
        created: 1677652288,
        model: "gpt-4o",
        choices: [
          {
            index: 0,
            message: { role: "assistant", content: "" },
            finish_reason: "stop",
          },
        ],
        usage: { prompt_tokens: 9, completion_tokens: 0, total_tokens: 9 },
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
