import { describe, it, expect, afterEach } from "vitest";
import { join } from "node:path";
import { existsSync } from "node:fs";
import Database from "better-sqlite3";
import { TestRepo } from "./helpers/testRepo";
import { syncCache, getCacheStats, clearCache } from "../src/storage/cache";

function dbPath(repoDir: string): string {
  return join(repoDir, ".git", "commit-insights", "cache.db");
}

describe("syncCache", () => {
  let repo: TestRepo;

  afterEach(() => {
    repo?.cleanup();
  });

  it("creates schema on first run", async () => {
    repo = new TestRepo();
    repo.commit({ message: "init" });

    await syncCache({ repoPath: repo.dir });

    expect(existsSync(dbPath(repo.dir))).toBe(true);
    const db = new Database(dbPath(repo.dir));
    try {
      const commitCols = db.prepare("PRAGMA table_info('commits')").all() as never[];
      expect(commitCols).toHaveLength(8);
      const metaCols = db.prepare("PRAGMA table_info('meta')").all() as never[];
      expect(metaCols).toHaveLength(2);
    } finally {
      db.close();
    }
  });

  it("inserts and returns one commit with all fields", async () => {
    repo = new TestRepo();
    const hash = repo.commit({
      message: "feat: add login",
      body: "OAuth2 login flow",
    });

    const result = await syncCache({ repoPath: repo.dir });

    expect(result.commits).toHaveLength(1);
    expect(result.commits[0].hash).toBe(hash);
    expect(result.commits[0].authorName).toBe("Test User");
    expect(result.commits[0].authorEmail).toBe("test@example.com");
    expect(result.commits[0].subject).toBe("feat: add login");
    expect(result.commits[0].body).toBe("OAuth2 login flow");
    expect(result.commits[0].parents).toEqual([]);
  });

  it("returns cached data when HEAD unchanged", async () => {
    repo = new TestRepo();
    repo.commit({ message: "init" });
    await syncCache({ repoPath: repo.dir });

    const result = await syncCache({ repoPath: repo.dir });

    expect(result.commits).toHaveLength(1);
    expect(result.diagnostics.path).toBe("hit");
  });

  it("fast path inserts linear new commit and returns both", async () => {
    repo = new TestRepo();
    repo.commit({ message: "first" });
    await syncCache({ repoPath: repo.dir });

    repo.commit({ message: "second" });
    const result = await syncCache({ repoPath: repo.dir });

    expect(result.diagnostics.path).toBe("fast");
    expect(result.commits).toHaveLength(2);
    expect(result.commits.map((c) => c.subject)).toContain("second");
  });

  it("slow path detects orphans and inserts new commits after rebase", async () => {
    repo = new TestRepo();
    const hashA = repo.commit({ message: "A" });
    const hashB = repo.commit({ message: "B" });
    const hashC = repo.commit({ message: "C" });
    await syncCache({ repoPath: repo.dir });

    repo.git("reset", "--hard", "HEAD~2");
    repo.commit({ message: "B'" });
    repo.commit({ message: "C'" });

    const result = await syncCache({ repoPath: repo.dir });

    expect(result.diagnostics.path).toBe("slow");
    expect(result.commits.length).toBeGreaterThanOrEqual(3);
    const resultHashes = result.commits.map((c) => c.hash);
    expect(resultHashes).toContain(hashA);
    expect(resultHashes).not.toContain(hashB);
    expect(resultHashes).not.toContain(hashC);
  });

  it("--no-cache bypasses database entirely", async () => {
    repo = new TestRepo();
    repo.commit({ message: "init" });

    const result = await syncCache({
      repoPath: repo.dir,
      noCache: true,
    });

    expect(result.diagnostics.path).toBe("bypass");
    expect(existsSync(dbPath(repo.dir))).toBe(false);
  });

  it("cache status shows stats after sync", async () => {
    repo = new TestRepo();
    repo.commit({ message: "init" });
    await syncCache({ repoPath: repo.dir });

    const stats = getCacheStats(repo.dir);

    expect(stats.commitCount).toBe(1);
    expect(stats.lastRunAt).toBeTruthy();
    expect(stats.lastHead).toBeTruthy();
    expect(stats.dbSizeBytes).toBeGreaterThan(0);
  });

  it("clear cache removes database file", async () => {
    repo = new TestRepo();
    repo.commit({ message: "init" });
    await syncCache({ repoPath: repo.dir });
    expect(existsSync(dbPath(repo.dir))).toBe(true);

    clearCache(repo.dir);

    expect(existsSync(dbPath(repo.dir))).toBe(false);
    const stats = getCacheStats(repo.dir);
    expect(stats.commitCount).toBe(0);
    expect(stats.lastRunAt).toBeNull();
    expect(stats.lastHead).toBeNull();
    expect(stats.dbSizeBytes).toBe(0);
  });

  it("slow path handles gc-prone old objects", async () => {
    repo = new TestRepo();
    repo.commit({ message: "A" });
    const hashB = repo.commit({ message: "B" });
    const hashC = repo.commit({ message: "C" });
    await syncCache({ repoPath: repo.dir });

    repo.git("reset", "--hard", "HEAD~2");
    repo.commit({ message: "B'" });
    repo.commit({ message: "C'" });
    repo.git("gc", "--prune=now");

    const result = await syncCache({ repoPath: repo.dir });

    expect(result.diagnostics.path).toBe("slow");
    const resultHashes = result.commits.map((c) => c.hash);
    expect(resultHashes).not.toContain(hashB);
    expect(resultHashes).not.toContain(hashC);
  });
});
