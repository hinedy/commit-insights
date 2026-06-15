## What to build

Implement `extractCommits()` — safe git log extraction using `git log -z` with `\x1f` field separators. Handle empty repos (exit 128 + "no commits" → return `[]`). Build `TestRepo` helper for programmatic test repos in temp dirs.

- `src/extract/gitLog.ts`: `extractCommits(repoPath, authorFilter?)` returning `Commit[]`
- `src/extract/types.ts`: `Commit` interface (hash, authorName, authorEmail, date, subject, body)
- `tests/helpers/testRepo.ts`: `TestRepo` class — `git init` in temp dir, local config, `commit()`, `checkout()`, `merge()`, `cleanup()`
- Edge cases covered: empty body, multi-line body with blank lines, merge commits, binary files in tree, detached HEAD, empty repo (zero commits)

## Acceptance criteria

- [ ] `extractCommits` returns `Commit[]` from a real git repo
- [ ] Empty repo returns `[]` instead of throwing
- [ ] Multi-line body with blank lines preserves internal newlines, strips trailing newlines
- [ ] Merge commits appear in the output with their merge subject
- [ ] Commits with binary files in the tree don't break parsing
- [ ] Detached HEAD walks history correctly from the checked-out commit
- [ ] `TestRepo` creates isolated temp dirs, cleans up in `afterEach`

## Blocked by

- 001-scaffold
