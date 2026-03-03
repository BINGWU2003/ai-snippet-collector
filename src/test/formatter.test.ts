import * as assert from "assert";
import { formatAsReference } from "../formatter";

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
});

