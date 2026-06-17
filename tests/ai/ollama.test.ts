import { describe, it, expect, beforeAll, afterAll, afterEach } from "vitest";
import { MockAgent, setGlobalDispatcher } from "undici";
import { OllamaProvider } from "../../src/ai/providers/ollama";

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

describe("OllamaProvider", () => {
  it("returns error mentioning 'is Ollama running?' on connection refused", async () => {
    const provider = new OllamaProvider({});
    mockAgent
      .get("http://localhost:11434")
      .intercept({ path: "/api/generate", method: "POST" })
      .replyWithError(new Error("connect ECONNREFUSED"))
      .times(1);

    const result = await provider.generate("write a summary");

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.message.toLowerCase()).toContain("ollama running");
    }
  });

  it("returns error mentioning 'try ollama pull' on 404", async () => {
    const provider = new OllamaProvider({});
    mockAgent
      .get("http://localhost:11434")
      .intercept({ path: "/api/generate", method: "POST" })
      .reply(404, { error: "model not found" })
      .times(1);

    const result = await provider.generate("write a summary");

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.message.toLowerCase()).toContain("ollama pull");
    }
  });

  it("returns text on success", async () => {
    const provider = new OllamaProvider({});
    mockAgent
      .get("http://localhost:11434")
      .intercept({ path: "/api/generate", method: "POST" })
      .reply(200, { response: "project summary here" }, { headers: { "content-type": "application/json" } })
      .times(1);

    const result = await provider.generate("write a summary");

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.text).toBe("project summary here");
    }
  });
});
