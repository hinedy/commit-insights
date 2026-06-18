import { describe, it, expect } from "vitest";
import { monthlyActivityConfig } from "../src/report/templates/chartConfigs";

describe("monthlyActivityConfig", () => {
  it("returns valid Chart.js config with bar type and amber fill", () => {
    const cfg = monthlyActivityConfig([
      { month: "2026-01", count: 5 },
      { month: "2026-02", count: 3 },
    ]);
    expect(cfg.type).toBe("bar");
    expect(cfg.data.labels).toEqual(["2026-01", "2026-02"]);
    expect(cfg.data.datasets[0].data).toEqual([5, 3]);
    expect(cfg.data.datasets[0].backgroundColor).toBe("#C4763A");
    expect(cfg.options).toBeDefined();
  });
});
