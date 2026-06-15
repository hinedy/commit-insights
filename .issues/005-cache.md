## What to build

Implement incremental SQLite cache at `.git/commit-insights/cache.db`. Store raw unfiltered commits. Fast path for linear history (`git merge-base --is-ancestor`), hash-set diff for rebase/force-push reconciliation. `--no-cache` flag to skip entirely. `--all` mode bypasses cache.

- `src/storage/cache.ts`: SQLite schema (`commits` table, `meta` table), `syncCache()` with `isAncestor` gate, `reconcileFullHistory()` for rebase/force-push
- Schema: `commits(hash PK, author_name, author_email, date, subject, body, extracted_at)`, `meta(key PK, value)` — rows for `last_head`, `cache_version`, `last_run_at`
- Fast path: `git log $last_head..HEAD` when `last_head` is ancestor of `HEAD`
- Slow path: hash-only `git log HEAD` → set diff → `DELETE` orphans + `upsert` new via `git log --stdin`
- `src/commands/cache.ts`: `commit-insights cache status` (row count, last run) and `cache clear`
- `--no-cache` flag on `generate` — skip cache, raw extract every time
- `--all` mode — bypass cache, reconciliation every run

## Acceptance criteria

- [ ] First run extracts and caches all commits
- [ ] Second run on same HEAD returns instantly (no re-extraction)
- [ ] New commit added to linear history: only the new commit is extracted
- [ ] Rebase/force-push: old orphan hashes are deleted, rewritten hashes are re-extracted
- [ ] `git gc --prune=now` between runs doesn't break the cache
- [ ] `commit-insights cache status` shows commit count and last run timestamp
- [ ] `commit-insights cache clear` drops the database
- [ ] `--no-cache` extracts all commits fresh without reading/writing cache
- [ ] `--all` reconciles all branch tips (bypasses cache)

## Blocked by

- 002-extraction
