## What to build

Implement pure-function analysis transforms over `Commit[]` — conventional-commit type detection, ticket/issue reference extraction, monthly timeline aggregation, directory-based area mapping (via on-demand file-path extraction), and reviewer parsing (Co-authored-by / Approved-by).

Six modules, each independently testable with inline fixture arrays (no real git needed except `mapAreasByFile` which uses `git diff-tree`).

## Interface design (approve before first test)

### Module 1: `classify.ts`

```typescript
type CommitType = "feat" | "fix" | "chore" | "docs" | "refactor" | "test"
  | "style" | "perf" | "ci" | "build" | "revert" | "merge" | "other";

// Backed by const COMMIT_TYPES = [...] as const — single source for runtime + type
const CONVENTIONAL_RE = /^(feat|fix|chore|docs|refactor|test|style|perf|ci|build|revert)(\([^)]+\))?!?:\s/;

interface ClassificationResult {
  perCommit: Array<{ hash: string; type: CommitType }>;
  counts: Record<CommitType, number>;
}

function classifyCommits(commits: Commit[]): ClassificationResult;
```

- Match against `subject` only, not body
- Merge detection: `commit.parents.length >= 2 || /^Merge /.test(commit.subject)`
- Anything not matching CONVENTIONAL_RE and not a merge → `"other"`

### Module 2: `tickets.ts`

```typescript
interface TicketResult {
  perCommit: Array<{ hash: string; tickets: string[] }>;
  counts: Record<string, number>;  // ticketId → commit count
}

function extractTickets(commits: Commit[], pattern: RegExp): TicketResult;
```

- Default pattern: `/[A-Z][A-Z0-9]*-\d+/g`
- Searches `subject` + `body` for all matches per commit
- **Deduplicate within a commit** (use `Set`) — repeated mentions of the same ticket in one commit count once
- `counts` = number of **unique commits** referencing each ticket, not total mentions across commits
- One commit can reference multiple tickets

### Module 3: `timeline.ts`

```typescript
interface TimelineBucket {
  month: string;   // "YYYY-MM"
  count: number;
}

function buildTimeline(commits: Commit[]): TimelineBucket[];
```

- Monthly only for v1; function signature open to future `interval` param
- **Gap-filling**: emit every month from first to last commit date — zero-count buckets for months with no commits (continuous chart rendering)
- Empty input → `[]`

### Module 4: `areas.ts` — `mapAreasByFile`

```typescript
 /**
  * Derives area assignments by inspecting file paths touched by each commit.
  * File paths are never stored — fetched on-demand via git diff-tree.
  *
  * Batches hashes in groups of 500 (ARG_MAX safety).
  * Uses `git diff-tree --no-commit-id -r --name-only -z` (plumbing; no metadata overhead).
  *
  * Longest-prefix-match across ALL files in the commit determines the area.
  * Prefixes are auto-normalized: if a prefix does not end with `/`, one is appended.
  * This means `src/api` (no slash) is treated as a directory prefix and matches
  * `src/api/rest.ts`. Path-boundary enforcement still prevents `src/api` from
  * matching `src/apiary/auth.ts` — auto-normalization ensures the prefix is treated
  * as a directory, not a file-name fragment.
  *
  * On Windows, all `\` in file paths are normalized to `/` before comparison.
  *
  * Tie-break (equal prefix length): config key insertion-order, first match wins.
  * Users should list more-specific prefixes before broader ones.
  *
  * Commits with no matching file (after ignorePaths filtering) → "Uncategorized".
  * ignorePaths entries use the same auto-normalized path-boundary rule (no globs in v1).
  *
  * @param hashes    - commit hashes to classify
  * @param areas     - resolved area config: path prefix → area name
  * @param ignore    - resolved ignorePaths from AppConfig
  * @param repoPath  - working directory for git subprocess
  * @returns         - Map<commitHash, areaName>, one entry per input hash
  */
async function mapAreasByFile(
  hashes: string[],
  areas: Record<string, string>,
  ignore: string[],
  repoPath: string,
): Promise<Map<string, string>>
```

### Module 5: `reviewers.ts`

```typescript
interface ReviewerStat {
  name: string;
  collaborations: number;
}

function parseReviewers(commits: Commit[]): ReviewerStat[];
```

- Parses `Co-authored-by:` and `Approved-by:` trailers from `commit.body`
- Returns aggregate counts sorted descending by collaboration count
- Field named `collaborations` to cover both co-authorship and approval semantics

### Full analysis result (what `generate.ts` receives)

```typescript
interface AnalysisResult {
  classification: ClassificationResult;
  tickets: TicketResult;
  timeline: TimelineBucket[];
  areas: Map<string, string>;         // commitHash → areaName (from mapAreasByFile)
  areaCounts: Record<string, number>; // areaName → commit count (derived from areas)
  reviewers: ReviewerStat[];
}
```

## Behaviors (one RED→GREEN cycle each)

### Module 1: classify

| Cycle | Behavior | Detail |
|-------|----------|--------|
| 1 | feat detected | `"feat: add login"` → `{ type: "feat" }` |
| 2 | fix with scope | `"fix(auth): handle token expiry"` → `{ type: "fix" }` |
| 3 | breaking change | `"feat!: drop IE11 support"` → `{ type: "feat" }` — `!` doesn't affect type |
| 4 | chore | `"chore: update deps"` → `{ type: "chore" }` |
| 5 | merge via parents | `commit.parents.length >= 2` → `{ type: "merge" }` |
| 6 | merge via subject | `"Merge branch 'feature'"` with 1 parent → `{ type: "merge" }` |
| 7 | other (no match) | `"some random message"` → `{ type: "other" }` |
| 8 | perCommit + counts in sync | 3 commits: feat, fix, feat → counts `{ feat: 2, fix: 1 }` |

### Module 2: tickets

| Cycle | Behavior | Detail |
|-------|----------|--------|
| 9 | single ticket in subject | `"MEDX-123 fix login"` → `["MEDX-123"]` |
| 10 | multiple tickets in body | Subject `"fix stuff"`, body `"Refs MEDX-123, MEDX-456"` → `["MEDX-123", "MEDX-456"]` |
| 11 | no match → empty array | No ticket-like string → `[]` |
| 12 | counts derived correctly | 3 commits: two ref MEDX-123, one ref MEDX-456 → counts `{ "MEDX-123": 2, "MEDX-456": 1 }` |
| 13 | custom pattern | Pass custom `/GH-\d+/g` → `GH-1` matches, `MEDX-1` doesn't |
| 14 | dedup within commit | Commit body mentions `MEDX-123` twice → `["MEDX-123"]` (single entry via Set) |

### Module 3: timeline

| Cycle | Behavior | Detail |
|-------|----------|--------|
| 15 | single month | 2 commits in 2026-06 → `[{ month: "2026-06", count: 2 }]` |
| 16 | multiple months | Commits across June + July 2026 → two buckets |
| 17 | empty input | `[]` → `[]` |
| 18 | sorted ascending | Months in chronological order regardless of input order |
| 19 | gap-filling | Commits in Jan 2026 + Mar 2026 → emits Feb 2026 with count 0 |

### Module 4: areas (mapAreasByFile)

| Cycle | Behavior | Detail |
|-------|----------|--------|
| 20 | empty hashes | Empty Map returned, zero subprocess calls |
| 21 | single file, single match | `src/api/users.ts`, config `src/api/` → `"Backend"` → `{ hash → "Backend" }` |
| 22 | multiple files, longest wins | `src/api/x.ts` + `src/web/y.ts` + `README.md` — config `src/` → `"Frontend"`, `src/api/` → `"Backend"`, `src/web/` → `"UI"` → `"UI"` (depth 8, deepest) |
| 23 | tie-break: equal-length prefixes | Config order: `src/app/` → `"App"`, `src/lib/` → `"Lib"`. Commit touches both → `"App"` wins (first in config) |
| 24 | ignored file filtered | `ignore: ["package-lock.json"]`. Commit touches only that file → `"Uncategorized"` |
| 25 | directory ignore | `ignore: ["dist/"]`. Commit touches `dist/bundle.js` only → `"Uncategorized"` |
| 26 | no match → Uncategorized | `vendor/thing.js`, no config matches → `"Uncategorized"` |
| 27 | path-boundary enforcement (auto-normalize) | Config `src/api` (no slash) auto-normalized to `src/api/`. Matches `src/api/rest.ts` but NOT `src/apiary/auth.ts` (boundary enforcement still prevents cross-directory matches) |
| 28 | batch boundary | 501 hashes → exactly 2 `git diff-tree` subprocess calls |
| 29 | mixed ignored + matched | `dist/bundle.js` + `src/api/users.ts`. `dist/` ignored, `src/api/` matches `"Backend"` → `"Backend"` |

### Module 5: reviewers

| Cycle | Behavior | Detail |
|-------|----------|--------|
| 30 | single Co-authored-by | Body `"Co-authored-by: Alice <alice@x.com>"` → `[{ name: "Alice", collaborations: 1 }]` |
| 31 | multiple trailers | Body has Co-authored-by + Approved-by → 2 entries |
| 32 | no trailers → empty | No matching lines → `[]` |
| 33 | sorted descending | Alice (3) before Bob (1) |
| 34 | duplicate names merged | Two commits, both count Alice → `[{ name: "Alice", collaborations: 2 }]` |

## Acceptance criteria

- [ ] All 34 RED→GREEN cycles pass
- [ ] `mapAreasByFile` uses `git diff-tree --no-commit-id -r --name-only -z` in batches of 500
- [ ] File data is never cached, never embedded in `Commit`, never reaches dashboard HTML
- [ ] Interface signatures match the approved design above

## Blocked by

- 002-extraction
