import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { mkdirSync, writeFileSync, rmSync } from "fs";
import { join } from "path";
import { tmpdir } from "os";
import { loadEffectiveConfig, ConfigError } from "../src/config/index.js";

function tempDir(): string {
  const dir = join(
    tmpdir(),
    `ci-test-${Math.random().toString(36).slice(2, 10)}`,
  );
  mkdirSync(dir, { recursive: true });
  return dir;
}

describe("config system", () => {
  let dir: string;

  beforeEach(() => {
    dir = tempDir();
  });

  afterEach(() => {
    rmSync(dir, { recursive: true, force: true });
  });

  it("returns defaults when no config files present", () => {
    const { config } = loadEffectiveConfig(dir);
    expect(config.ai).toEqual({});
    expect(config.areas).toEqual({});
    expect(config.ticketPattern).toBe("[A-Z][A-Z0-9]*-\\d+");
    expect(config.compiledTicketPattern).toBeInstanceOf(RegExp);
    expect(config.compiledTicketPattern.test("ABC-123")).toBe(true);
    expect(config.ignorePaths).toEqual([]);
  });

  it("loads repo config from .commit-insights.json", () => {
    writeFileSync(
      join(dir, ".commit-insights.json"),
      JSON.stringify({ ai: { provider: "ollama" } }),
    );
    const { config } = loadEffectiveConfig(dir);
    expect(config.ai.provider).toBe("ollama");
  });

  it("user config overrides repo config (inverted from git)", () => {
    writeFileSync(
      join(dir, ".commit-insights.json"),
      JSON.stringify({ ai: { provider: "ollama" } }),
    );
    const userDir = tempDir();
    const userConfigPath = join(userDir, "config.json");
    writeFileSync(
      userConfigPath,
      JSON.stringify({ ai: { provider: "anthropic" } }),
    );
    const { config } = loadEffectiveConfig(dir, undefined, {
      userConfigPath,
    });
    expect(config.ai.provider).toBe("anthropic");
    rmSync(userDir, { recursive: true, force: true });
  });

  it("CLI overrides merge into ai sub-object without wiping existing keys", () => {
    writeFileSync(
      join(dir, ".commit-insights.json"),
      JSON.stringify({ ai: { provider: "openai" } }),
    );
    const { config } = loadEffectiveConfig(dir, { ai: { model: "gpt-4" } });
    expect(config.ai.provider).toBe("openai");
    expect(config.ai.model).toBe("gpt-4");
  });

  it("OLLAMA_HOST env var sets ai.baseUrl", () => {
    const orig = process.env.OLLAMA_HOST;
    process.env.OLLAMA_HOST = "http://custom:8080";
    try {
      const { config } = loadEffectiveConfig(dir);
      expect(config.ai.baseUrl).toBe("http://custom:8080");
    } finally {
      process.env.OLLAMA_HOST = orig;
    }
  });

  it("OPENAI_API_KEY env var sets ai.apiKey", () => {
    const orig = process.env.OPENAI_API_KEY;
    process.env.OPENAI_API_KEY = "sk-test123";
    try {
      const { config } = loadEffectiveConfig(dir);
      expect(config.ai.apiKey).toBe("sk-test123");
    } finally {
      process.env.OPENAI_API_KEY = orig;
    }
  });

  it("throws ConfigError on unknown key with file path in message", () => {
    writeFileSync(
      join(dir, ".commit-insights.json"),
      JSON.stringify({ unknownKey: true }),
    );
    expect(() => loadEffectiveConfig(dir)).toThrow(ConfigError);
    expect(() => loadEffectiveConfig(dir)).toThrow(/\.commit-insights\.json/);
  });

  it("throws ConfigError on invalid ticketPattern regex", () => {
    writeFileSync(
      join(dir, ".commit-insights.json"),
      JSON.stringify({ ticketPattern: "[" }),
    );
    expect(() => loadEffectiveConfig(dir)).toThrow(ConfigError);
  });

  it("ignorePaths defaults to empty array when not set", () => {
    const { config } = loadEffectiveConfig(dir);
    expect(config.ignorePaths).toEqual([]);
  });

  it("ignorePaths can be overridden from repo config", () => {
    writeFileSync(
      join(dir, ".commit-insights.json"),
      JSON.stringify({ ignorePaths: ["dist/", "node_modules/"] }),
    );
    const { config } = loadEffectiveConfig(dir);
    expect(config.ignorePaths).toEqual(["dist/", "node_modules/"]);
  });

  it("provenance tracks which layer set each key", () => {
    writeFileSync(
      join(dir, ".commit-insights.json"),
      JSON.stringify({ ai: { provider: "ollama" } }),
    );
    const { provenance } = loadEffectiveConfig(dir, {
      ai: { model: "llama3" },
    });
    expect(provenance["ai.provider"].layer).toBe("repo");
    expect(provenance["ai.model"].layer).toBe("cli");
    expect(provenance["ticketPattern"].layer).toBe("defaults");
    expect(provenance["areas"].layer).toBe("defaults");
    expect(provenance["ignorePaths"].layer).toBe("defaults");
  });

  it("compiledTicketPattern works with extractTickets", async () => {
    const { extractTickets } = await import("../src/analyze/tickets.js");
    const { config } = loadEffectiveConfig(dir);
    const commits = [
      {
        hash: "abc",
        parents: [],
        authorName: "A",
        authorEmail: "a@b.com",
        date: "2024-01-01",
        subject: "Fix PROJ-123 bug",
        body: "",
      },
    ];
    const result = extractTickets(commits, config.compiledTicketPattern);
    expect(result.counts["PROJ-123"]).toBe(1);
  });
});
