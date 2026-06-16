import { existsSync } from "node:fs";
import { describe, it, expect, afterEach } from "vitest";
import { TestRepo } from "./helpers/testRepo";
import { extractCommits } from "../src/extract/gitLog";
import type { Commit } from "../src/extract/types";

describe("extractCommits", () => {
  let repo: TestRepo;

  afterEach(() => {
    repo?.cleanup();
  });

  it("returns commit with correct hash, author, date, subject, body", async () => {
    repo = new TestRepo();
    const hash = repo.commit({
      message: "feat: add login",
      body: "Implements OAuth2 login flow",
    });

    const commits: Commit[] = await extractCommits(repo.dir);

    expect(commits).toHaveLength(1);
    expect(commits[0].hash).toBe(hash);
    expect(commits[0].authorName).toBe("Test User");
    expect(commits[0].authorEmail).toBe("test@example.com");
    expect(commits[0].date).toBe(new Date().toISOString().slice(0, 10));
    expect(commits[0].subject).toBe("feat: add login");
    expect(commits[0].body).toBe("Implements OAuth2 login flow");
  });

  it("returns empty body when commit has no body", async () => {
    repo = new TestRepo();
    repo.commit({ message: "feat: no body" });

    const commits: Commit[] = await extractCommits(repo.dir);

    expect(commits).toHaveLength(1);
    expect(commits[0].body).toBe("");
  });

  it("preserves multi-line body with blank lines, strips trailing newlines", async () => {
    repo = new TestRepo();
    repo.commit({ message: "feat: multi-line", body: "Line one.\n\nLine two.\n\n" });

    const commits: Commit[] = await extractCommits(repo.dir);

    expect(commits[0].body).toBe("Line one.\n\nLine two.");
  });

  it("returns empty array for empty repo", async () => {
    repo = new TestRepo();

    const commits: Commit[] = await extractCommits(repo.dir);

    expect(commits).toEqual([]);
  });

  it("returns zero parents for root commit", async () => {
    repo = new TestRepo();
    repo.commit({ message: "root" });

    const commits: Commit[] = await extractCommits(repo.dir);

    expect(commits[0].parents).toEqual([]);
  });

  it("returns two parents for merge commit", async () => {
    repo = new TestRepo();
    repo.commit({ message: "first commit" });
    repo.branch("feature");
    repo.checkout("feature");
    repo.commit({ message: "feature commit" });
    repo.checkout("master");
    repo.merge("feature");

    const commits: Commit[] = await extractCommits(repo.dir);

    const mergeCommit = commits.find((c) => c.parents.length >= 2);
    expect(mergeCommit).toBeDefined();
    expect(mergeCommit!.parents).toHaveLength(2);
  });

  it("includes Merge in merge commit subject", async () => {
    repo = new TestRepo();
    repo.commit({ message: "first commit" });
    repo.branch("feature");
    repo.checkout("feature");
    repo.commit({ message: "feature commit" });
    repo.checkout("master");
    repo.merge("feature");

    const commits: Commit[] = await extractCommits(repo.dir);

    const mergeCommit = commits.find((c) => c.parents.length >= 2);
    expect(mergeCommit!.subject).toMatch(/^Merge /);
  });

  it("extracts commit with binary files", async () => {
    repo = new TestRepo();
    repo.commit({
      message: "add binary",
      files: { "logo.png": Buffer.from([0x89, 0x50, 0x4e, 0x47]) },
    });

    const commits: Commit[] = await extractCommits(repo.dir);

    expect(commits).toHaveLength(1);
    expect(commits[0].subject).toBe("add binary");
  });

  it("works in detached HEAD state", async () => {
    repo = new TestRepo();
    repo.commit({ message: "first" });
    const firstHash = repo.git("rev-parse", "HEAD");
    repo.commit({ message: "second" });
    repo.checkout(firstHash);

    const commits: Commit[] = await extractCommits(repo.dir);

    expect(commits).toHaveLength(1);
    expect(commits[0].subject).toBe("first");
  });

  it("cleanup removes the temp directory", () => {
    const r = new TestRepo();
    r.commit({ message: "temp" });
    const dir = r.dir;
    r.cleanup();
    expect(existsSync(dir)).toBe(false);
  });
});
