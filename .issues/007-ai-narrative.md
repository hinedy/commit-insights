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

## Acceptance criteria

- [ ] `--narrative` without a configured provider shows a clear error message
- [ ] Anthropic provider: 401 → auth error, 429 → rate_limit, tool_use-only response → empty_response, valid text → success
- [ ] OpenAI provider: same error classification pattern
- [ ] Ollama provider: ECONNREFUSED → "is Ollama running?", 404 → "try `ollama pull`"
- [ ] `MockAgent` test infrastructure prevents accidental real API calls (disableNetConnect)
- [ ] Audience prompts differ meaningfully (manager/resume/retro/self)
- [ ] Dashboard is written with narrative section on success, without on failure
- [ ] `--strict` causes exit code 1 on AI failure; default behavior exits 0
- [ ] Narrative only contains aggregated stats — no raw commit messages or diffs in prompt

## Blocked by

- 006-render (dashboard template for narrative section)
- 004-config (provider settings from config)
