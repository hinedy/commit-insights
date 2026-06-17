import { AIErrorKind } from "./types";

export function classifyOpenAIError(err: any): AIErrorKind {
  if (err.status === 401) return "auth";
  if (err.status === 429) return "rate_limit";
  if (err.status && err.status >= 500) return "server";
  if (err.name === "APIConnectionError" || err.code === "ECONNREFUSED") return "network";
  if (err.name === "BadRequestError") return "config";
  return "unknown";
}
