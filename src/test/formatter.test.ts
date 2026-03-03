import * as assert from "assert";
import { formatAsReference, formatCodeBlock } from "../formatter";

suite("formatter", () => {
  suite("formatAsReference", () => {
    test("不传锚点 → 无 anchor 注释", () => {
      const result = formatAsReference("src/foo.ts", 10, 20);
      assert.strictEqual(
        result,
        "\n\n---\n**File:** `src/foo.ts` (Lines: 10-20)\n",
      );
    });

    test("传入锚点 → 末尾附加 HTML 注释", () => {
      const result = formatAsReference(
        "src/foo.ts",
        10,
        20,
        "function activate() {",
      );
      assert.strictEqual(
        result,
        '\n\n---\n**File:** `src/foo.ts` (Lines: 10-20) <!-- anchor: "function activate() {" -->\n',
      );
    });

    test("传入空字符串锚点 → 无 anchor 注释", () => {
      const result = formatAsReference("src/foo.ts", 1, 5, "");
      assert.strictEqual(
        result,
        "\n\n---\n**File:** `src/foo.ts` (Lines: 1-5)\n",
      );
    });

    test("路径含斜杠和特殊字符 → 原样保留", () => {
      const result = formatAsReference("src/utils/helper.ts", 1, 1);
      assert.ok(result.includes("`src/utils/helper.ts`"));
    });

    test("单行选择（startLine === endLine）→ 正确输出", () => {
      const result = formatAsReference("index.ts", 42, 42, "const x = 1;");
      assert.ok(result.includes("(Lines: 42-42)"));
      assert.ok(result.includes('<!-- anchor: "const x = 1;" -->'));
    });
  });

  suite("formatCodeBlock", () => {
    test("不传锚点 → 无 anchor 注释", () => {
      const result = formatCodeBlock(
        "src/foo.ts",
        10,
        20,
        "const x = 1;",
        "typescript",
      );
      assert.strictEqual(
        result,
        "\n\n---\n**File:** `src/foo.ts` (Lines: 10-20)\n```typescript\nconst x = 1;\n```\n",
      );
    });

    test("传入锚点 → 引用行附加 anchor 注释", () => {
      const result = formatCodeBlock(
        "src/foo.ts",
        10,
        20,
        "const x = 1;",
        "typescript",
        "const x = 1;",
      );
      assert.strictEqual(
        result,
        '\n\n---\n**File:** `src/foo.ts` (Lines: 10-20) <!-- anchor: "const x = 1;" -->\n```typescript\nconst x = 1;\n```\n',
      );
    });

    test("多行代码 → 完整保留", () => {
      const code = "function foo() {\n  return 1;\n}";
      const result = formatCodeBlock("a.ts", 1, 3, code, "typescript");
      assert.ok(result.includes("function foo() {"));
      assert.ok(result.includes("  return 1;"));
      assert.ok(result.includes("}"));
    });

    test("语言标识符写入代码围栏", () => {
      const result = formatCodeBlock("style.css", 1, 1, ".foo {}", "css");
      assert.ok(result.includes("```css"));
    });
  });
});
