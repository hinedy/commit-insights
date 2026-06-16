## What to build

Implement `extractCommits()` — safe git log extraction using `git log -z` with `\x1f` field separators. Build `TestRepo` helper for programmatic test repos.

## Reference snippets

Delete these untracked files before starting (they were written during design, not tested):
- `src/extract/gitLog.ts`
- `src/extract/types.ts`
- `tests/helpers/testRepo.ts`

The patterns are documented in AGENTS.md; this issue re-implements them properly via TDD.

## Interface design (approve before first test)

```typescript
// src/extract/types.ts
export interface Commit {
  hash: string;
  parents: string[];     // %P — split on " ", empty for root commit, 2+ for merge
  authorName: string;
  authorEmail: string;
  date: string;          // "YYYY-MM-DD" from --date=short
  subject: string;
  body: string;
}

// src/extract/gitLog.ts
// Format: %H\x1f%P\x1f%an\x1f%ae\x1f%ad\x1f%s\x1f%b
export async function extractCommits(
  repoPath: string,
  authorFilter?: string   // exact match, not regex
): Promise<Commit[]>;
```

```typescript
// tests/helpers/testRepo.ts
export class TestRepo {
  readonly dir: string;

  constructor();                         // mkdtempSync + git init + local config
  git(...args: string[]): string;        // execFileSync wrapper
  commit(opts: { message: string; body?: string; files?: Record<string, string | Buffer> }): string; // returns hash
  checkout(ref: string, opts?: { create?: boolean }): void;
  merge(branch: string, message: string): void;
  cleanup(): void;                       // rmSync temp dir
}
```

## Behaviors (one RED→GREEN cycle each)

### Cycle 1: Happy path
```
RED:   test returns commit with correct hash, author, date, subject, body
GREEN: implement parseCommit(), TestRepo basic commit
```
- One commit with subject + body
- All five fields match what was committed

### Cycle 2: Empty body
```
RED:   test body is "" when commit has no body
GREEN: handle missing %b field
```
- `commit({ message: "feat: no body" })` → body is `""`

### Cycle 3: Multi-line body with blank lines
```
RED:   test preserves internal newlines, strips trailing newlines
GREEN: body.replace(/\n+$/, "") after join
```
- Body `"Line one.\n\nLine two."` → preserved

### Cycle 4: Empty repo
```
RED:   test returns [] instead of throwing
GREEN: catch err.code === 128 + "no commits" → return []
```
- `new TestRepo()` without any commits → `extractCommits` returns `[]`

### Cycle 5: Root commit has zero parents
```
RED:   first commit in repo → parents is []
GREEN: split(%P) → filter(Boolean), empty array for root
```
- `TestRepo` with one commit → `commits[0].parents` equals `[]`

### Cycle 6: Merge commit has two parents
```
RED:   merge commit with --no-ff → parents.length === 2
GREEN: confirm both parent hashes present and parseable
```
- Branch, commit, checkout master, merge `--no-ff` → merge commit's `parents` has 2 entries

### Cycle 7: Merge commits appear in output
```
RED:   test merge commit appears with "Merge branch" subject
GREEN: verify -z format includes merge commits
```
- Create branch, commit, merge with `--no-ff` → output contains the merge

### Cycle 8: Binary files in tree
```
RED:   test binary file doesn't break extraction
GREEN: verify git log handles binary paths gracefully
```
- Commit with `Buffer.from([0, 1, 255])` → extraction succeeds

### Cycle 9: Detached HEAD
```
RED:   test walks history from checked-out commit only
GREEN: verify log walks from HEAD, not branch
```
- Commit twice, checkout first hash → only first commit in output

### Cycle 10: TestRepo cleanup
```
RED:   test temp dir is deleted in afterEach
GREEN: verify cleanup() runs even on test failure
```
- `afterEach(() => repo.cleanup())` → temp dir removed

## Acceptance criteria

- [x] All 10 RED→GREEN cycles pass
- [x] Interface signatures match the approved design above
- [x] No changes to interface shape without explicit approval

## Blocked by

- 001-scaffold
