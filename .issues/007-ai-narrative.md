## What to build

Implement optional AI narrative summaries: `AIProvider` interface with Result return type, `AIError` hierarchy with classified error kinds, provider implementations (Anthropic, OpenAI, Google Gemini, Ollama), HTTP-level tests with `undici.MockAgent`, prompt builder with 4 audience variants, and `--narrative` CLI integration with graceful degradation.

- `src/ai/providers/types.ts`: `AIProvider` interface, `AIError` class, `Result` type, `StatsPayload` interface

  ```typescript
  type AIErrorKind = "config" | "auth" | "network" | "rate_limit" | "server" | "empty_response" | "unknown";

  class AIError extends Error {
    kind: AIErrorKind;
    constructor(kind: AIErrorKind, message: string);
  }

  type Result<T, E> = { ok: true; value: T } | { ok: false; error: E };

  interface AIProvider {
    generate(prompt: string): Promise<Result<{ text: string }, AIError>>;
  }

  interface StatsPayload {
    totalCommits: number;
    dateRange: { from: string; to: string };
    totalAuthors: number;
    monthlyTimeline: { month: string; count: number }[];
    typeBreakdown: Record<string, number>;
    topTickets: { id: string; count: number }[];
    ticketSummary: string;
    topReviewers: { name: string; collaborations: number }[];
  }
  ```
- `src/ai/providers/anthropic.ts`: `AnthropicProvider` — constructor throws on missing apiKey, `generate()` returns `Result`, `classifyError()` maps SDK errors to `AIErrorKind`
- `src/ai/providers/openai.ts`: same pattern for OpenAI SDK
- `src/ai/providers/ollama.ts`: raw `fetch` to `/api/generate`, `ECONNREFUSED` → "is Ollama running?", 404 → "try `ollama pull`"
- `src/ai/providers/gemini.ts`: `GeminiProvider` — uses `@google/generative-ai` SDK, constructor throws on missing apiKey, `generate()` returns `Result`, `classifyError()` maps SDK errors to `AIErrorKind`
- `src/ai/providers/index.ts`: `createProvider(config)` factory — catches constructor errors, returns `{provider, error}`
- `src/ai/prompts.ts`: `buildPrompt(stats, opts)` — single template (JSON in fenced code block), audience variants (manager/retro/resume/self), length control
- `src/ai/narratives.ts`: `generateNarrative(provider, stats, opts?)` — orchestrates prompt building + provider call
- `tests/ai/anthropic.test.ts`: `MockAgent` with `disableNetConnect()`, tests for 401/429/empty_response/success
- `tests/ai/gemini.test.ts`: `MockAgent` with `disableNetConnect()`, tests for 401/429/empty_response/success
- **SDK strategy**: Official Anthropic + OpenAI + Google Generative AI SDKs as **optional peer dependencies** with dynamic `import()`. Clear install hint on missing SDK. Ollama uses raw `fetch`.
- **No streaming**: spinner/progress line on stderr, single-shot response
- **Response format**: plain text prose — splitting into `<p>` tags happens at render layer (section function), not in AI modules
- CLI: `--narrative` flag (explicit opt-in), `--narrative-audience`, `--narrative-length` (controls prompt instruction, e.g. "Write 2-3 sentences"; no hard token limit), `--strict` (exit 1 on failure)
- **Graceful degradation**: AI failure writes dashboard **without narrative section entirely** (no placeholder) + stderr warning
- **No retry logic**: fail fast, warn, move on

## Behaviors (one RED→GREEN cycle each)

| Cycle | Behavior | Detail |
|-------|----------|--------|
| 1 | AIError class | `new AIError("auth", "bad key")` → `instanceof Error`, `.kind === "auth"`, `.message === "bad key"` |
| 2 | AnthropicProvider: missing apiKey | Constructor called without `apiKey` in config → throws `AIError` with `.kind === "config"` and message indicating missing key |
| 3 | AnthropicProvider: 401 → auth | MockAgent returns 401 → `Result.error` with `.kind === "auth"` |
| 4 | AnthropicProvider: 429 → rate_limit | MockAgent returns 429 → `Result.error` with `.kind === "rate_limit"` |
| 5 | AnthropicProvider: success → text | MockAgent returns `{ content: [{ type: "text", text: "summary" }] }` → `Result.ok` with `.value.text === "summary"` |
| 6 | AnthropicProvider: empty response | MockAgent returns `{ content: [] }` → `Result.error` with `.kind === "empty_response"` |
| 6b | OpenAIProvider: missing apiKey | Constructor called without `apiKey` in config → throws `AIError` with `.kind === "config"` |
| 6c | OpenAIProvider: 401 → auth | MockAgent returns 401 → `Result.error` with `.kind === "auth"` |
| 6d | OpenAIProvider: 429 → rate_limit | MockAgent returns 429 → `Result.error` with `.kind === "rate_limit"` |
| 6e | OpenAIProvider: success → text | MockAgent returns `{ choices: [{ message: { content: "summary" } }] }` → `Result.ok` with `.value.text === "summary"` |
| 6f | OpenAIProvider: empty response | MockAgent returns `{ choices: [{ message: { content: "" } }] }` → `Result.error` with `.kind === "empty_response"` |
| 7 | OllamaProvider: ECONNREFUSED | Connection refused → error message includes "is Ollama running?" |
| 8 | OllamaProvider: 404 | MockAgent returns 404 → error message includes "try `ollama pull`" |
| 9 | OllamaProvider: success → text | MockAgent returns `{ response: "summary" }` → `Result.ok` with `.value.text === "summary"` |
| 9b | GeminiProvider: missing apiKey | Constructor called without `apiKey` in config → throws `AIError` with `.kind === "config"` |
| 9c | GeminiProvider: 401 → auth | MockAgent returns 401 → `Result.error` with `.kind === "auth"` |
| 9d | GeminiProvider: 429 → rate_limit | MockAgent returns 429 → `Result.error` with `.kind === "rate_limit"` |
| 9e | GeminiProvider: success → text | MockAgent returns `{ candidates: [{ content: { parts: [{ text: "summary" }] } }] }` → `Result.ok` with `.value.text === "summary"` |
| 9f | GeminiProvider: empty response | MockAgent returns `{ candidates: [{ content: { parts: [] } }] }` → `Result.error` with `.kind === "empty_response"` |
| 10 | createProvider: valid config | `{ provider: "ollama", model: "llama3" }` with `OLLAMA_HOST` set → returns `{ provider, error: undefined }` |
| 11 | createProvider: missing key | `{ provider: "anthropic" }` without `ANTHROPIC_API_KEY` → returns `{ provider: undefined, error }` |
| 12 | buildPrompt: no raw commits in prompt string | Serialized prompt (JSON or text) contains no commit hashes (40+ hex chars), no commit subject lines, and no file paths |
| 13 | buildPrompt: audience variants differ | `resume` variant contains different framing than `manager` variant for the same stats |
| 14 | generateNarrative: success | Provider returns text → `generateNarrative()` returns that text string |
| 15 | generateNarrative: failure → null | Provider returns error → `generateNarrative()` returns `null` |
| 15b | generateNarrative: paragraph splitting | Narrative text `"p1\n\np2\n\np3"` passes through as-is; splitting into `<p>` tags happens at render layer |
| 15c | generateNarrative: SDK not installed | Dynamic `import()` of `@anthropic-ai/sdk` fails with MODULE_NOT_FOUND → `Result.error` with `.kind === "config"` suggesting `npm install` |
| 16 | `--narrative` without provider | CLI with `--narrative`, no provider configured → stderr warning, exit 0 |
| 17 | `--strict` + AI failure → exit 1 | CLI with `--narrative --strict`, provider fails → exit code 1 |
| 18 | Dashboard without narrative on failure | Full `generate` run, AI fails → `dashboard.html` exists, does NOT contain narrative section |

## Acceptance criteria

- [x] All 29 RED→GREEN cycles pass (15 original + 5 OpenAI + 4 Gemini + 1 Ollama + 1 SDK-not-installed + 3 CLI integration)
- [x] `MockAgent` test infrastructure prevents accidental real API calls (`disableNetConnect`)
- [x] `--narrative` without a configured provider shows clear error on stderr
- [x] Dashboard written with narrative section on success, without on failure
- [x] `--strict` causes exit code 1 on AI failure; default exits 0
- [x] Narrative only contains aggregated stats — no raw commits or diffs in prompt
- [x] Missing SDK (Anthropic/OpenAI) produces a clear install hint via `Result.error` with `.kind === "config"`
- [x] `npm test -- --run` exits cleanly (no watch mode hang)

## Blocked by

- 006-render (dashboard template for narrative section; cycles 16-18)
- 004-config (provider settings from config; cycles 10-11, 16)
