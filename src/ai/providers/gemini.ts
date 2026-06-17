import { AIError, AIProvider } from "./types";
import { classifyGeminiError } from "./gemini-utils";

export class GeminiProvider implements AIProvider {
  private apiKey: string;
  private model: string;

  constructor(config: { apiKey?: string; model?: string }) {
    if (!config.apiKey) {
      throw new AIError("config", "Google Gemini API key is required (set GOOGLE_API_KEY or config ai.apiKey)");
    }
    this.apiKey = config.apiKey;
    this.model = config.model ?? "gemini-2.0-flash";
  }

  async generate(prompt: string) {
    try {
      const { GoogleGenerativeAI } = await import("@google/generative-ai");
      const genAI = new GoogleGenerativeAI(this.apiKey);
      const model = genAI.getGenerativeModel({ model: this.model });
      const result = await model.generateContent(prompt);
      const text = result.response.text();
      if (!text) {
        return { ok: false as const, error: new AIError("empty_response", "Gemini returned empty response") };
      }
      return { ok: true as const, value: { text } };
    } catch (e: any) {
      const kind = classifyGeminiError(e);
      return { ok: false as const, error: new AIError(kind, e.message ?? String(e)) };
    }
  }
}
