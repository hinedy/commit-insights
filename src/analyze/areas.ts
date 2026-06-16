import { execFile } from "node:child_process";
import { promisify } from "node:util";

const asyncExecFile = promisify(execFile);

function normalizePath(p: string): string {
  return p.replace(/\\/g, "/");
}

function normalizePrefix(p: string): string {
  if (p === "") return "";
  const normalized = normalizePath(p);
  return normalized.endsWith("/") ? normalized : `${normalized}/`;
}

function normalizeIgnore(p: string): string {
  const normalized = normalizePath(p);
  if (normalized.endsWith("/")) return normalized;
  if (normalized.includes("/") || normalized.includes("\\")) return `${normalized}/`;
  return normalized;
}

/**
 * INTERNAL — exported for test isolation.
 * Fetches file paths changed per commit using git log --no-walk.
 * Returns array parallel to hashes: one entry per input hash.
 * Format parsed: hash\\nfile1\\0file2\\0\\0hash\\nfile3\\0\\0
 */
export async function getChangedFiles(
  hashes: string[],
  repoPath: string,
): Promise<string[][]> {
  if (hashes.length === 0) return [];

  const { stdout } = await asyncExecFile(
    "git",
    [
      "log", "--no-walk", "--pretty=format:%H", "--name-only", "-z",
      ...hashes,
    ],
    { cwd: repoPath, encoding: "utf-8", maxBuffer: 50 * 1024 * 1024 },
  );

  if (!stdout) return hashes.map(() => []);

  // Split by double NUL to get per-commit segments
  const segments = stdout.split("\0\0");
  const filesByHash = new Map<string, string[]>();

  for (const seg of segments) {
    const trimmed = seg.endsWith("\0") ? seg.slice(0, -1) : seg;
    const newlineIdx = trimmed.indexOf("\n");
    const hash = trimmed.slice(0, newlineIdx);
    const filesStr = newlineIdx >= 0 ? trimmed.slice(newlineIdx + 1) : "";
    const files = filesStr ? filesStr.split("\0").filter(Boolean) : [];
    filesByHash.set(hash, files);
  }

  // Return in the same order as input hashes
  return hashes.map((h) => filesByHash.get(h) ?? []);
}

export async function mapAreasByFile(
  hashes: string[],
  areas: Record<string, string>,
  ignore: string[],
  repoPath: string,
): Promise<Map<string, string>> {
  if (hashes.length === 0) return new Map();

  // Normalize config
  const normalizedAreas = Object.entries(areas).map(([prefix, name]) => ({
    prefix: normalizePrefix(prefix),
    name,
  }));
  const normalizedIgnore = ignore.map(normalizeIgnore);

  const result = new Map<string, string>();
  const batchSize = 500;

  for (let i = 0; i < hashes.length; i += batchSize) {
    const batch = hashes.slice(i, i + batchSize);
    const filesPerCommit = await getChangedFiles(batch, repoPath);

    for (let j = 0; j < batch.length; j++) {
      const hash = batch[j];
      const files = filesPerCommit[j]?.map(normalizePath) ?? [];
      const filtered = files.filter((f) => {
        for (const ig of normalizedIgnore) {
          if (f === ig || f.startsWith(ig)) return false;
        }
        return true;
      });

      if (filtered.length === 0) {
        result.set(hash, "Uncategorized");
        continue;
      }

      let bestArea = "Uncategorized";
      let bestLen = -1;
      for (const { prefix, name } of normalizedAreas) {
        for (const f of filtered) {
          if (f.startsWith(prefix) && prefix.length > bestLen) {
            bestLen = prefix.length;
            bestArea = name;
          }
        }
      }
      result.set(hash, bestArea);
    }
  }

  return result;
}
