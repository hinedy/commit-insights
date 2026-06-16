## What to build

Implement optional AI narrative summaries: `AIProvider` interface with Result return type, `AIError` hierarchy with classified error kinds, provider implementations (Anthropic, OpenAI, Ollama), HTTP-level tests with `undici.MockAgent`, prompt builder with 4 audience variants, and `--narrative` CLI integration with graceful degradation.

- `src/ai/providers/types.ts`: `AIProvider` interface, `AIError` class (kind: config|auth|network|rate_limit|server|empty_response|unknown), `AIResult` discriminated union
- `src/ai/providers/anthropic.ts`: `AnthropicProvider` — constructor throws on missing key, `generate()` returns `AIResult`, `classifyError()` maps SDK errors to `AIErrorKind`
- `src/ai/providers/openai.ts`: same pattern for OpenAI SDK
- `src/ai/providers/ollama.ts`: raw `fetch` to `/api/generate`, `ECONNREFUSED` → "is Ollama running?", 404 → "try `ollama pull`"
- `src/ai/providers/index.ts`: `createProvider(config)` factory — catches constructor errors, returns `{provider, error}`
- `src/ai/prompts.ts`: `buildPrompt(stats, opts)` — single template (JSON in fenced code block), audience variants (manager/retro/resume/self), length control
- `src/ai/narratives.ts`: `generateNarrative(provider, stats, opts?)` — orchestrates prompt building + provider call
- `tests/ai/anthropic.test.ts`: `MockAgent` with `disableNetConnect()`, tests for 401/429/empty_response/success
- **SDK strategy**: Official Anthropic + OpenAI SDKs as **optional peer dependencies** with dynamic `import()`. Clear install hint on missing SDK. Ollama uses raw `fetch`.
- **No streaming**: spinner/progress line on stderr, single-shot response
- **Response format**: plain text prose — split on `\n\n` into `<p>` tags; no markdown parsing
- CLI: `--narrative` flag (explicit opt-in), `--narrative-audience`, `--narrative-length`, `--strict` (exit 1 on failure)
- **Graceful degradation**: AI failure writes dashboard **without narrative section entirely** (no placeholder) + stderr warning
- **No retry logic**: fail fast, warn, move on

## Behaviors (one RED→GREEN cycle each)

| Cycle | Behavior | Detail |
|-------|----------|--------|
| 1 | AIError class | `new AIError("auth", "bad key")` → `instanceof Error`, `.kind === "auth"`, `.message === "bad key"` |
| 2 | AnthropicProvider: missing key | Constructor called without `ANTHROPIC_API_KEY` env → throws with message indicating missing key |
| 3 | AnthropicProvider: 401 → auth | MockAgent returns 401 → `Result.error` with `.kind === "auth"` |
| 4 | AnthropicProvider: 429 → rate_limit | MockAgent returns 429 → `Result.error` with `.kind === "rate_limit"` |
| 5 | AnthropicProvider: success → text | MockAgent returns `{ content: [{ type: "text", text: "summary" }] }` → `Result.ok` with `.value.text === "summary"` |
| 6 | AnthropicProvider: empty response | MockAgent returns `{ content: [] }` → `Result.error` with `.kind === "empty_response"` |
| 7 | OllamaProvider: ECONNREFUSED | Connection refused → error message includes "is Ollama running?" |
| 8 | OllamaProvider: 404 | MockAgent returns 404 → error message includes "try `ollama pull`" |
| 9 | OllamaProvider: success → text | MockAgent returns `{ response: "summary" }` → `Result.ok` with `.value.text === "summary"` |
| 10 | createProvider: valid config | `{ provider: "ollama", model: "llama3" }` with `OLLAMA_HOST` set → returns `{ provider, error: undefined }` |
| 11 | createProvider: missing key | `{ provider: "anthropic" }` without `ANTHROPIC_API_KEY` → returns `{ provider: undefined, error }` |
| 12 | buildPrompt: no raw commits | Payload `StatsPayload` contains only aggregates → no commit messages, hashes, or diffs in prompt string |
| 13 | buildPrompt: audience variants differ | `resume` variant contains different framing than `manager` variant for the same stats |
| 14 | generateNarrative: success | Provider returns text → `generateNarrative()` returns that text string |
| 15 | generateNarrative: failure → null | Provider returns error → `generateNarrative()` returns `null` |
| 16 | `--narrative` without provider | CLI with `--narrative`, no provider configured → stderr warning, exit 0 |
| 17 | `--strict` + AI failure → exit 1 | CLI with `--narrative --strict`, provider fails → exit code 1 |
| 18 | Dashboard without narrative on failure | Full `generate` run, AI fails → `dashboard.html` exists, does NOT contain narrative section |

## Acceptance criteria

- [ ] All 18 RED→GREEN cycles pass
- [ ] `MockAgent` test infrastructure prevents accidental real API calls (`disableNetConnect`)
- [ ] `--narrative` without a configured provider shows clear error on stderr
- [ ] Dashboard written with narrative section on success, without on failure
- [ ] `--strict` causes exit code 1 on AI failure; default exits 0
- [ ] Narrative only contains aggregated stats — no raw commits or diffs in prompt

## Blocked by

- 006-render (dashboard template for narrative section; cycles 16-18)
- 004-config (provider settings from config; cycles 10-11, 16)
