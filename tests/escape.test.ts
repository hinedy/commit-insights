import { describe, it, expect } from "vitest";
import { escapeHtml, jsonForScript } from "../src/report/escape";

describe("escapeHtml", () => {
  it("escapes &, <, >, \", '", () => {
    expect(escapeHtml(`<script>"&'`)).toBe(
      "&lt;script&gt;&quot;&amp;&#x27;",
    );
  });

  it("passes through plain text unchanged", () => {
    expect(escapeHtml("hello world")).toBe("hello world");
  });
});

describe("jsonForScript", () => {
  it("escapes </script> in JSON string", () => {
    const input = { x: "</script>" };
    const result = jsonForScript(input);
    expect(result).toContain("\\u003C\\/script\\u003E");
    expect(result).not.toContain("</script>");
  });

  it("escapes U+2028 and U+2029", () => {
    const input = { line: "\u2028", para: "\u2029" };
    const result = jsonForScript(input);
    expect(result).toContain("\\u2028");
    expect(result).toContain("\\u2029");
  });
});
