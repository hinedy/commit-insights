import { describe, it, expect } from "vitest";
import { AIError } from "../../src/ai/providers/types";
import { createProvider } from "../../src/ai/providers";
import { AnthropicProvider } from "../../src/ai/providers/anthropic";
import { OpenAIProvider } from "../../src/ai/providers/openai";
import { OllamaProvider } from "../../src/ai/providers/ollama";
import { GeminiProvider } from "../../src/ai/providers/gemini";

describe("createProvider", () => {
  it("returns provider for valid ollama config", () => {
    const { provider, error } = createProvider({
      provider: "ollama",
      model: "llama3",
      baseUrl: "http://localhost:11434",
    });
    expect(error).toBeUndefined();
    expect(provider).toBeInstanceOf(OllamaProvider);
  });

  it("returns error with AIError when provider has missing apiKey", () => {
    const { provider, error } = createProvider({
      provider: "anthropic",
    });
    expect(provider).toBeUndefined();
    expect(error).toBeInstanceOf(AIError);
    expect(error!.kind).toBe("config");
  });
});
