import { execFile, execFileSync } from "node:child_process";
import { promisify } from "node:util";
import { existsSync, mkdirSync, rmSync, statSync } from "node:fs";
import { join, dirname } from "node:path";
import Database from "better-sqlite3";
import { extractCommits, parseCommit } from "../extract/gitLog";
import type { Commit } from "../extract/types";

const asyncExecFile = promisify(execFile);

export interface SyncCacheOpts {
  repoPath: string;
  noCache?: boolean;
  authorFilter?: string;
}

export type CachePath = "fresh" | "fast" | "slow" | "hit" | "bypass";

export interface CacheDiagnostics {
  path: CachePath;
}

export interface SyncResult {
  commits: Commit[];
  diagnostics: CacheDiagnostics;
}

export interface CacheStats {
  commitCount: number;
  lastRunAt: string | null;
  lastHead: string | null;
  dbSizeBytes: number;
}

const CURRENT_SCHEMA_VERSION = 1;
const BATCH_SIZE = 500;

function getDbPath(repoPath: string): string {
  const gitEntry = join(repoPath, ".git");
  if (!existsSync(gitEntry)) {
    throw new Error(`Not a git repository: ${repoPath}`);
  }
  if (statSync(gitEntry).isFile()) {
    throw new Error("Worktrees not supported yet. Use --no-cache to bypass.");
  }
  return join(gitEntry, "commit-insights", "cache.db");
}

function getHeadSha(repoPath: string): string {
  try {
    return execFileSync("git", ["rev-parse", "HEAD"], {
      cwd: repoPath,
      encoding: "utf-8",
      stdio: ["pipe", "pipe", "pipe"],
    }).trim();
  } catch {
    return "";
  }
}

function isAncestor(ancestor: string, descendant: string, repoPath: string): boolean {
  try {
    execFileSync("git", ["merge-base", "--is-ancestor", ancestor, descendant], {
      cwd: repoPath,
      stdio: ["pipe", "pipe", "pipe"],
    });
    return true;
  } catch {
    return false;
  }
}

async function extractCommitsInRange(repoPath: string, range: string): Promise<Commit[]> {
  const { stdout } = await asyncExecFile("git", [
    "log", "-z", "--pretty=format:%H\x1f%P\x1f%an\x1f%ae\x1f%ad\x1f%s\x1f%b",
    "--date=short", range,
  ], { cwd: repoPath, encoding: "utf-8", maxBuffer: 50 * 1024 * 1024 });
  if (!stdout) return [];
  return stdout.split("\0").filter(Boolean).map(parseCommit);
}

function gitLogHashesOnly(repoPath: string): Set<string> {
  const stdout = execFileSync("git", ["log", "--format=%H", "-z", "HEAD"], {
    cwd: repoPath,
    encoding: "utf-8",
    stdio: ["pipe", "pipe", "pipe"],
  });
  return new Set(stdout.split("\0").filter(Boolean));
}

async function extractCommitsByHash(repoPath: string, hashes: Set<string>): Promise<Commit[]> {
  const arr = Array.from(hashes);
  const commits: Commit[] = [];
  for (let i = 0; i < arr.length; i += BATCH_SIZE) {
    const batch = arr.slice(i, i + BATCH_SIZE);
    const { stdout } = await asyncExecFile("git", [
      "log", "--no-walk", "-z", "--pretty=format:%H\x1f%P\x1f%an\x1f%ae\x1f%ad\x1f%s\x1f%b",
      "--date=short", ...batch,
    ], { cwd: repoPath, encoding: "utf-8", maxBuffer: 50 * 1024 * 1024 });
    if (stdout) {
      commits.push(...stdout.split("\0").filter(Boolean).map(parseCommit));
    }
  }
  return commits;
}

function ensureSchema(db: Database.Database): void {
  db.exec(`
    CREATE TABLE IF NOT EXISTS commits (
      hash          TEXT PRIMARY KEY,
      parents       TEXT,
      author_name   TEXT,
      author_email  TEXT,
      date          TEXT,
      subject       TEXT,
      body          TEXT,
      extracted_at  TEXT
    );
    CREATE TABLE IF NOT EXISTS meta (
      key   TEXT PRIMARY KEY,
      value TEXT
    );
  `);
}

interface Meta {
  lastHead: string | null;
  lastRunAt: string | null;
  schemaVersion: number | null;
}

function readMeta(db: Database.Database): Meta {
  const rows = db.prepare("SELECT key, value FROM meta").all() as { key: string; value: string }[];
  const map = new Map(rows.map((r) => [r.key, r.value]));
  return {
    lastHead: map.get("last_head") ?? null,
    lastRunAt: map.get("last_run_at") ?? null,
    schemaVersion: map.has("schema_version") ? Number(map.get("schema_version")) : null,
  };
}

function writeMeta(db: Database.Database, values: { lastHead: string; lastRunAt: string; schemaVersion: number }): void {
  const upsert = db.prepare("INSERT OR REPLACE INTO meta (key, value) VALUES (?, ?)");
  db.transaction(() => {
    upsert.run("last_head", values.lastHead);
    upsert.run("last_run_at", values.lastRunAt);
    upsert.run("schema_version", String(values.schemaVersion));
  })();
}

function updateMeta(db: Database.Database, values: { lastHead: string; lastRunAt: string }): void {
  const upsert = db.prepare("INSERT OR REPLACE INTO meta (key, value) VALUES (?, ?)");
  db.transaction(() => {
    upsert.run("last_head", values.lastHead);
    upsert.run("last_run_at", values.lastRunAt);
  })();
}

function commitToRow(c: Commit): [string, string, string, string, string, string, string, string] {
  return [
    c.hash,
    c.parents.join(" "),
    c.authorName,
    c.authorEmail,
    c.date,
    c.subject,
    c.body,
    new Date().toISOString(),
  ];
}

function rowToCommit(row: { hash: string; parents: string; author_name: string; author_email: string; date: string; subject: string; body: string }): Commit {
  return {
    hash: row.hash,
    parents: row.parents ? row.parents.split(" ").filter(Boolean) : [],
    authorName: row.author_name,
    authorEmail: row.author_email,
    date: row.date,
    subject: row.subject,
    body: row.body,
  };
}

function bulkInsert(db: Database.Database, commits: Commit[]): void {
  const insert = db.prepare(
    "INSERT OR REPLACE INTO commits (hash, parents, author_name, author_email, date, subject, body, extracted_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)"
  );
  const tx = db.transaction((rows: Commit[]) => {
    for (const c of rows) insert.run(...commitToRow(c));
  });
  tx(commits);
}

function readAllHashesFromDb(db: Database.Database): Set<string> {
  const rows = db.prepare("SELECT hash FROM commits").all() as { hash: string }[];
  return new Set(rows.map((r) => r.hash));
}

function readAllCached(db: Database.Database): Commit[] {
  return db.prepare("SELECT hash, parents, author_name, author_email, date, subject, body FROM commits ORDER BY date DESC").all().map(rowToCommit);
}

function deleteHashes(db: Database.Database, hashes: Set<string>): void {
  const del = db.prepare("DELETE FROM commits WHERE hash = ?");
  const tx = db.transaction((arr: string[]) => {
    for (const h of arr) del.run(h);
  });
  tx(Array.from(hashes));
}

export async function syncCache(opts: SyncCacheOpts): Promise<SyncResult> {
  const { repoPath, noCache } = opts;

  if (noCache) {
    const commits = await extractCommits(repoPath, opts.authorFilter);
    return { commits, diagnostics: { path: "bypass" } };
  }

  const dbPath = getDbPath(repoPath);
  mkdirSync(dirname(dbPath), { recursive: true });
  const db = new Database(dbPath);
  db.pragma("journal_mode = WAL");
  ensureSchema(db);

  const meta = readMeta(db);

  if (meta.schemaVersion === null) {
    const commits = await extractCommits(repoPath);
    const head = getHeadSha(repoPath);
    bulkInsert(db, commits);
    writeMeta(db, { lastHead: head, lastRunAt: new Date().toISOString(), schemaVersion: CURRENT_SCHEMA_VERSION });
    const allCommits = readAllCached(db);
    db.close();
    return { commits: allCommits, diagnostics: { path: "fresh" } };
  }

  if (meta.schemaVersion !== CURRENT_SCHEMA_VERSION) {
    db.close();
    rmSync(dbPath);
    return syncCache({ ...opts, noCache: false });
  }

  const head = getHeadSha(repoPath);

  if (head === meta.lastHead) {
    const commits = readAllCached(db);
    db.close();
    return { commits, diagnostics: { path: "hit" } };
  }

  if (meta.lastHead && isAncestor(meta.lastHead, head, repoPath)) {
    const newCommits = await extractCommitsInRange(repoPath, `${meta.lastHead}..HEAD`);
    if (newCommits.length > 0) {
      bulkInsert(db, newCommits);
    }
    const allCommits = readAllCached(db);
    updateMeta(db, { lastHead: head, lastRunAt: new Date().toISOString() });
    db.close();
    return { commits: allCommits, diagnostics: { path: "fast" } };
  }

  const headHashes = gitLogHashesOnly(repoPath);
  const cachedHashes = readAllHashesFromDb(db);
  const orphanHashes = new Set([...cachedHashes].filter((h) => !headHashes.has(h)));
  const newHashes = new Set([...headHashes].filter((h) => !cachedHashes.has(h)));

  if (orphanHashes.size > 0) {
    deleteHashes(db, orphanHashes);
  }
  if (newHashes.size > 0) {
    const newCommits = await extractCommitsByHash(repoPath, newHashes);
    bulkInsert(db, newCommits);
  }

  const allCommits = readAllCached(db);
  updateMeta(db, { lastHead: head, lastRunAt: new Date().toISOString() });
  db.close();
  return { commits: allCommits, diagnostics: { path: "slow" } };
}

export function getCacheStats(repoPath: string): CacheStats {
  const dbPath = getDbPath(repoPath);
  if (!existsSync(dbPath)) {
    return { commitCount: 0, lastRunAt: null, lastHead: null, dbSizeBytes: 0 };
  }
  const db = new Database(dbPath);
  try {
    const row = db.prepare("SELECT COUNT(*) as cnt FROM commits").get() as { cnt: number };
    const meta = readMeta(db);
    const stats = statSync(dbPath);
    return {
      commitCount: row.cnt,
      lastRunAt: meta.lastRunAt,
      lastHead: meta.lastHead,
      dbSizeBytes: stats.size,
    };
  } finally {
    db.close();
  }
}

export function clearCache(repoPath: string): void {
  const dbPath = getDbPath(repoPath);
  if (existsSync(dbPath)) {
    rmSync(dbPath);
  }
}

export { getDbPath };
