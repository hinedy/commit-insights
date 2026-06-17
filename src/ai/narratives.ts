import type { AIProvider, StatsPayload } from "./providers/types";
import { buildPrompt } from "./prompts";

export async function generateNarrative(
  provider: AIProvider,
  stats: StatsPayload,
  opts?: { audience?: string; length?: string },
): Promise<string | null> {
  const prompt = buildPrompt(stats, opts);
  const result = await provider.generate(prompt);

  if (result.ok) {
    return result.value.text;
  }

  console.error(`[commit-insights] AI narrative skipped: ${result.error.message}`);
  return null;
}
