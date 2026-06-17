import { AIError, AIProvider } from "./types";

export class OllamaProvider implements AIProvider {
  private host: string;
  private model: string;

  constructor(config: { host?: string; model?: string }) {
    this.host = config.host ?? "http://localhost:11434";
    this.model = config.model ?? "llama3.2";
  }

  async generate(prompt: string) {
    try {
      const res = await fetch(`${this.host}/api/generate`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ model: this.model, prompt, stream: false }),
      });

      if (!res.ok) {
        if (res.status === 404) {
          return { ok: false as const, error: new AIError("config", `Model "${this.model}" not found. Try \`ollama pull ${this.model}\``) };
        }
        const body = await res.text().catch(() => "");
        return { ok: false as const, error: new AIError("server", `Ollama returned ${res.status}: ${body}`) };
      }

      const data = await res.json() as { response?: string };
      const text = data.response ?? "";
      if (!text) {
        return { ok: false as const, error: new AIError("empty_response", "Ollama returned empty response") };
      }
      return { ok: true as const, value: { text } };
    } catch (e: any) {
      const msg = e.message ?? String(e);
      if (msg.includes("ECONNREFUSED") || msg.includes("fetch failed")) {
        return { ok: false as const, error: new AIError("network", `Cannot connect to Ollama at ${this.host}. Is Ollama running? (${msg})`) };
      }
      return { ok: false as const, error: new AIError("network", msg) };
    }
  }
}
