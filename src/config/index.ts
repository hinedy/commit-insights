import { readFileSync, existsSync } from "fs";
import { join } from "path";
import { homedir } from "os";
import { RawConfigSchema, type RawConfig } from "./schema";
import { mergeLayers, type ConfigLayer, type ProvenanceMap } from "./merge";
import type { AIConfig } from "./schema";

export { type ProvenanceMap };
export type { ConfigLayer };

export class ConfigError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ConfigError";
  }
}

export interface AppConfig {
  ai: AIConfig;
  areas: Record<string, string>;
  ticketPattern: string;
  compiledTicketPattern: RegExp;
  ignorePaths: string[];
}

const DEFAULT_TICKET_PATTERN = "[A-Z][A-Z0-9]*-\u005cd+";

const DEFAULT_CONFIG: RawConfig = {
  ai: {},
  areas: {},
  ticketPattern: DEFAULT_TICKET_PATTERN,
  ignorePaths: [],
};

function loadFileConfig(filePath: string): RawConfig | null {
  if (!existsSync(filePath)) return null;
  let parsed: unknown;
  try {
    const content = readFileSync(filePath, "utf-8");
    parsed = JSON.parse(content);
  } catch (err) {
    throw new ConfigError(
      `Invalid JSON in ${filePath}: ${err instanceof Error ? err.message : String(err)}`,
    );
  }
  const result = RawConfigSchema.safeParse(parsed);
  if (!result.success) {
    throw new ConfigError(
      `Invalid config in ${filePath}: ${result.error.message}`,
    );
  }
  return result.data;
}

function loadEnvConfig(): RawConfig {
  const config: RawConfig = {};
  if (process.env.OLLAMA_HOST) {
    config.ai = { ...(config.ai ?? {}), baseUrl: process.env.OLLAMA_HOST };
  }
  if (process.env.OPENAI_API_KEY) {
    config.ai = { ...(config.ai ?? {}), apiKey: process.env.OPENAI_API_KEY };
  }
  if (process.env.ANTHROPIC_API_KEY) {
    config.ai = {
      ...(config.ai ?? {}),
      apiKey: process.env.ANTHROPIC_API_KEY,
    };
  }
  if (process.env.GOOGLE_API_KEY) {
    config.ai = {
      ...(config.ai ?? {}),
      apiKey: process.env.GOOGLE_API_KEY,
    };
  }
  if (process.env.AI_MODEL) {
    config.ai = { ...(config.ai ?? {}), model: process.env.AI_MODEL };
  }
  if (process.env.AI_BASE_URL) {
    config.ai = { ...(config.ai ?? {}), baseUrl: process.env.AI_BASE_URL };
  }
  return config;
}

export function loadEffectiveConfig(
  repoPath: string,
  cliOverrides?: Partial<RawConfig>,
  testOptions?: { userConfigPath?: string },
): { config: AppConfig; provenance: ProvenanceMap } {
  const layers: Array<{
    config: RawConfig;
    layer: ConfigLayer;
    source?: string;
  }> = [{ config: DEFAULT_CONFIG, layer: "defaults" }];

  const repoConfigPath = join(repoPath, ".commit-insights.json");
  const repoConfig = loadFileConfig(repoConfigPath);
  if (repoConfig) {
    layers.push({ config: repoConfig, layer: "repo", source: repoConfigPath });
  }

  const userConfigPath =
    testOptions?.userConfigPath ??
    join(homedir(), ".config", "commit-insights", "config.json");
  const userConfig = loadFileConfig(userConfigPath);
  if (userConfig) {
    layers.push({
      config: userConfig,
      layer: "user",
      source: userConfigPath,
    });
  }

  const envConfig = loadEnvConfig();
  if (Object.keys(envConfig).length > 0) {
    layers.push({ config: envConfig, layer: "env" });
  }

  if (cliOverrides && Object.keys(cliOverrides).length > 0) {
    const cliResult = RawConfigSchema.safeParse(cliOverrides);
    if (!cliResult.success) {
      throw new ConfigError(`Invalid CLI options: ${cliResult.error.message}`);
    }
    layers.push({ config: cliResult.data, layer: "cli" });
  }

  const { config: merged, provenance } = mergeLayers(
    layers as Array<{
      config: Record<string, unknown>;
      layer: ConfigLayer;
      source?: string;
    }>,
  );

  const ticketPatternRaw =
    (merged.ticketPattern as string | undefined) ?? DEFAULT_TICKET_PATTERN;
  const compiledTicketPattern = new RegExp(ticketPatternRaw, "g");

  return {
    config: {
      ai: (merged.ai as AIConfig) ?? {},
      areas: (merged.areas as Record<string, string>) ?? {},
      ticketPattern: ticketPatternRaw,
      compiledTicketPattern,
      ignorePaths: (merged.ignorePaths as string[]) ?? [],
    },
    provenance,
  };
}
