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
  expandReference: string;
  collapseReference: string;
  // extension (QuickPick / InputBox)
  quickPickPlaceholder: string;
  quickPickCreateNew: string;
  quickPickCreateNamed: (name: string) => string;
  inputBoxPrompt: string;
  inputBoxPlaceholder: string;
  noLastFile: string;
  addToLastFileTitle: string;
  // anchor / duplicate
  anchorNotFound: (path: string) => string;
  duplicateSnippet: (path: string, fileName: string) => string;
  addAnyway: string;
  // note prompt
  noteInputPrompt: string;
  noteInputPlaceholder: string;
  // compile and copy
  compiledAndCopied: (fileName: string) => string;
  compiledWithWarnings: (count: number) => string;
  compileNoFile: string;
  compileAndCopyTooltip: (fileName: string) => string;
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
  expandReference: "$(expand-all) Expand code",
  collapseReference: "$(collapse-all) Collapse code",
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
  anchorNotFound: (p) => `Anchor not found in ${p}, using stored line number (may be inaccurate).`,
  duplicateSnippet: (p, f) => `${p} is already referenced in ${f}. Add anyway?`,
  addAnyway: "Add Anyway",
  noteInputPrompt: "Add a note for the AI (optional, press Escape to skip)",
  noteInputPlaceholder: "e.g. Please fix the concurrency bug in this function",
  compiledAndCopied: (f) => `Compiled and copied to clipboard: ${f}`,
  compiledWithWarnings: (n) => `Copied to clipboard with ${n} warning(s). Check the Output panel for details.`,
  compileNoFile: "No prompt file selected. Please save a snippet first.",
  compileAndCopyTooltip: (f) => `Compile & Copy to clipboard: ${f}`,
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
  expandReference: "$(expand-all) 展开代码",
  collapseReference: "$(collapse-all) 折叠代码",
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
  anchorNotFound: (p) => `在 ${p} 中未找到锚点，将使用存储的行号（可能已过期）。`,
  duplicateSnippet: (p, f) => `${p} 已在 ${f} 中被引用，是否仍要添加？`,
  addAnyway: "仍要添加",
  noteInputPrompt: "为 AI 添加一条说明（可选，按 Escape 跳过）",
  noteInputPlaceholder: "例如：请修复这个函数中的并发 bug",
  compiledAndCopied: (f) => `已编译并复制到剪贴板：${f}`,
  compiledWithWarnings: (n) => `已复制到剪贴板，但有 ${n} 条警告，请查看输出面板。`,
  compileNoFile: "尚未选择提示词文件，请先保存一个代码片段。",
  compileAndCopyTooltip: (f) => `编译并复制到剪贴板：${f}`,
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
