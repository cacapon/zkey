import { describe, test, expect } from "vitest";
import { applyPlaceholders } from "../../src/core/templateLoader";

describe("applyPlaceholders", () => {
  test("単一のプレースホルダーを置換する", () => {
    const result = applyPlaceholders("Hello {{name}}", { name: "World" });
    expect(result).toBe("Hello World");
  });

  test("複数のプレースホルダーを置換する", () => {
    const result = applyPlaceholders("{{id}} / {{alias}}", { id: "C001", alias: "c001" });
    expect(result).toBe("C001 / c001");
  });

  test("同じプレースホルダーが複数回出現しても全て置換する", () => {
    const result = applyPlaceholders("{{x}} and {{x}}", { x: "foo" });
    expect(result).toBe("foo and foo");
  });

  test("対応するキーがない場合はそのまま残る", () => {
    const result = applyPlaceholders("{{unknown}}", { other: "value" });
    expect(result).toBe("{{unknown}}");
  });

  test("Coreノートのフロントマターに必要な値が反映される", () => {
    const template = `---\ncreated: "{{created}}"\nid: "{{id}}"\naliases:\n  - "{{alias}}"\n---\n↑: [[{{parent}}]]`;
    const result = applyPlaceholders(template, {
      created: "2026-03-29",
      id: "C123456789abcde",
      alias: "C123",
      parent: "HOME",
    });
    expect(result).toContain(`created: "2026-03-29"`);
    expect(result).toContain(`id: "C123456789abcde"`);
    expect(result).toContain(`- "C123"`);
    expect(result).toContain(`↑: [[HOME]]`);
  });

  test("Refノートのsrcが反映される", () => {
    const template = `src: "[[{{src}}]]"\n↑: [[{{src}}]]`;
    const result = applyPlaceholders(template, { src: "MyBook" });
    expect(result).toBe(`src: "[[MyBook]]"\n↑: [[MyBook]]`);
  });
});
