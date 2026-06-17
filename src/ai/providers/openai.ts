import { AIError, AIProvider } from "./types";
import { classifyOpenAIError } from "./openai-utils";

export class OpenAIProvider implements AIProvider {
  private apiKey: string;
  private baseUrl: string | undefined;
  private model: string;

  constructor(config: { apiKey?: string; baseUrl?: string; model?: string }) {
    if (!config.apiKey) {
      throw new AIError("config", "OpenAI API key is required (set OPENAI_API_KEY or config ai.apiKey)");
    }
    this.apiKey = config.apiKey;
    this.baseUrl = config.baseUrl;
    this.model = config.model ?? "gpt-4o";
  }

  async generate(prompt: string) {
    try {
      const OpenAI = (await import("openai")).default;
      const client = new OpenAI({
        apiKey: this.apiKey,
        baseURL: this.baseUrl,
        maxRetries: 0,
      });
      const response = await client.chat.completions.create({
        model: this.model,
        messages: [{ role: "user", content: prompt }],
      });
      const text = response.choices[0]?.message?.content ?? "";
      if (!text) {
        return { ok: false as const, error: new AIError("empty_response", "Model returned empty response") };
      }
      return { ok: true as const, value: { text } };
    } catch (e: any) {
      const kind = classifyOpenAIError(e);
      return { ok: false as const, error: new AIError(kind, e.message ?? String(e)) };
    }
  }
}
