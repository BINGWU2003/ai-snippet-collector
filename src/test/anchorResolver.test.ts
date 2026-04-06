import * as assert from "assert";
import { resolveAnchor } from "../anchorResolver";

suite("anchorResolver", () => {
  suite("锚点与存储行吻合", () => {
    test("首行完全匹配 → 不更新", () => {
      const source = "line1\nfunction foo() {\n  return 1;\n}";
      const r = resolveAnchor(source, 2, 4, "function foo() {");
      assert.strictEqual(r.startLine, 2);
      assert.strictEqual(r.endLine, 4);
      assert.strictEqual(r.updated, false);
    });

    test("首行含前后空格 → trim 后匹配", () => {
      const source = "  function foo() {  \n  return 1;\n}";
      const r = resolveAnchor(source, 1, 3, "function foo() {");
      assert.strictEqual(r.startLine, 1);
      assert.strictEqual(r.endLine, 3);
      assert.strictEqual(r.updated, false);
    });
  });

  suite("锚点漂移到新位置", () => {
    test("前面插入一行 → 行号 +1，updated=true", () => {
      // 原来第1行是 function foo，现在第1行是新插入行
      const source = "inserted\nfunction foo() {\n  return 1;\n}";
      const r = resolveAnchor(source, 1, 3, "function foo() {");
      assert.strictEqual(r.startLine, 2);
      assert.strictEqual(r.endLine, 4);
      assert.strictEqual(r.updated, true);
    });

    test("前面插入两行 → 行号 +2", () => {
      const source = "new1\nnew2\nconst x = 1;\nconst y = 2;\nconst z = 3;";
      // 原来 lines 1-3，现在 lines 3-5
      const r = resolveAnchor(source, 1, 3, "const x = 1;");
      assert.strictEqual(r.startLine, 3);
      assert.strictEqual(r.endLine, 5);
      assert.strictEqual(r.updated, true);
    });

    test("选中行数（count）在漂移后保持不变", () => {
      const source =
        "a\nb\nc\nexport function bar() {\n  doX();\n  doY();\n  doZ();\n}";
      // 原始：lines 1-4（count=4），锚点 "export function bar() {"
      const r = resolveAnchor(source, 1, 4, "export function bar() {");
      const count = 4 - 1 + 1; // 原 count
      assert.strictEqual(r.endLine - r.startLine + 1, count);
      assert.strictEqual(r.updated, true);
    });
  });

  suite("锚点找不到时的降级", () => {
    test("文件中不存在锚点 → 返回原始行号，updated=false", () => {
      const source = "completely different code\nno match here";
      const r = resolveAnchor(source, 5, 8, "function foo() {");
      assert.strictEqual(r.startLine, 5);
      assert.strictEqual(r.endLine, 8);
      assert.strictEqual(r.updated, false);
    });

    test("存储行号越界（行号大于文件行数）→ 全文搜索仍能定位", () => {
      const source = "function foo() {\n  return 1;\n}";
      const r = resolveAnchor(source, 99, 101, "function foo() {");
      assert.strictEqual(r.startLine, 1);
      assert.strictEqual(r.updated, true);
    });
  });

  suite("空/无效锚点", () => {
    test("空字符串锚点 → 直接返回原始行号", () => {
      const source = "function foo() {\n  return 1;\n}";
      const r = resolveAnchor(source, 1, 3, "");
      assert.strictEqual(r.startLine, 1);
      assert.strictEqual(r.endLine, 3);
      assert.strictEqual(r.updated, false);
    });

    test("纯空格锚点 → 等同于空锚点", () => {
      const source = "function foo() {\n  return 1;\n}";
      const r = resolveAnchor(source, 1, 3, "   ");
      assert.strictEqual(r.startLine, 1);
      assert.strictEqual(r.updated, false);
    });
  });

  suite("多重匹配", () => {
    test("存储行号越界时，多处相同锚点 → 返回距离存储行最近的一处", () => {
      // source: line1="function foo() {", line4="function foo() {"
      // 存储行号=99，line1 距离=98，line4 距离=95 → 应选 line4
      const source =
        "function foo() {\n  return 1;\n}\nfunction foo() {\n  return 2;\n}";
      const r = resolveAnchor(source, 99, 101, "function foo() {");
      assert.strictEqual(r.startLine, 4);
      assert.strictEqual(r.endLine, 6);
      assert.strictEqual(r.updated, true);
      assert.strictEqual(r.ambiguous, true);
    });

    test("存储行号靠近第一处时，选取最近的第一处", () => {
      const source =
        "function foo() {\n  return 1;\n}\nfunction foo() {\n  return 2;\n}";
      // 存储行号=2，line1 距离=1，line4 距离=2 → 应选 line1
      const r = resolveAnchor(source, 2, 4, "function foo() {");
      assert.strictEqual(r.startLine, 1);
      assert.strictEqual(r.updated, true);
      assert.strictEqual(r.ambiguous, true);
    });

    test("唯一匹配时 ambiguous=false", () => {
      const source = "function foo() {\n  return 1;\n}";
      const r = resolveAnchor(source, 99, 101, "function foo() {");
      assert.strictEqual(r.ambiguous, false);
      assert.strictEqual(r.startLine, 1);
    });

    test("锚点未找到时 ambiguous=false", () => {
      const source = "completely different code";
      const r = resolveAnchor(source, 1, 3, "function foo() {");
      assert.strictEqual(r.ambiguous, false);
      assert.strictEqual(r.updated, false);
    });
  });

  suite("ambiguous 标志", () => {
    test("存储行精确匹配时 ambiguous=false，即使有其他相同行", () => {
      // 存储行 startLine=1 精确匹配，不触发全文搜索 → ambiguous=false
      const source = "function foo() {\n  return 1;\n}\nfunction foo() {\n  return 2;\n}";
      const r = resolveAnchor(source, 1, 3, "function foo() {");
      assert.strictEqual(r.updated, false);
      assert.strictEqual(r.ambiguous, false);
    });
  });
});
