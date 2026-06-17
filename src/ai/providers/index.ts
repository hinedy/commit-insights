import { AIError, AIProvider } from "./types";
import { AnthropicProvider } from "./anthropic";
import { OpenAIProvider } from "./openai";
import { OllamaProvider } from "./ollama";
import { GeminiProvider } from "./gemini";

export function createProvider(config: {
  provider?: string;
  model?: string;
  apiKey?: string;
  baseUrl?: string;
}): { provider?: AIProvider; error?: AIError } {
  try {
    switch (config.provider) {
      case "anthropic":
        return { provider: new AnthropicProvider({ apiKey: config.apiKey, model: config.model }) };
      case "openai":
        return { provider: new OpenAIProvider({ apiKey: config.apiKey, baseUrl: config.baseUrl, model: config.model }) };
      case "ollama":
        return { provider: new OllamaProvider({ host: config.baseUrl, model: config.model }) };
      case "gemini":
        return { provider: new GeminiProvider({ apiKey: config.apiKey, model: config.model }) };
      default:
        return { error: new AIError("config", `Unknown provider "${config.provider ?? ""}". Supported: anthropic, openai, ollama, gemini`) };
    }
  } catch (e: any) {
    if (e instanceof AIError) {
      return { error: e };
    }
    return { error: new AIError("config", e.message ?? String(e)) };
  }
}
