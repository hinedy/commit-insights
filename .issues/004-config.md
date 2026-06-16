## What to build

Implement the layered config system: default → repo config (`.commit-insights.json`) → user config (`~/.config/commit-insights/config.json`) → env vars → CLI flags. User config beats repo config (inverted from git's model). Include per-layer Zod validation and `commit-insights config --explain` for provenance debugging.

- `src/config/schema.ts`: Zod schemas — `AppConfig`, `AIConfig`, `AreaConfig`, `.strict()` to catch typos
- `src/config/merge.ts`: `deepMerge()` with `undefined`-skip, `mergeLayersWithProvenance()` tracking which layer set each key
- `src/config/index.ts`: `loadEffectiveConfig()` — load all layers in order, validate each, deep-merge, return config + provenance
- `src/commands/config.ts`: `commit-insights config` (pretty-print), `--json`, `--explain` (per-key provenance)
- Config keys: `ai.provider`, `ai.model`, `ai.baseUrl`, `areas` (record of path→name), `ticketPattern`, `ignorePaths` (string[], default `[]` — path-boundary matching, no globs)
- Environment variables use **standard provider conventions** only:
  - `OPENAI_API_KEY` for OpenAI
  - `ANTHROPIC_API_KEY` for Anthropic
  - `OLLAMA_HOST` for Ollama (default `http://localhost:11434`)
  - No `COMMIT_INSIGHTS_*` prefixed env vars

## Behaviors (one RED→GREEN cycle each)

| Cycle | Behavior | Detail |
|-------|----------|--------|
| 1 | Defaults returned | `loadEffectiveConfig()` with no files present → `{ ai: {}, areas: {}, ticketPattern: /[A-Z][A-Z0-9]*-\d+/, ignorePaths: [] }` |
| 2 | Repo config loaded | Write `.commit-insights.json` with `{ "ai": { "provider": "ollama" } }` → effective config has `ai.provider = "ollama"` |
| 3 | User beats repo | Repo sets `ai.provider = "ollama"`, user config (`~/.config/commit-insights/config.json`) sets `ai.provider = "anthropic"` → user wins |
| 4 | CLI merges without wipe | CLI `--ai-model llama3` + repo with `{ "ai": { "provider": "openai" } }` → effective config has `provider: "openai"` + `model: "llama3"` |
| 5 | OLLAMA_HOST → ai.baseUrl | Set `OLLAMA_HOST=http://custom:8080` env → `ai.baseUrl = "http://custom:8080"` |
| 6 | Zod catches typo | Config file has `"provder"` (typo) → `ConfigError` thrown with file path in message |
| 7 | ignorePaths defaults | No `ignorePaths` in any layer → `config.ignorePaths = []` |
| 8 | `--explain` shows provenance | Repo sets `ai.provider = "ollama"`, CLI sets `--ai-model llama3` → output shows `"ai.provider → ollama (repo)"`, `"ai.model → llama3 (CLI)"` |
| 9 | Config flows to analysis | `loadEffectiveConfig()` returns `ticketPattern` → `extractTickets(commits, config.ticketPattern)` consumes it correctly |

## Acceptance criteria

- [x] All 9 RED→GREEN cycles pass
- [x] Interface signatures match the approved design above

## Blocked by

- Only cycle 9 needs 003-analysis (public interface only, not full implementation)
