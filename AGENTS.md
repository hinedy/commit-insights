# AGENTS.md

## Project

`commit-insights` — CLI tool that generates a local git contribution dashboard (static HTML) from a repo's commit history. Optional AI-generated narrative summaries via BYOK/BYOM providers.

## Core Architecture Decisions

### Git log extraction (`src/extract/gitLog.ts`)
- **Format**: `git log -z --pretty=format:%H\x1f%an\x1f%ae\x1f%ad\x1f%P\x1f%s\x1f%b --date=short`
- **No trailing record separator** — the `-z` NUL terminator is sufficient; `\x1e` caused phantom empty body fields
- **Empty repo**: catch exit code 128 + "does not have any commits yet" → return `[]`
- **Fields**: hash, authorName, authorEmail, date, parents, subject, body — `\x1f`-separated, `\0`-separated records
- `parents` stored as space-separated hashes (raw `%P` output), split into `string[]` by consumer
- Edge cases tested: empty body, multi-line body with blank lines, merge commits, binary files in tree, detached HEAD
- **`authorFilter`**: parameter on `extractCommits()` — only used for `--no-cache` runs. Cache population always extracts without filter. Cache reads apply `authorFilter` as post-filter.

### Cache (`src/storage/cache.ts`)
- **DB**: `better-sqlite3` at `.git/commit-insights/cache.db`
- **Schema**: `commits(hash PK, parents TEXT, author_name, author_email, date, subject, body, extracted_at)`, `meta(key PK, value)`
- **`parents` stored as space-separated hashes** (same format as `%P` output), split into `string[]` by consumer
- **Cache stores raw unfiltered commits** — all filtering (author, date, tickets, areas) applied at analysis time
- **Incremental sync**: `isAncestor` gate (`git merge-base --is-ancestor`) distinguishes linear history (fast: `git log $last..HEAD`) from rebase/force-push (slow: hash-set diff, delete orphans)
- **Migration strategy**: no migration support — use `schema_version` key in `meta` table. On mismatch: drop + rebuild from scratch
- **`--all` mode**: bypasses cache entirely (full reconciliation each run)
- **`--no-cache` flag**: skip cache, re-extract everything

### Config system (`src/config/`)
- **Layers** (lowest→highest precedence): built-in defaults → repo config (`.commit-insights.json`, team-shared: areas, ticket regex) → user config (`~/.config/commit-insights/config.json`, personal: AI provider/model) → env vars (API keys only: `OPENAI_API_KEY`, `ANTHROPIC_API_KEY`, `OLLAMA_HOST`) → CLI flags
- **Standard provider env vars**: `OPENAI_API_KEY`, `ANTHROPIC_API_KEY`, `OLLAMA_HOST` (default `http://localhost:11434`). No `COMMIT_INSIGHTS_*` prefixed vars.
- **Inverted from git**: user config beats repo config — personal AI preferences shouldn't be forceable by team config
- **Merge**: recursive `deepMerge` with `undefined`-skip — CLI `--ai-model` merges into `ai` sub-object, doesn't wipe it
- **Validation**: each layer validated against same Zod `.strict()` schema — per-layer error messages point to the exact file with the typo
- **Debugging**: `commit-insights config --explain` shows provenance per key

### AI layer (`src/ai/providers/`)
- **Interface**: `AIProvider.generate()` returns `Result<{ text: string }, AIError>` — TypeScript forces `.ok` check before access
- **Error taxonomy**: `config`, `auth`, `network`, `rate_limit`, `server`, `empty_response`
- **Constructor throws on missing API key** (config error, caught once at creation), `generate()` returns Result for runtime failures
- **SDK strategy**: Official Anthropic + OpenAI SDKs as optional peer dependencies + dynamic `import()`. Clear install hint on missing SDK. Ollama uses raw `fetch`.
- **No streaming**: spinner/progress line on stderr, single-shot response
- **Response format**: plain text prose — split on `\n\n` into `<p>` tags; no markdown parsing
- **No retry logic**: fail fast, warn, move on
- **Ollama**: `ECONNREFUSED` → "is Ollama running?", 404 → "model not found, try `ollama pull <model>`"
- **Testing**: `undici.MockAgent` at HTTP layer, `disableNetConnect()` to prevent accidental real calls

### Narrative prompts (`src/ai/narratives.ts`)
- **Only aggregated stats sent to model** — no raw commit messages or diffs
- **Payload**: `StatsPayload` — totals, monthly timeline, type breakdown, top-15 tickets, ticket summary (not all tickets), reviewers
- **Single template** (JSON in fenced code block), not provider-specific — only diverge if evidence warrants
- **Audience variants**: manager / retro / resume / self (default)
- **`--narrative` is explicit opt-in** — provider config alone never triggers an API call
- **On failure**: narrative section omitted entirely from dashboard (no broken placeholder), warning on stderr

### Report generation (`src/report/`)
- **Output**: single self-contained `dashboard.html` — Chart.js inlined, CSS inlined, no external assets
- **Output location**: current working directory (CWD where command was run), not repo root. `--out` overrides.
- **Charts**: pre-computed aggregates only (monthly buckets, type counts, top-N lists) — not raw commit arrays
- **Dashboard size**: ~250-300KB regardless of repo size (dominated by vendored Chart.js)
- **XSS prevention**: `escapeHtml()` for HTML text content; `jsonForScript()` escapes `</script>`, `U+2028`, `U+2029` in JSON
- **`--cdn-charts`**: opt-in flag with offline warning
- **`--export-json`** (future): separate artifact for raw data drill-down, not baked into HTML
- **Chart.js vendoring**: pre-build script (`scripts/vendor-chartjs.mjs`) generates `src/report/templates/chartjs-bundle.generated.ts` with `export const CHART_JS = '...'`. Generated file is gitignored.
- **Composable sections**: pure `(data) => string` functions per page region — header, metric cards, charts, tables, narrative, footer. Assembled by `compose()` in `dashboard.html.ts`. Dark theme, responsive grid, system font stack. See `.issues/006-render.md` for full UI design.
- **Typography**: system font stack for body; `ui-monospace, "SFMono-Regular", Consolas, monospace` for hashes, ticket IDs, type badges

### Testing

| Category | Approach | Key patterns |
|----------|----------|-------------|
| Extraction | `TestRepo` class: temp dir, `git init`, local config, procedural commits | `beforeEach`/`afterEach` clean isolation |
| Analysis | Vitest, pure function tests over known commit data | No fixtures — construct input arrays inline |
| AI providers | `undici.MockAgent`, HTTP-level, `disableNetConnect()` | Real SDK runs, realistic error shapes exercised |
| CLI integration | Smoke test compiled artifact in CI | `npm run build` then `node dist/bin/commit-insights.js generate .` |

### Build & dev workflow
- **Dev**: `npm run dev -- generate <path>` (runs `tsx src/bin/commit-insights.ts`)
- **Build**: `tsup src/bin/commit-insights.ts src/index.ts --format esm --dts --clean`
- **Publish**: `prepublishOnly` runs `build`, `files: ["dist"]` in package.json
- **Shebang**: `#!/usr/bin/env node`, preserved by tsup
- **Test**: `vitest`

## Project structure

```
commit-insights/
├── bin/commit-insights.ts           # shebang entry → cli.ts
├── scripts/
│   └── vendor-chartjs.mjs          # prebuild: generate Chart.js bundle as TS
├── tsup.config.ts                  # tsup config with __VERSION__ define
├── src/
│   ├── cli.ts                    # commander, routes to commands/
│   ├── commands/
│   │   ├── generate.ts
│   │   ├── cache.ts
│   │   └── config.ts
│   ├── config/
│   │   ├── index.ts              # loadEffectiveConfig(), layer merging
│   │   ├── schema.ts             # Zod schemas per layer
│   │   └── merge.ts              # deepMerge, provenance tracking
│   ├── extract/
│   │   ├── index.ts              # re-exports
│   │   ├── gitLog.ts             # extractCommits()
│   │   └── types.ts              # Commit, FileChange (parents: string[])
│   ├── analyze/
│   │   ├── classify.ts           # conventional-commit type detection
│   │   ├── tickets.ts            # ticket/issue ref extraction
│   │   ├── timeline.ts           # monthly/weekly aggregation
│   │   ├── areas.ts              # file/directory area mapping
│   │   └── reviewers.ts          # Co-authored-by / Approved-by → collaborations counts
│   ├── ai/
│   │   ├── providers/
│   │   │   ├── types.ts          # AIProvider, AIError, AIConfig
│   │   │   ├── anthropic.ts
│   │   │   ├── openai.ts
│   │   │   ├── ollama.ts
│   │   │   └── index.ts          # createProvider()
│   │   ├── narratives.ts         # buildPrompt(), StatsPayload
│   │   └── prompts.ts            # system prompt templates
│   ├── report/
│   │   ├── templates/
│   │   │   ├── dashboard.html.ts # template-literal HTML
│   │   │   ├── chartjs-bundle.generated.ts  # generated, gitignored
│   │   │   └── sections/         # pure (data) => string section functions
│   │   ├── charts.ts             # data shaping for Chart.js
│   │   ├── render.ts             # write dashboard.html
│   │   └── escape.ts             # escapeHtml(), jsonForScript()
│   └── storage/
│       └── cache.ts              # SQLite cache (commits: parents TEXT)
├── tests/
│   ├── helpers/
│   │   └── testRepo.ts           # TestRepo class
│   ├── extract.test.ts
│   ├── classify.test.ts
│   ├── report.test.ts
│   └── ai/
│       ├── anthropic.test.ts
│       └── ollama.test.ts
```

## Key constraints for implementation
- `--narrative` is explicit opt-in; provider config alone never triggers API calls
- Dashboard must render offline; Chart.js inlined
- Cache stores raw unfiltered commits; all filtering at analysis time
- User config beats repo config (AI preferences are personal)
- AI errors degrade gracefully — warn on stderr, dashboard still written, exit 0 (exit 1 with `--strict`)
