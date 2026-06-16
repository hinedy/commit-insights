import { execFile } from "node:child_process";
import { promisify } from "node:util";
import type { Commit } from "./types";

const asyncExecFile = promisify(execFile);

export function parseCommit(line: string): Commit {
  const [hash, parents, authorName, authorEmail, date, subject, body] =
    line.split("\x1f");

  return {
    hash,
    parents: parents ? parents.split(" ").filter(Boolean) : [],
    authorName,
    authorEmail,
    date,
    subject,
    body: body?.replace(/\n+$/, "") ?? "",
  };
}

export async function extractCommits(
  repoPath: string,
  authorFilter?: string,
): Promise<Commit[]> {
  let stdout: string;
  try {
    const args = [
      "log",
      "-z",
      "--pretty=format:%H\x1f%P\x1f%an\x1f%ae\x1f%ad\x1f%s\x1f%b",
      "--date=short",
    ];
    if (authorFilter) args.push("--author", authorFilter);
    const result = await asyncExecFile("git", args,
      {
        cwd: repoPath,
        encoding: "utf-8",
        maxBuffer: 50 * 1024 * 1024,
      },
    );
    stdout = result.stdout;
  } catch (err: unknown) {
    const execErr = err as NodeJS.ErrnoException & { stderr?: string };
    if (execErr.code === 128 && execErr.stderr?.includes("does not have any commits yet")) {
      return [];
    }
    throw err;
  }

  if (!stdout) return [];

  const records = stdout.split("\0").filter(Boolean);
  return records.map(parseCommit);
}
