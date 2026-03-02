import * as vscode from "vscode";
import { t } from "./i18n";

let statusBarItem: vscode.StatusBarItem;

/** 初始化状态栏，需在 activate 中调用一次 */
export function initStatusBar(context: vscode.ExtensionContext): void {
  statusBarItem = vscode.window.createStatusBarItem(
    vscode.StatusBarAlignment.Right,
    100,
  );
  statusBarItem.command = "ai-snippet.addToLastFile";
  statusBarItem.show();
  context.subscriptions.push(statusBarItem);
}

/** 更新状态栏显示的 last file */
export function updateStatusBar(fileName: string | undefined): void {
  if (fileName) {
    statusBarItem.text = `$(file-add) → ${fileName}`;
    statusBarItem.tooltip = t().statusBarTooltip(fileName);
  } else {
    statusBarItem.text = t().statusBarNone;
    statusBarItem.tooltip = t().statusBarTooltipNone;
  }
}
