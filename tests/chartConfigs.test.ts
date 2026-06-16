import { describe, it, expect } from "vitest";
import {
  monthlyActivityConfig,
  typeBreakdownConfig,
  areaBreakdownConfig,
} from "../src/report/templates/chartConfigs";

describe("monthlyActivityConfig", () => {
  it("returns valid Chart.js config with bar type", () => {
    const cfg = monthlyActivityConfig([
      { month: "2026-01", count: 5 },
      { month: "2026-02", count: 3 },
    ]);
    expect(cfg.type).toBe("bar");
    expect(cfg.data.labels).toEqual(["2026-01", "2026-02"]);
    expect(cfg.data.datasets[0].data).toEqual([5, 3]);
    expect(cfg.options).toBeDefined();
  });
});

describe("typeBreakdownConfig", () => {
  it("returns doughnut config with type counts", () => {
    const cfg = typeBreakdownConfig({ feat: 5, fix: 3, other: 2 });
    expect(cfg.type).toBe("doughnut");
    expect(cfg.data.labels).toContain("feat");
    expect(cfg.data.datasets[0].data).toContain(5);
    expect(cfg.options).toBeDefined();
  });
});

describe("areaBreakdownConfig", () => {
  it("returns horizontal bar config with area counts", () => {
    const cfg = areaBreakdownConfig([
      { area: "Source", count: 10 },
      { area: "Tests", count: 5 },
    ]);
    expect(cfg.type).toBe("bar");
    expect(cfg.indexAxis).toBe("y");
    expect(cfg.data.labels).toEqual(["Source", "Tests"]);
    expect(cfg.data.datasets[0].data).toEqual([10, 5]);
    expect(cfg.options).toBeDefined();
  });
});
