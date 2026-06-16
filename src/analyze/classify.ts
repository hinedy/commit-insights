import type { Commit } from "../extract/types";

export const COMMIT_TYPES = [
  "feat", "fix", "chore", "docs", "refactor", "test",
  "style", "perf", "ci", "build", "revert", "merge", "other",
] as const;

export type CommitType = typeof COMMIT_TYPES[number];

const STRUCTURAL_TYPES = ["merge", "other"] as const;
type StructuralType = typeof STRUCTURAL_TYPES[number];

const _check: StructuralType extends CommitType ? true : never = true;

const CONVENTIONAL_TYPES = COMMIT_TYPES.filter(
  (t): t is Exclude<CommitType, StructuralType> =>
    !(STRUCTURAL_TYPES as readonly string[]).includes(t),
);

export const CONVENTIONAL_RE = new RegExp(
  `^(${CONVENTIONAL_TYPES.join("|")})(\\([^)]+\\))?!?:\\s`,
);

export interface ClassificationResult {
  perCommit: Array<{ hash: string; type: CommitType }>;
  counts: Record<CommitType, number>;
}

function classifyCommit(
  commit: { subject: string; parents: string[] },
): CommitType {
  if (commit.parents.length >= 2) return "merge";
  if (/^Merge /.test(commit.subject)) return "merge";
  const match = commit.subject.match(CONVENTIONAL_RE);
  if (match) return match[1] as CommitType;
  return "other";
}

export function classifyCommits(commits: Commit[]): ClassificationResult {
  const perCommit: ClassificationResult["perCommit"] = [];
  const counts: Record<string, number> = {};

  for (const c of commits) {
    const type = classifyCommit(c);
    perCommit.push({ hash: c.hash, type });
    counts[type] = (counts[type] ?? 0) + 1;
  }

  return {
    perCommit,
    counts: counts as Record<CommitType, number>,
  };
}
