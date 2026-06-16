# 005 — SQLite commit cache

## Status

**Grill completed 2026-06-17.** Decision: `better-sqlite3` over `node:sqlite`.

### Why `better-sqlite3`, not `node:sqlite`

| Factor | `node:sqlite` | `better-sqlite3` |
|--------|--------------|-------------------|
| Node engine floor | >=22.13.0 | >=18.0.0 |
| User install failure mode | Runtime crash: `ERR_MODULE_NOT_FOUND` on Node 18/20/22.0-22.12 | Install-time: clear error if no prebuild + no build tools |
| Stderr noise | `ExperimentalWarning` every invocation on 22.13–25.x | None |
| Transactions | Manual `BEGIN`/`COMMIT`/`ROLLBACK` | `db.transaction(fn)` — auto wrap |
| PRAGMA | `db.prepare("PRAGMA...").get()` | `db.pragma(str)` — one call |
| Warning suppression | Monkey-patch `process.emitWarning` in entry point | None needed |
| tsup config | No change | `external: ["better-sqlite3"]` |

End-user experience wins: fail-fast at install time, zero warnings, broader Node support.

## Dependencies

- `better-sqlite3` — runtime dep (^12.10.0)
- `@types/better-sqlite3` — devDep (^7.6.13)

## tsup config change

```typescript
// tsup.config.ts — add external
export default defineConfig({
  entry: ["src/bin/commit-insights.ts", "src/index.ts"],
  format: ["esm"],
  dts: true,
  clean: true,
  define: { __VERSION__: JSON.stringify(pkg.version) },
  external: ["better-sqlite3"],
});
```

tsup also auto-externals `dependencies` — explicit line is belt-and-suspenders.

## What to build

Incremental SQLite cache at `.git/commit-insights/cache.db`. Store raw unfiltered commits. Fast path for linear history (`git merge-base --is-ancestor`), hash-set diff for rebase/force-push reconciliation. `--no-cache` flag to skip entirely. `--all` mode bypasses cache.

### Files

| File | Action | Purpose |
|------|--------|---------|
| `src/storage/cache.ts` | **New** | Core cache module |
| `src/commands/cache.ts` | **New** | `cache status`, `cache clear` |
| `tests/cache.test.ts` | **New** | 9 TDD cycles (cycle 7 deferred to 006) |
| `src/extract/gitLog.ts` | Modify | Export `parseCommit()` for cache reuse |
| `src/cli.ts` | Modify | Register `cache` command |
| `tsup.config.ts` | Modify | Add `external: ["better-sqlite3"]` |
| `package.json` | Modify | Add `better-sqlite3`, `@types/better-sqlite3`, `engines.node >=18` |
| `bin/commit-insights.ts` | **No change** | No warning monkey-patch needed |

### Interfaces

```typescript
// src/storage/cache.ts

interface SyncCacheOpts {
  repoPath: string;
  noCache?: boolean;          // skip cache, raw extract every time
  authorFilter?: string;      // only used when noCache is true
}

type CachePath = "fresh" | "fast" | "slow" | "hit" | "bypass";

interface CacheDiagnostics {
  path: CachePath;
}

interface SyncResult {
  commits: Commit[];
  diagnostics: CacheDiagnostics;
}

interface CacheStats {
  commitCount: number;
  lastRunAt: string | null;   // ISO string
  lastHead: string | null;
  dbSizeBytes: number;
}

// Exported functions:
// syncCache(opts: SyncCacheOpts): Promise<SyncResult>
// getCacheStats(repoPath: string): CacheStats
// clearCache(repoPath: string): void
```

### DB schema

```sql
CREATE TABLE commits (
  hash          TEXT PRIMARY KEY,
  parents       TEXT,           -- space-separated parent hashes; empty string for root commits; matches git %P format
  author_name   TEXT,
  author_email  TEXT,
  date          TEXT,
  subject       TEXT,
  body          TEXT,
  extracted_at  TEXT            -- ISO timestamp of insertion
);

CREATE TABLE meta (
  key   TEXT PRIMARY KEY,
  value TEXT
);

-- meta rows:
--   last_head: SHA of HEAD when cache was last synced
--   schema_version: integer (currently 1)
--   last_run_at: ISO timestamp of last sync
```

**No migration support**: if `schema_version` doesn't match the current code version, drop and rebuild the database from scratch.

### `syncCache()` flow

```
syncCache(opts):
  if opts.noCache:
    return { commits: extractCommits(opts.repoPath, opts.authorFilter),
             diagnostics: { path: "bypass" } }

  db = openOrCreate(repoPath)         // new Database(...)
  ensureSchema(db)                     // CREATE TABLE IF NOT EXISTS
  meta = readMeta(db)
  if meta is empty:
    commits = extractCommits(opts.repoPath)
    bulkInsert(db, commits)            // uses db.transaction() internally
    writeMeta(db, { last_head: HEAD, last_run_at: now, schema_version: 1 })
    db.close()
    return { commits, diagnostics: { path: "fresh" } }

  HEAD = getHeadSha(repoPath)
  if HEAD === meta.lastHead:
    commits = readAllCached(db)        // pure DB read, no subprocess
    db.close()
    return { commits, diagnostics: { path: "hit" } }

  if isAncestor(meta.lastHead, HEAD, repoPath):
    // fast path — linear history
    newCommits = extractCommitsInRange(repoPath, `${meta.lastHead}..HEAD`)
    bulkInsert(db, newCommits)         // uses db.transaction()
    allCommits = readAllCached(db)
    updateMeta(db, { last_head: HEAD, last_run_at: now })
    db.close()
    return { commits: allCommits, diagnostics: { path: "fast" } }
  else:
    // slow path — rebase/force-push
    headHashes = gitLogHashesOnly(repoPath)     // Set<string>
    cachedHashes = readAllHashesFromDb(db)        // Set<string>
    orphanHashes = cachedHashes.diff(headHashes)  // in DB but not reachable
    newHashes = headHashes.diff(cachedHashes)     // reachable but not in DB

    if orphanHashes.size > 0:
      deleteHashes(db, orphanHashes)
    if newHashes.size > 0:
      newCommits = extractCommitsByHash(repoPath, newHashes) // batched positional args
      bulkInsert(db, newCommits)       // uses db.transaction()

    allCommits = readAllCached(db)
    updateMeta(db, { last_head: HEAD, last_run_at: now })
    db.close()
    return { commits: allCommits, diagnostics: { path: "slow" } }
```

### `better-sqlite3` API mapping

```typescript
import Database from "better-sqlite3";

// Open / create
const db = new Database("path/to/cache.db");
db.pragma("journal_mode = WAL");

// Execute
db.exec("CREATE TABLE IF NOT EXISTS ...");

// Prepare + query
const stmt = db.prepare("SELECT ... WHERE hash = ?");
stmt.get("abc123");          // first row or undefined
stmt.all();                   // all rows as array

// Prepare + write
const insert = db.prepare("INSERT OR REPLACE ... VALUES (?, ?, ...)");
insert.run(hash, parents, ...);

// Transaction (automatic BEGIN/COMMIT/ROLLBACK)
const tx = db.transaction((rows: Commit[]) => {
  for (const r of rows) insert.run(...);
});
tx(commits);

// Close
db.close();
```

### Git helpers (private to `cache.ts`)

```typescript
// Extract commits in a revision range — fast path
async function extractCommitsInRange(repoPath: string, range: string): Promise<Commit[]>
// args: log, -z, --pretty=format:%H\x1f%P\x1f%an\x1f%ae\x1f%ad\x1f%s\x1f%b, --date=short, range
// parse output via parseCommit()

// Extract only hashes reachable from HEAD — slow path hash diff
async function gitLogHashesOnly(repoPath: string): Promise<Set<string>>
// args: log, --format=%H, -z, HEAD
// split on \0, collect into Set

// Extract specific commits by hash — slow path new insertion
// BATCH_SIZE = 500 to avoid ARG_MAX; positional args, not stdin
async function extractCommitsByHash(repoPath: string, hashes: Set<string>): Promise<Commit[]>
// const arr = Array.from(hashes);
// for i from 0 to arr.length step BATCH_SIZE:
//   batch = arr.slice(i, i + BATCH_SIZE)
//   args: log, --no-walk, -z, --pretty=format:..., --date=short, ...batch
//   parse + accumulate
```

## Behaviors (one RED→GREEN cycle each)

### Cycle 1 — Schema created on first run

**Test**: New repo with 1 commit → `syncCache({repoPath})` → DB file exists at `.git/commit-insights/cache.db`, `PRAGMA table_info('commits')` returns 8 columns, `PRAGMA table_info('meta')` returns 2 columns.

**Tooling**: `db.prepare("PRAGMA table_info(...)").all()` returns array of column rows.

### Cycle 2 — Insert + retrieve one commit

**Test**: Repo with 1 commit → `syncCache({repoPath})` returns `Commit[]` length 1, all fields (hash, authorName, authorEmail, date, subject, body, parents) match the original.

### Cycle 3 — "hit": same HEAD calls again

**Test**: After cycle 2, call `syncCache({repoPath})` again → same `Commit[]` returned, `diagnostics.path === "hit"`, zero `git log` subprocess calls for commit data (only `git rev-parse HEAD`).

### Cycle 4 — Fast path: linear new commit

**Test**: Cache has HEAD at hash A, add commit B (linear child of A) → `syncCache` returns both A and B, `diagnostics.path === "fast"`, only commit B was extracted via `git log`.

### Cycle 5 — Slow path: rebase

**Test**: Create A → B → C. Sync (cache has A, B, C). Rebase to rewrite B and C with new hashes while preserving A:

```typescript
repo.git("commit", "--amend", "--no-edit");  // amend HEAD to force hash change
// Old B and C hashes are now orphaned from HEAD's perspective
```

Assertions: A is still in cache (same hash), old B and C hashes are gone, new B and C hashes are present, `diagnostics.path === "slow"`.

### Cycle 6 — --no-cache bypasses DB

**Test**: `syncCache({repoPath, noCache: true})` → `extractCommits` called, `diagnostics.path === "bypass"`, DB file not created or not modified.

### Cycle 7 — --all mode

**Deferred to 006.** `--all` is handled in `generate.ts` (calls `extractCommits` directly, not `syncCache`). No `generate.ts` exists yet in this milestone. Verified as part of 006 Render implementation.

### Cycle 8 — cache status shows stats

**Test**: After sync, CLI `cache status` in repo → prints `commitCount`, `lastRunAt` (ISO timestamp), `lastHead` (SHA).

### Cycle 9 — cache clear drops DB

**Test**: After sync, CLI `cache clear` → DB file deleted or all rows removed. Next `cache status` shows all zeros.

### Cycle 10 — Rebase + git gc doesn't break cache

**Test**: Cache A → B → C. Rewrite history then gc prune:

```typescript
repo.git("commit", "--amend", "--no-edit");  // rewrites HEAD's hash
repo.git("gc", "--prune=now");               // prunes old loose objects
const result = await syncCache({ repoPath: repo.dir });
expect(result.diagnostics.path).toBe("slow");
expect(result.commits.map(c => c.hash)).not.toContain(oldHash);
```

This exercises the real concern: orphaned objects are gone from git, but cache still returns all reachable commits via hash-based lookup.

## Acceptance criteria

- [x] 9 of 10 RED→GREEN cycles pass (cycle 7 deferred to 006)
- [x] `npm run build` succeeds with externalized `better-sqlite3`
- [x] `npm test` — all existing tests still GREEN (74 total)
- [x] Manual smoke: `node dist/bin/commit-insights.js cache status` in a git repo → prints stats
- [x] Interface signatures match the approved design above

## Cache design rules (locked in grill)

- `syncCache` returns ALL commits, caller post-filters `authorFilter`
- Cache stores raw unfiltered commits — filtering happens at analysis time
- `--all` bypasses `syncCache` entirely (calls `extractCommits` directly)
- `authorFilter` only used on `noCache: true` path (git-level efficiency)
- DB path: `join(repoPath, ".git", "commit-insights", "cache.db")` — v1 only
- Worktree detection: `statSync(gitEntry).isFile()` → throw error suggesting `--no-cache` bypass
- No migration support — `schema_version` mismatch → drop + rebuild from scratch
- `bulkInsert` always wrapped in `db.transaction()`, not just slow path
- `readMeta` returns typed `{ lastHead: string | null, lastRunAt: string | null, schemaVersion: number | null }`
- `CachePath` is union type: `"fresh" | "fast" | "slow" | "hit" | "bypass"`
- `extractCommitsByHash` uses positional args with `BATCH_SIZE=500`, not `--stdin`
