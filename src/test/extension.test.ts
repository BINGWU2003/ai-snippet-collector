/**
 * VSCode 集成测试入口。
 * 需要 VSCode Extension Host 环境，适合测试依赖 vscode API 的命令行为。
 * 纯逻辑测试见 anchorResolver.test.ts / formatter.test.ts。
 */
import * as assert from "assert";
import * as vscode from "vscode";

const EXT_ID = "BINGWU2003.ai-snippet-collector";
const COMMANDS = [
  "ai-snippet.addToSpecificFile",
  "ai-snippet.addToLastFile",
  "ai-snippet.deleteSnippet",
  "ai-snippet.gotoSnippetSource",
  "ai-snippet.expandReference",
  "ai-snippet.collapseReference",
];

suite("Extension Integration", () => {
  suiteSetup(async () => {
    // 确保扩展已激活
    const ext = vscode.extensions.getExtension(EXT_ID);
    if (ext && !ext.isActive) {
      await ext.activate();
    }
  });

  suite("扩展激活", () => {
    test("扩展可被找到", () => {
      const ext = vscode.extensions.getExtension(EXT_ID);
      assert.ok(ext, `找不到扩展 ${EXT_ID}`);
    });

    test("扩展激活后处于 active 状态", () => {
      const ext = vscode.extensions.getExtension(EXT_ID);
      assert.ok(ext?.isActive, "扩展未激活");
    });
  });

  suite("命令注册", () => {
    let registeredCommands: string[];

    suiteSetup(async () => {
      registeredCommands = await vscode.commands.getCommands(true);
    });

    for (const cmd of COMMANDS) {
      test(`命令已注册：${cmd}`, () => {
        assert.ok(
          registeredCommands.includes(cmd),
          `命令未注册：${cmd}`,
        );
      });
    }
  });
});
