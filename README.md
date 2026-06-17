# commit-insights

Generate a local git contribution dashboard (static HTML) from your repo's commit history. Optional AI-written narrative summaries via BYOK/BYOM providers.

```
npm install -g commit-insights
commit-insights generate .
open dashboard.html
```

## Features

- **Self-contained dashboard** — single `dashboard.html`, dark theme, Chart.js charts, works offline
- **Zero network by default** — no data ever leaves your machine unless you explicitly opt in
- **Optional AI narratives** — aggregated stats sent to Anthropic, OpenAI, or local Ollama (`--narrative`)
- **Incremental** — SQLite cache reuses historical data, only extracts new commits
- **Git-native** — respects `.gitignore`, lives inside `.git/` for cache, uses `git log -z` under the hood

## Privacy

`commit-insights` makes zero external network calls unless you pass `--narrative`. The core dashboard (statistics, charts, tables) is generated entirely from your local git history. No data is collected, no telemetry, no analytics.

When AI narratives are enabled (`--narrative`), only **aggregated statistics** (commit counts, type breakdowns, top tickets) are sent to the configured provider — never raw commit messages, diffs, or code.

## Usage

```
commit-insights generate [path]                 generate contribution dashboard
commit-insights cache status|clear [path]       inspect or clear cache
commit-insights config [--json] [--explain]     show effective config

Options:
  --author <pattern>          filter commits by author
  --all                       bypass cache, full reconciliation
  --out <file>                output path (default: dashboard.html)
  --narrative                 include AI-written narrative summary
  --narrative-audience <type> manager | retro | resume | self
  --narrative-length <len>    short | normal
  --strict                    exit non-zero if AI narrative fails
  --no-cache                  skip cache, re-extract everything
  --cdn-charts                load Chart.js from CDN (requires internet)
```

## Configuration (precedence)

Lowest → Highest:

1. **Built-in defaults**
2. **Repo config** (`.commit-insights.json` — team-shared: AI provider/baseUrl/model, areas, ticket patterns)
3. **User config** (`~/.config/commit-insights/config.json` — personal: AI provider/model)
4. **Environment variables** (`ANTHROPIC_API_KEY`, `OPENAI_API_KEY`, `GOOGLE_API_KEY`, `AI_MODEL`, `AI_BASE_URL`, `OLLAMA_HOST`)
5. **CLI flags**

> User config beats repo config — your AI provider preference shouldn't be forced by a team config file.

API keys are read from a `.env` file in the current working directory (gitignored via `.gitignore`). Never commit API keys to your repo config.

```json
{
  "ai": {
    "provider": "ollama",
    "model": "llama3.2"
  },
  "areas": {
    "src/components/": "UI",
    "src/api/": "Backend"
  },
  "ticketPattern": "PROJ-\\d+"
}
```

## AI providers

| Provider | Default model | Key required |
|----------|--------------|--------------|
| Anthropic | `claude-sonnet-4-20250514` | `ANTHROPIC_API_KEY` |
| OpenAI | `gpt-4o` | `OPENAI_API_KEY` |
| Gemini | `gemini-2.0-flash` | `GOOGLE_API_KEY` |
| Ollama | `llama3.2` | No key (local) |

Default models can be overridden via config (`model`) or `AI_MODEL` environment variable.

## Development

```bash
git clone https://github.com/hinedy/commit-insights
cd commit-insights
npm install

# Run from source
npm run dev -- generate .

# Build
npm run build

# Test
npm test
```

## Why not `git-insights`?

The tool is named for **commits**, not git — it works on any repo's commit history regardless of VCS, and the name avoids implying it covers all git operations (blame, reflog, etc.). The scope is contribution insight, not git insight.

---

MIT © 2026 hinedy
