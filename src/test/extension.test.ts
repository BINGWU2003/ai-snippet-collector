/**
 * VSCode 集成测试入口。
 * 需要 VSCode Extension Host 环境，适合测试依赖 vscode API 的命令行为。
 * 纯逻辑测试见 anchorResolver.test.ts / formatter.test.ts。
 */
import * as vscode from 'vscode';

suite('Extension Integration', () => {
  vscode.window.showInformationMessage('Start integration tests.');
});
