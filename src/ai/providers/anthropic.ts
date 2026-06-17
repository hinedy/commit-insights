import { AIError, AIProvider } from "./types";
import { classifyAnthropicError } from "./anthropic-utils";

export class AnthropicProvider implements AIProvider {
  private apiKey: string;
  private model: string;

  constructor(config: { apiKey?: string; model?: string }) {
    if (!config.apiKey) {
      throw new AIError("config", "Anthropic API key is required (set ANTHROPIC_API_KEY or config ai.apiKey)");
    }
    this.apiKey = config.apiKey;
    this.model = config.model ?? "claude-sonnet-4-20250514";
  }

  async generate(prompt: string) {
    try {
      const { Anthropic } = await import("@anthropic-ai/sdk");
      const client = new Anthropic({
        apiKey: this.apiKey,
        maxRetries: 0,
      });
      const msg = await client.messages.create({
        model: this.model,
        max_tokens: 1024,
        messages: [{ role: "user", content: prompt }],
      });
      const text = (msg.content as Array<{ type: string; text: string }>)
        .filter((b) => b.type === "text")
        .map((b) => b.text)
        .join("\n");
      if (!text) {
        return { ok: false as const, error: new AIError("empty_response", "Model returned empty response") };
      }
      return { ok: true as const, value: { text } };
    } catch (e: any) {
      const kind = classifyAnthropicError(e);
      return { ok: false as const, error: new AIError(kind, e.message ?? String(e)) };
    }
  }
}
