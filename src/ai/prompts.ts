import type { StatsPayload } from "./providers/types";

type Audience = "manager" | "retro" | "resume" | "self";

const AUDIENCE_INSTRUCTIONS: Record<Audience, string> = {
  manager:
    "You are writing a summary for an engineering manager. Focus on team productivity, project progress, and areas of contribution. Highlight ticket resolution velocity and team collaboration.",
  retro:
    "You are writing a retrospective summary. Focus on what got done, what patterns emerged, and areas for improvement. Be balanced and constructive.",
  resume:
    "You are writing a resume bullet-point summary. Emphasize impact, scope, and outcomes. Use action verbs and quantify results where possible.",
  self:
    "You are writing a personal development summary. Reflect on contributions, growth areas, and technical achievements. Use a first-person reflective tone.",
};

export function buildPrompt(
  stats: StatsPayload,
  opts?: { audience?: string; length?: string },
): string {
  const audience = (opts?.audience ?? "self") as Audience;
  const instruction = AUDIENCE_INSTRUCTIONS[audience] ?? AUDIENCE_INSTRUCTIONS.self;
  const lengthHint = opts?.length === "short" ? "Keep it concise, 2-3 sentences." : "Write a brief paragraph.";

  return [
    `You are a git contribution analyst. ${instruction} ${lengthHint}`,
    "",
    "Here are the aggregated statistics:",
    "```json",
    JSON.stringify(stats, null, 2),
    "```",
    "",
    "Write a narrative summary based only on the data above. Do not invent specifics.",
  ].join("\n");
}
