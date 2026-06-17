import { describe, it, expect, beforeAll, afterAll, afterEach } from "vitest";
import { MockAgent, setGlobalDispatcher } from "undici";
import { AIError } from "../../src/ai/providers/types";
import { GeminiProvider } from "../../src/ai/providers/gemini";

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

describe("GeminiProvider", () => {
  it("throws AIError with kind config when apiKey is missing", () => {
    const fn = () => new GeminiProvider({});
    expect(fn).toThrow(AIError);
    expect(fn).toThrow("apiKey");
    try { fn(); } catch (e) {
      expect((e as AIError).kind).toBe("config");
    }
  });

  it("returns auth error on 401", async () => {
    const provider = new GeminiProvider({ apiKey: "test-key" });
    mockAgent
      .get("https://generativelanguage.googleapis.com")
      .intercept({ path: "/v1beta/models/gemini-2.0-flash:generateContent", method: "POST" })
      .reply(401, { error: { message: "API key not valid" } })
      .times(1);

    const result = await provider.generate("write a summary");

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error).toBeInstanceOf(AIError);
      expect(result.error.kind).toBe("auth");
    }
  });

  it("returns rate_limit error on 429", async () => {
    const provider = new GeminiProvider({ apiKey: "test-key" });
    mockAgent
      .get("https://generativelanguage.googleapis.com")
      .intercept({ path: "/v1beta/models/gemini-2.0-flash:generateContent", method: "POST" })
      .reply(429, { error: { message: "Rate limit exceeded" } })
      .times(1);

    const result = await provider.generate("write a summary");

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.kind).toBe("rate_limit");
    }
  });

  it("returns text on success", async () => {
    const provider = new GeminiProvider({ apiKey: "test-key" });
    mockAgent
      .get("https://generativelanguage.googleapis.com")
      .intercept({ path: "/v1beta/models/gemini-2.0-flash:generateContent", method: "POST" })
      .reply(200, {
        candidates: [{ content: { parts: [{ text: "project summary here" }] } }],
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
    const provider = new GeminiProvider({ apiKey: "test-key" });
    mockAgent
      .get("https://generativelanguage.googleapis.com")
      .intercept({ path: "/v1beta/models/gemini-2.0-flash:generateContent", method: "POST" })
      .reply(200, {
        candidates: [{ content: { parts: [] } }],
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
