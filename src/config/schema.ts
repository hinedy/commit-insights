import { z } from "zod";

export const AIProviderSchema = z.enum(["openai", "anthropic", "ollama"]);

export const AIConfigSchema = z.object({
  provider: AIProviderSchema.optional(),
  model: z.string().optional(),
  baseUrl: z.string().optional(),
  apiKey: z.string().optional(),
}).strict();

export const RawConfigSchema = z.object({
  ai: AIConfigSchema.optional(),
  areas: z.record(z.string(), z.string()).optional(),
  ticketPattern: z.string().refine(
    (val) => {
      try {
        new RegExp(val);
        return true;
      } catch {
        return false;
      }
    },
    "Invalid regular expression pattern",
  ).optional(),
  ignorePaths: z.array(z.string()).optional(),
}).strict();

export type AIConfig = z.infer<typeof AIConfigSchema>;
export type RawConfig = z.infer<typeof RawConfigSchema>;
