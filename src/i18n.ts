import * as vscode from "vscode";

export interface Messages {
  // snippetContext
  noActiveEditor: string;
  noTextSelected: string;
  useCurrentLine: string;
  noWorkspaceFolder: string;
  // fileManager
  snippetSaved: (fileName: string) => string;
  openFile: string;
  failedToSave: (message: string) => string;
  // statusBar
  statusBarNone: string;
  statusBarTooltipNone: string;
  statusBarTooltip: (fileName: string) => string;
  // snippetCodeLens
  deleteSnippet: string;
  gotoSource: string;
  // extension (QuickPick / InputBox)
  quickPickPlaceholder: string;
  quickPickCreateNew: string;
  quickPickCreateNamed: (name: string) => string;
  inputBoxPrompt: string;
  inputBoxPlaceholder: string;
  noLastFile: string;
  addToLastFileTitle: string;
}

const en: Messages = {
  noActiveEditor: "No active editor found.",
  noTextSelected: "No text selected. Use current line?",
  useCurrentLine: "Use Current Line",
  noWorkspaceFolder: "Please open a workspace/folder first.",
  snippetSaved: (f) => `Snippet saved to /prompts/${f}`,
  openFile: "Open File",
  failedToSave: (m) => `Failed to save snippet: ${m}`,
  deleteSnippet: "$(trash) Delete snippet",
  gotoSource: "$(go-to-file) Go to source",
  statusBarNone: "$(file-add) → none",
  statusBarTooltipNone: "Add snippet to last used file (none yet)",
  statusBarTooltip: (f) => `Add snippet to: ${f}`,
  quickPickPlaceholder: "Select a file or type to create a new one",
  quickPickCreateNew: "$(add) Create new prompt file...",
  quickPickCreateNamed: (n) => `$(add) Create: ${n}`,
  inputBoxPrompt: "Enter new file name (e.g., feature_x.md)",
  inputBoxPlaceholder: "feature_x.md",
  noLastFile: "No previous file found. Please select or create one.",
  addToLastFileTitle: "Add snippet to last used prompt file",
};

const zhCn: Messages = {
  noActiveEditor: "未找到活动编辑器。",
  noTextSelected: "未选中任何文本，是否使用当前行？",
  useCurrentLine: "使用当前行",
  noWorkspaceFolder: "请先打开一个工作区/文件夹。",
  snippetSaved: (f) => `代码片段已保存至 /prompts/${f}`,
  openFile: "打开文件",
  failedToSave: (m) => `保存代码片段失败：${m}`,
  deleteSnippet: "$(trash) 删除此片段",
  gotoSource: "$(go-to-file) 跳转到源码",
  statusBarNone: "$(file-add) → 无",
  statusBarTooltipNone: "添加代码片段到上次使用的文件（尚未选择）",
  statusBarTooltip: (f) => `添加代码片段到：${f}`,
  quickPickPlaceholder: "选择文件，或直接输入名称以新建文件",
  quickPickCreateNew: "$(add) 新建提示词文件…",
  quickPickCreateNamed: (n) => `$(add) 新建：${n}`,
  inputBoxPrompt: "输入新文件名（例如：feature_x.md）",
  inputBoxPlaceholder: "feature_x.md",
  noLastFile: "未找到上次使用的文件，请选择或新建一个。",
  addToLastFileTitle: "添加代码片段到上次使用的提示词文件",
};

/** 解析最终使用的语言（考虑 auto 模式） */
function resolveLanguage(): "en" | "zh-cn" {
  const config = vscode.workspace
    .getConfiguration("aiSnippetCollector")
    .get<string>("language", "auto");

  if (config === "zh-cn") {
    return "zh-cn";
  }
  if (config === "en") {
    return "en";
  }
  // auto：跟随 VS Code 界面语言
  return vscode.env.language.toLowerCase().startsWith("zh") ? "zh-cn" : "en";
}

/** 获取当前语言的翻译对象 */
export function getMessages(): Messages {
  return resolveLanguage() === "zh-cn" ? zhCn : en;
}

/** 快捷别名：直接获取翻译对象（每次调用都读取最新配置，无需手动刷新） */
export const t = getMessages;
