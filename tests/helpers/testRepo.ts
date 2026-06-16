import { execFileSync } from "node:child_process";
import { mkdtempSync, writeFileSync, rmSync, mkdirSync } from "node:fs";
import { join, dirname } from "node:path";
import { tmpdir } from "node:os";

export class TestRepo {
  readonly dir: string;

  constructor() {
    this.dir = mkdtempSync(join(tmpdir(), "commit-insights-"));
    this.git("init");
    this.git("config", "user.name", "Test User");
    this.git("config", "user.email", "test@example.com");
  }

  git(...args: string[]): string {
    return execFileSync("git", args, {
      cwd: this.dir,
      encoding: "utf-8",
      stdio: ["pipe", "pipe", "pipe"],
    }).trim();
  }

  commit(opts: {
    message: string;
    body?: string;
    files?: Record<string, string | Buffer>;
  }): string {
    const files = opts.files ?? { [`${Date.now()}.txt`]: "content" };
    for (const [name, content] of Object.entries(files)) {
      const fullPath = join(this.dir, name);
      mkdirSync(dirname(fullPath), { recursive: true });
      writeFileSync(fullPath, content);
    }
    this.git("add", "-A");
    const message = opts.body
      ? `${opts.message}\n\n${opts.body}`
      : opts.message;
    this.git("commit", "-m", message);
    return this.git("rev-parse", "HEAD");
  }

  checkout(branch: string, opts?: { orphan?: boolean }): void {
    if (opts?.orphan) {
      this.git("checkout", "--orphan", branch);
      // orphan requires a commit to become real
    } else {
      this.git("checkout", branch);
    }
  }

  branch(name: string): void {
    this.git("branch", name);
  }

  merge(branch: string): void {
    this.git("merge", "--no-ff", "--no-edit", branch);
  }

  cleanup(): void {
    rmSync(this.dir, { recursive: true, force: true });
  }
}
