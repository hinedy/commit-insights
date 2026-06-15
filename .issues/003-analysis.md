## What to build

Implement pure-function analysis transforms over `Commit[]` — conventional-commit type detection, ticket/issue reference extraction, monthly timeline aggregation, directory-based area mapping, and reviewer parsing (Co-authored-by / Approved-by).

- `src/analyze/classify.ts`: detect conventional-commit type (feat, fix, chore, docs, refactor, test, etc.) from subject
- `src/analyze/tickets.ts`: extract ticket references (e.g., `PROJ-123`) from subject + body using configurable regex
- `src/analyze/timeline.ts`: aggregate commits into monthly/weekly buckets
- `src/analyze/areas.ts`: assign commits to areas based on file-path prefixes
- `src/analyze/reviewers.ts`: parse `Co-authored-by` and `Approved-by` trailers from commit body
- All functions are pure — take `Commit[]` + config, return stats objects. Testable with hand-written fixture arrays (no real git needed).

## Acceptance criteria

- [ ] `classifyCommits(commits)` returns type counts and per-commit type labels
- [ ] `extractTickets(commits, regex)` returns ticket refs per commit and aggregate top-N list
- [ ] `buildTimeline(commits)` returns monthly commit counts for the period
- [ ] `mapAreas(commits, areaConfig)` assigns each commit to a named area by path prefix
- [ ] `parseReviewers(commits)` extracts Co-authored-by and Approved-by names
- [ ] All functions tested with inline fixture arrays (no TestRepo needed)

## Blocked by

- 002-extraction
