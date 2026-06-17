import { describe, it, expect } from "vitest";
import { spawnSync } from "node:child_process";
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { TestRepo } from "./helpers/testRepo";

const CLI = join(process.cwd(), "dist", "bin", "commit-insights.js");

function bodyHtml(html: string): string {
  const idx = html.indexOf("</style>");
  return idx >= 0 ? html.slice(idx + 8) : html;
}

describe("generate --narrative CLI integration", () => {
  it("warns and exits 0 when --narrative used without AI provider", () => {
    const repo = new TestRepo();
    try {
      repo.commit({ message: "feat: initial commit" });
      const output = join(repo.dir, "dashboard.html");
      const result = spawnSync("node", [CLI, "generate", repo.dir, "--narrative", "--out", output], {
        encoding: "utf-8",
        stdio: ["pipe", "pipe", "pipe"],
      });
      expect(result.status).toBe(0);
      expect(result.stderr).toContain("Warning");
      expect(existsSync(output)).toBe(true);
    } finally {
      repo.cleanup();
    }
  });

  it("exits 1 when --narrative --strict used without AI provider", () => {
    const repo = new TestRepo();
    try {
      repo.commit({ message: "feat: initial commit" });
      const output = join(repo.dir, "dashboard.html");
      const result = spawnSync("node", [CLI, "generate", repo.dir, "--narrative", "--strict", "--out", output], {
        encoding: "utf-8",
        stdio: ["pipe", "pipe", "pipe"],
      });
      expect(result.status).toBe(1);
      expect(result.stderr).toContain("Warning");
    } finally {
      repo.cleanup();
    }
  });

  it("writes dashboard without narrative section when AI fails", () => {
    const repo = new TestRepo();
    try {
      repo.commit({ message: "feat: initial commit" });
      writeFileSync(
        join(repo.dir, ".commit-insights.json"),
        JSON.stringify({ ai: { provider: "ollama" } }),
      );
      const output = join(repo.dir, "dashboard.html");
      const result = spawnSync("node", [CLI, "generate", repo.dir, "--narrative", "--out", output], {
        encoding: "utf-8",
        stdio: ["pipe", "pipe", "pipe"],
        env: {
          ...process.env,
          OLLAMA_HOST: "http://localhost:1",
        },
      });
      expect(result.status).toBe(0);
      expect(existsSync(output)).toBe(true);
      const body = bodyHtml(readFileSync(output, "utf-8"));
      expect(body).not.toContain("narrative-card");
      expect(result.stderr).toContain("Warning");
    } finally {
      repo.cleanup();
    }
  });
});
