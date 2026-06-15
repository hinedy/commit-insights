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

## Acceptance criteria

- [ ] `.commit-insights.json` in repo root is loaded and merged
- [ ] `~/.config/commit-insights/config.json` is loaded and beats repo config
- [ ] CLI `--ai-model llama3` merges into `ai` sub-object without wiping `ai.provider`
- [ ] Zod validation per layer — typo'd key fails with file-path in error message
- [ ] `commit-insights config --explain` shows which layer set each key
- [ ] Config values flow to analysis functions (ticketPattern to `extractTickets`, areas to `mapAreasByFile`, ignorePaths to `mapAreasByFile`)
- [ ] `ignorePaths` defaults to `[]` in Zod schema

## Blocked by

- 003-analysis
