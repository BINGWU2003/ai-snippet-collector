import * as vscode from "vscode";
import * as fs from "fs";
import * as path from "path";
import { LAST_FILE_KEY } from "./constants";
import { updateStatusBar } from "./statusBar";
import { t } from "./i18n";

/**
 * 将代码片段追加到目标文件，并在成功后提供"打开文件"操作。
 */

export async function saveSnippet(
  context: vscode.ExtensionContext,
  targetFileName: string,
  textToAppend: string,
  workspaceFolder: string,
): Promise<void> {
  const promptsDir = path.join(workspaceFolder, "prompts");
  const targetFilePath = path.join(promptsDir, targetFileName);

  await fs.promises.mkdir(promptsDir, { recursive: true });

  try {
    await fs.promises.appendFile(targetFilePath, textToAppend, "utf8");

    await context.workspaceState.update(LAST_FILE_KEY, targetFileName);
    updateStatusBar(targetFileName);

    const action = await vscode.window.showInformationMessage(
      t().snippetSaved(targetFileName),
      t().openFile,
    );
    if (action === t().openFile) {
      const doc = await vscode.workspace.openTextDocument(targetFilePath);
      await vscode.window.showTextDocument(doc);
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    vscode.window.showErrorMessage(t().failedToSave(message));
  }
}

/**
 * 读取 prompts 目录下已有的 .md / .txt 文件列表。
 * 目录不存在时返回空数组。
 */
export async function listPromptFiles(
  workspaceFolder: string,
): Promise<string[]> {
  const promptsDir = path.join(workspaceFolder, "prompts");
  try {
    const entries = await fs.promises.readdir(promptsDir);
    return entries.filter((f) => f.endsWith(".md") || f.endsWith(".txt"));
  } catch {
    return [];
  }
}
