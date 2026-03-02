import * as vscode from "vscode";
import { formatAsReference } from "./formatter";
import { t } from "./i18n";

export interface SnippetContext {
  textToAppend: string;
  workspaceFolder: string;
}

/**
 * 获取当前编辑器中的代码片段上下文。
 * 若未选中文字，询问用户是否使用当前行。
 * 输出为「代码引用」格式，不内嵌代码内容。
 */
export async function getSnippetContext(): Promise<SnippetContext | null> {
  const editor = vscode.window.activeTextEditor;
  if (!editor) {
    vscode.window.showWarningMessage(t().noActiveEditor);
    return null;
  }

  let selection = editor.selection;
  let code = editor.document.getText(selection);

  // 未选中文字时，询问是否使用当前行
  if (!code) {
    const action = await vscode.window.showWarningMessage(
      t().noTextSelected,
      t().useCurrentLine,
    );
    if (action !== t().useCurrentLine) {
      return null;
    }
    const line = selection.active.line;
    const lineText = editor.document.lineAt(line).text;
    selection = new vscode.Selection(line, 0, line, lineText.length);
    editor.selection = selection;
    code = editor.document.getText(selection);
  }

  const workspaceFolder = vscode.workspace.getWorkspaceFolder(
    editor.document.uri,
  )?.uri.fsPath;
  if (!workspaceFolder) {
    vscode.window.showErrorMessage(t().noWorkspaceFolder);
    return null;
  }

  const relativeFilePath = vscode.workspace.asRelativePath(editor.document.uri);
  const startLine = selection.start.line + 1;
  const endLine = selection.end.line + 1;

  // 仅保存引用，不内嵌代码
  const textToAppend = formatAsReference(relativeFilePath, startLine, endLine);

  return { textToAppend, workspaceFolder };
}
