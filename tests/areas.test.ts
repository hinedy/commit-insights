import { describe, it, expect, afterEach } from "vitest";
import { mapAreasByFile } from "../src/analyze/areas";
import { TestRepo } from "./helpers/testRepo";

describe("mapAreasByFile", () => {
  let repo: TestRepo;

  afterEach(() => {
    repo?.cleanup();
  });

  it("returns empty map for empty hashes", async () => {
    const result = await mapAreasByFile([], {}, [], ".");
    expect(result.size).toBe(0);
  });

  it("maps single file to matching area", async () => {
    repo = new TestRepo();
    const hash = repo.commit({
      message: "api change",
      files: { "src/api/users.ts": "content" },
    });

    const result = await mapAreasByFile(
      [hash],
      { "src/api/": "Backend" },
      [],
      repo.dir,
    );

    expect(result.get(hash)).toBe("Backend");
  });

  it("selects deepest prefix when files span multiple areas", async () => {
    repo = new TestRepo();
    const hash = repo.commit({
      message: "multi-area",
      files: {
        "src/api/x.ts": "",
        "src/web/y.ts": "",
        "README.md": "",
      },
    });

    const result = await mapAreasByFile(
      [hash],
      {
        "src/": "Frontend",
        "src/api/": "Backend",
        "src/web/": "UI",
      },
      [],
      repo.dir,
    );

    // UI (depth 8) beats Backend (depth 8) first config entry wins
    // Actually both are depth 8 — tie-break: first in config wins
    expect(result.get(hash)).toBe("Backend");
  });

  it("tie-break equal-length prefixes by config order", async () => {
    repo = new TestRepo();
    const hash = repo.commit({
      message: "tie-break",
      files: { "src/lib/util.ts": "", "src/app/ui.ts": "" },
    });

    const result = await mapAreasByFile(
      [hash],
      {
        "src/app/": "App",
        "src/lib/": "Lib",
      },
      [],
      repo.dir,
    );

    // Both prefixes length 8, "App" first in config
    expect(result.get(hash)).toBe("App");
  });

  it("ignores matching ignore path, returns Uncategorized", async () => {
    repo = new TestRepo();
    const hash = repo.commit({
      message: "lockfile change",
      files: { "package-lock.json": "{}" },
    });

    const result = await mapAreasByFile(
      [hash],
      {},
      ["package-lock.json"],
      repo.dir,
    );

    expect(result.get(hash)).toBe("Uncategorized");
  });

  it("ignores directory match, returns Uncategorized", async () => {
    repo = new TestRepo();
    const hash = repo.commit({
      message: "dist change",
      files: { "dist/bundle.js": "" },
    });

    const result = await mapAreasByFile(
      [hash],
      {},
      ["dist/"],
      repo.dir,
    );

    expect(result.get(hash)).toBe("Uncategorized");
  });

  it("returns Uncategorized when no area config matches", async () => {
    repo = new TestRepo();
    const hash = repo.commit({
      message: "vendor change",
      files: { "vendor/thing.js": "" },
    });

    const result = await mapAreasByFile(
      [hash],
      { "src/": "App" },
      [],
      repo.dir,
    );

    expect(result.get(hash)).toBe("Uncategorized");
  });

  it("enforces path boundary with auto-normalized prefix", async () => {
    repo = new TestRepo();
    const h1 = repo.commit({
      message: "api",
      files: { "src/api/rest.ts": "" },
    });
    const h2 = repo.commit({
      message: "apiary",
      files: { "src/apiary/auth.ts": "" },
    });

    const result = await mapAreasByFile(
      [h1, h2],
      { "src/api": "Backend" }, // no trailing slash — auto-normalized to src/api/
      [],
      repo.dir,
    );

    expect(result.get(h1)).toBe("Backend");
    expect(result.get(h2)).toBe("Uncategorized");
  });

  it("handles multiple commits correctly", async () => {
    repo = new TestRepo();
    const h1 = repo.commit({ message: "first", files: { "a.txt": "" } });
    const h2 = repo.commit({ message: "second", files: { "b.txt": "" } });

    const result = await mapAreasByFile(
      [h1, h2],
      { "": "Root" },
      [],
      repo.dir,
    );

    expect(result.size).toBe(2);
    expect(result.get(h1)).toBe("Root");
    expect(result.get(h2)).toBe("Root");
  });

  it("ignores dist files but matches src files in mixed commit", async () => {
    repo = new TestRepo();
    const hash = repo.commit({
      message: "mixed",
      files: { "dist/bundle.js": "", "src/api/users.ts": "" },
    });

    const result = await mapAreasByFile(
      [hash],
      { "src/api/": "Backend" },
      ["dist/"],
      repo.dir,
    );

    expect(result.get(hash)).toBe("Backend");
  });
});
