import { AIErrorKind } from "./types";

export function classifyAnthropicError(err: any): AIErrorKind {
  if (err.status === 401) return "auth";
  if (err.status === 429) return "rate_limit";
  if (err.status && err.status >= 500) return "server";
  if (err.name === "APIConnectionError" || err.code === "ECONNREFUSED") return "network";
  if (err.name === "APIError" && err.status === 400) return "config";
  return "unknown";
}
