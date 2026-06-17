import { AIErrorKind } from "./types";

export function classifyGeminiError(err: any): AIErrorKind {
  if (err.status === 401 || err.status === 403) return "auth";
  if (err.status === 429) return "rate_limit";
  if (err.status && err.status >= 500) return "server";
  if (err.message?.includes("ECONNREFUSED") || err.message?.includes("fetch failed")) return "network";
  return "unknown";
}
