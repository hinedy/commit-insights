## What to build

Implement pure-function analysis transforms over `Commit[]` — conventional-commit type detection, ticket/issue reference extraction, monthly timeline aggregation, directory-based area mapping (via on-demand file-path extraction), and reviewer parsing (Co-authored-by / Approved-by / Reviewed-by).

Six modules, each independently testable with inline fixture arrays (no real git needed except `mapAreasByFile` which uses `git diff-tree`).

## Design decisions (grill-resolved)

The following decisions were stress-tested and locked in before implementation began:

1. **`analyzeCommits` orchestrator** — a dedicated `src/analyze/index.ts` module exports a **sync** function that receives pre-computed `commitAreaMap` alongside the `Commit[]` array. `generate.ts` calls async I/O (extraction, `mapAreasByFile`) before calling this pure function.
2. **`CONVENTIONAL_RE` generated from `COMMIT_TYPES`** — the regex is built at module load time by filtering out `STRUCTURAL_TYPES` (`"merge"`, `"other"`), with a compile-time assertion (`_check` line) ensuring every structural type is a valid `CommitType`. Adding a new type to `COMMIT_TYPES` automatically flows into the regex.
3. **`buildTimeline` sorts input commits by date** before grouping — lexicographic sort on `YYYY-MM-DD` strings (no `Date` parsing). Gap-filling uses a pure `nextMonth()` string-arithmetic helper (not `Date`), avoiding timezone/edge-case bugs at month/year boundaries.
4. **`parseReviewers` dedup by email** — internal `Map<string, { displayName, count }>` keyed on lowercase email (or lowercase name when email absent). Email never survives into output (`ReviewerStat` has `name + collaborations` only). Scans only the **trailer block** (lines after the last `\n\n` in body), not the full body, preventing false positives from quoted/reverted trailers. `Reviewed-by:` added alongside `Co-authored-by:` and `Approved-by:`.
5. **`areas.ts` split into two exports** — private `getChangedFiles(hashes, repoPath)` calls `git diff-tree`; public `mapAreasByFile(...)` handles batching (500/group) and applies prefix matching. The batching loop is tested via `TestRepo` in Cycles 20-29.
6. **No errors from analysis modules** — all outputs handle emptiness naturally. Input validation (regex compilation, config shape) happens at config-load boundary in `src/config/`, not in analysis.
7. **`ticketPattern` compiled at config load** — `AppConfig` carries both raw string (`ticketPattern`) and compiled `RegExp` (`compiledTicketPattern`). Zod validates the pattern string is a valid regex at config-load time, so `generate.ts` never sees a `SyntaxError` mid-pipeline.

## Interface design (approve before first test)

### Module 0: Orchestrator — `src/analyze/index.ts`

```typescript
export interface AnalysisResult {
  classification: ClassificationResult;
  tickets: TicketResult;
  timeline: TimelineBucket[];
  areas: Map<string, string>;         // commitHash → areaName (from mapAreasByFile)
  areaCounts: Record<string, number>; // areaName → commit count (derived from areas Map)
  reviewers: ReviewerStat[];
}

/**
 * Pure function — same inputs always produce same result.
 * No I/O, no side effects, no mutations of input arrays.
 * commitAreaMap is pre-computed by generate.ts via mapAreasByFile().
 */
export function analyzeCommits(
  commits: Commit[],
  config: { ticketPattern: RegExp },
  commitAreaMap: Map<string, string>,
): AnalysisResult;
```

Called from `generate.ts` as:

```typescript
const commits = await extractOrCache(repoPath, opts);
const areaMap = await mapAreasByFile(
  commits.map(c => c.hash),
  config.areas,
  config.ignorePaths,
  repoPath,
);
const result = analyzeCommits(commits, { ticketPattern: config.compiledTicketPattern }, areaMap);
```

### Module 1: `classify.ts`

```typescript
const COMMIT_TYPES = [
  "feat", "fix", "chore", "docs", "refactor", "test",
  "style", "perf", "ci", "build", "revert", "merge", "other",
] as const;

type CommitType = typeof COMMIT_TYPES[number];

const STRUCTURAL_TYPES = ["merge", "other"] as const;
type StructuralType = typeof STRUCTURAL_TYPES[number];

// Compile-time assertion: every structural type must be a valid CommitType
const _check: StructuralType extends CommitType ? true : never = true;

// CONVENTIONAL_RE generated at module load — adding a type to COMMIT_TYPES
// (that isn't in STRUCTURAL_TYPES) automatically updates the regex.
const CONVENTIONAL_TYPES = COMMIT_TYPES.filter(
  (t): t is Exclude<CommitType, StructuralType> =>
    !(STRUCTURAL_TYPES as readonly string[]).includes(t),
);
const CONVENTIONAL_RE = new RegExp(
  `^(${CONVENTIONAL_TYPES.join("|")})(\\([^)]+\\))?!?:\\s`,
);

interface ClassificationResult {
  perCommit: Array<{ hash: string; type: CommitType }>;
  counts: Record<CommitType, number>;
}

function classifyCommits(commits: Commit[]): ClassificationResult;
```

- Match against `subject` only, not body
- Merge detection priority: `parents.length >= 2` (authoritative) → `/^Merge /` (1-parent merges) → `CONVENTIONAL_RE` → `"other"`
- Order sensitivity in regex alternation: longer/more-specific types should precede shorter ones if that ever changes (not currently an issue — no type is a prefix of another).

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
- **Sorts input commits by date ascending** before grouping — lexicographic compare on `YYYY-MM-DD` strings (correct without `Date` parsing). Uses `[...commits].sort()` to avoid mutating the input.
- **Gap-filling**: uses string-arithmetic `nextMonth(ym)` helper (not `Date`) to walk from first to last month, emitting zero-count buckets for months with no commits (continuous chart rendering)
- `nextMonth` implementation:
  ```typescript
  function nextMonth(ym: string): string {
    const [y, m] = ym.split("-").map(Number);
    return m === 12
      ? `${y + 1}-01`
      : `${y}-${String(m + 1).padStart(2, "0")}`;
  }
  ```
- Empty input → `[]`

### Module 4: `areas.ts`

Split into two exports. The first is a private subprocess helper; the second is the public mapping function.

```typescript
/**
 * INTERNAL — exported for test isolation.
 * Calls `git diff-tree --no-commit-id -r --name-only -z` for a batch of hashes.
 * File paths retrieved from the working tree, never stored in Commit objects.
 * Returns array parallel to hashes: one entry per input hash (files in commit).
 */
export async function getChangedFiles(
  hashes: string[],
  repoPath: string,
): Promise<string[][]>
```

```typescript
/**
 * Derives area assignments by inspecting file paths touched by each commit.
 *
 * Batches hashes in groups of 500, calling getChangedFiles per batch.
 * File paths are never stored — fetched on-demand, never cached.
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
 */
export async function mapAreasByFile(
  hashes: string[],
  areas: Record<string, string>,
  ignore: string[],
  repoPath: string,
): Promise<Map<string, string>>
```

### Module 5: `reviewers.ts`

```typescript
export interface ReviewerStat {
  name: string;
  collaborations: number;
}

function parseReviewers(commits: Commit[]): ReviewerStat[];
```

- Scans only the **trailer block** — lines after the last `\n\n` in `commit.body`, not the full body text. Prevents false positives from `Co-authored-by:` appearing in quoted/reverted text mid-body.
- Parses three trailer headers: `Co-authored-by:`, `Approved-by:`, and `Reviewed-by:`.
- Email-keyed dedup: builds internal `Map<string, { displayName: string; count: number }>` keyed on lowercase email (or lowercase name when email absent). Email never survives into `ReviewerStat`.
- Trailer parser handles `Name <email>` loosely — `@` presence signals a valid email; `Alice <>` and `Alice < >` fall through to name-only dedup. Empty values produce no entry.
- First display name seen for a given key wins (deterministic — commits arrive in a consistent order).
- Returns sorted descending by collaboration count.
- Field named `collaborations` to cover both co-authorship and approval semantics.

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
| 30 | single Co-authored-by | Body `"Co-authored-by: Alice <alice@x.com>"` → `[{ name: "Alice", collaborations: 1 }]`. Email stripped from output. |
| 31 | multiple trailers | Body has Co-authored-by + Approved-by → 2 entries in result |
| 32 | no trailers → empty | No matching lines → `[]` |
| 33 | sorted descending | Alice (3) before Bob (1) |
| 34 | same email across two commits | Two commits both name `"Alice <alice@x.com>"` → `[{ name: "Alice", collaborations: 2 }]` |
| 35 | same name, different email → separate | `"Alice <alice@corp.com>"` and `"Alice <alice@gmail.com>"` → 2 separate entries |
| 36 | Reviewed-by detected | `"Reviewed-by: Carol <carol@x.com>"` → counted as collaboration |
| 37 | trailer in quoted body not parsed | Body text contains `"Co-authored-by: Eve <eve@x.com>"` mid-paragraph (before trailer block) → not counted |
| 38 | no-email trailer | `"Co-authored-by: Alice"` (no angle brackets) → `[{ name: "Alice", collaborations: 1 }]` |
| 39 | empty email brackets | `"Co-authored-by: Alice <>"` → name-only dedup, treated as no email |

### Module 6: orchestrator (`src/analyze/index.ts`)

| Cycle | Behavior | Detail |
|-------|----------|--------|
| 40 | analyzeCommits returns complete result | Empty commits → empty classifications, empty tickets, empty timeline, empty areas, empty reviewers |
| 41 | areaCounts derived from areaMap | 3 commits in "Backend", 2 in "Frontend" → `{ Backend: 3, Frontend: 2 }` |

### Module 7: type-system integrity

| Cycle | Behavior | Detail |
|-------|----------|--------|
| 42 | CONVENTIONAL_RE source includes all conventional types | Test asserts every type in `COMMIT_TYPES \ STRUCTURAL_TYPES` appears in `CONVENTIONAL_RE.source` |
| 43 | CONVENTIONAL_RE excludes structural types | Test asserts `"merge"` and `"other"` are NOT in `CONVENTIONAL_RE.source` |

## Acceptance criteria

- [ ] All 43 RED→GREEN cycles pass
- [ ] `getChangedFiles` uses `git diff-tree --no-commit-id -r --name-only -z` in batches of 500
- [ ] File data is never cached, never embedded in `Commit`, never reaches dashboard HTML
- [ ] Interface signatures match the approved design above
- [ ] `analyzeCommits` is synchronous, pure, has no I/O parameter
- [ ] `parseReviewers` never emits email addresses in output

## Blocked by

- 002-extraction
