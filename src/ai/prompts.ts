import type { StatsPayload } from "./providers/types";

type Audience = "manager" | "retro" | "resume" | "self";

interface AudienceSpec {
  lens: string;
  shape: string;
  format: "prose" | "bullets";
  sentenceRange: [number, number];
}

const AUDIENCE_SPECS: Record<Audience, AudienceSpec> = {
  self: {
    lens: "Write for the developer themselves, reading their own history back. They lived this — don't narrate it, interpret it. Tell them something about their own work they'd find genuinely worth knowing.",
    shape: "Pick the 1-2 most significant things the data reveals — a project that dominated their time, an unusual shift in pace, a collaboration pattern. Open with that, not with a date range.",
    format: "prose",
    sentenceRange: [4, 6],
  },
  manager: {
    lens: "Write for an engineering manager who needs a fast, accurate read on this person's contribution. They will skim once.",
    shape: "Select the 2-3 facts that matter most for understanding scope and impact: the largest piece of ownership, the collaboration footprint, and one honest note on balance (e.g. feature vs. fix ratio, or a gap). Ignore everything else in the data, even if it's interesting.",
    format: "prose",
    sentenceRange: [4, 6],
  },
  retro: {
    lens: "Write for a team retrospective discussion. The goal is to surface one or two things worth talking about as a team, not to summarize the individual.",
    shape: "Identify one pattern in the cadence or focus areas that has a team-level implication — e.g., a quarter where output concentrated on one ticket, a collaboration bottleneck, a shift from feature work to maintenance. State the pattern and its likely cause from the data. Skip anything that's just a number with no implication.",
    format: "prose",
    sentenceRange: [4, 6],
  },
  resume: {
    lens: "Write resume bullet points. A hiring manager reads fast and discounts adjectives — specificity is what convinces them, not enthusiasm.",
    shape: "Each bullet leads with a strong past-tense verb, names a concrete thing built or owned, and includes one real number from the data. No bullet should be generic enough to apply to any developer.",
    format: "bullets",
    sentenceRange: [4, 5],
  },
};

export function buildPrompt(
  stats: StatsPayload,
  opts?: { audience?: string; length?: string },
): string {
  const requested = (opts?.audience ?? "self") as Audience;
  const spec = AUDIENCE_SPECS[requested] ?? AUDIENCE_SPECS.self;

  const [min, max] = spec.sentenceRange;
  const lengthRule =
    spec.format === "bullets"
      ? `Write exactly ${min}–${max} bullet points. No intro line, no closing line — bullets only.`
      : `Write ${min}–${max} sentences of flowing prose. No headers, no bullet points, no lists.`;

  const lengthOverride = opts?.length === "short" ? "Use the lower end of that range." : "";

  return [
    spec.lens,
    "",
    spec.shape,
    "",
    "Voice: write like an engineer who trusts the reader. Concise. Not impressed by their own work. State facts plainly — never inflate with words like 'substantial', 'impressive', or 'significant' when a number already makes the point.",
    "",
    "Rules:",
    "- Use only the numbers and facts in the JSON below. Quote them exactly as given — do not round, sum, or recompute.",
    "- If a value in the data is unremarkable, leave it out. Silence is better than narrating every field.",
    `- ${lengthRule} ${lengthOverride}`.trim(),
    "",
    "```json",
    JSON.stringify(stats, null, 2),
    "```",
  ].join("\n");
}
