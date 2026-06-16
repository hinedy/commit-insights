## What to build

Implement incremental SQLite cache at `.git/commit-insights/cache.db`. Store raw unfiltered commits. Fast path for linear history (`git merge-base --is-ancestor`), hash-set diff for rebase/force-push reconciliation. `--no-cache` flag to skip entirely. `--all` mode bypasses cache.

- `src/storage/cache.ts`: SQLite schema (`commits` table, `meta` table), `syncCache()` with `isAncestor` gate, `reconcileFullHistory()` for rebase/force-push
- Schema: `commits(hash PK, parents TEXT, author_name, author_email, date, subject, body, extracted_at)`, `meta(key PK, value)` — rows for `last_head`, `schema_version`, `last_run_at`
- `parents` stored as space-separated hashes (same format as `%P` from `git log`)
- **No migration support**: if `meta.schema_version` doesn't match the current code version, drop and rebuild the database from scratch
- Fast path: `git log $last_head..HEAD` when `last_head` is ancestor of `HEAD`
- Slow path: hash-only `git log HEAD` → set diff → `DELETE` orphans + `upsert` new via `git log --stdin`
- `src/commands/cache.ts`: `commit-insights cache status` (row count, last run) and `cache clear`
- `--no-cache` flag on `generate` — skip cache, raw extract every time
- `--all` mode — bypass cache, reconciliation every run

## Behaviors (one RED→GREEN cycle each)

| Cycle | Behavior | Detail |
|-------|----------|--------|
| 1 | Schema created on first run | `syncCache()` with new DB → `commits` and `meta` tables exist via `PRAGMA table_info` |
| 2 | Insert + retrieve one commit | Repo with 1 commit → `syncCache()` returns `Commit[]` with length 1, all fields match originals |
| 3 | Second run returns instantly | Same HEAD, second call → same commits returned, zero `git log` subprocess calls |
| 4 | Fast path: linear new commit | Cache has HEAD at hash A, one new commit B added → only B extracted, A returned from cache |
| 5 | Slow path: rebase | History rewritten (same tree, new hashes) → old orphan hashes deleted from DB, rewritten hashes inserted |
| 6 | `--no-cache` bypasses DB | Flag on `syncCache()` → `extractCommits()` called fresh, DB not read or written |
| 7 | `--all` reconciles all branch tips | Two branches with diverging commits → all branch-tip commits present in output |
| 8 | `cache status` shows stats | After sync, run `cache status` command → prints row count + `last_run_at` timestamp |
| 9 | `cache clear` drops DB | After sync, run `cache clear` → DB file deleted or all rows removed |
| 10 | `git gc` doesn't break cache | Repo with cached commits, `git gc --prune=now`, then sync → cache still returns commits successfully |

## Acceptance criteria

- [ ] All 10 RED→GREEN cycles pass
- [ ] Interface signatures match the approved design above

## Blocked by

- 002-extraction
