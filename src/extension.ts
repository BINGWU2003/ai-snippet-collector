import * as vscode from "vscode";
import { LAST_FILE_KEY } from "./constants";
import { initStatusBar, updateStatusBar } from "./statusBar";
import { saveSnippet, listPromptFiles } from "./fileManager";
import { getSnippetContext } from "./snippetContext";
import { SnippetCodeLensProvider } from "./snippetCodeLens";
import { t } from "./i18n";

export function activate(context: vscode.ExtensionContext) {
  // 初始化状态栏
  const lastFile = context.workspaceState.get<string>(LAST_FILE_KEY);
  initStatusBar(context);
  updateStatusBar(lastFile);

  // 监听语言配置变更，实时刷新状态栏文字
  context.subscriptions.push(
    vscode.workspace.onDidChangeConfiguration((e) => {
      if (e.affectsConfiguration("aiSnippetCollector.language")) {
        const currentFile = context.workspaceState.get<string>(LAST_FILE_KEY);
        updateStatusBar(currentFile);
      }
    }),
  );

  // ── CodeLens：每个片段顶部显示删除按钮 ──────────────────────────
  const codeLensProvider = new SnippetCodeLensProvider();
  context.subscriptions.push(
    vscode.languages.registerCodeLensProvider(
      [
        { language: "markdown", pattern: "**/prompts/**" },
        { pattern: "**/prompts/**/*.txt" },
      ],
      codeLensProvider,
    ),
  );

  // ── 命令：删除指定片段 ────────────────────────────────────────
  const disposableDelete = vscode.commands.registerCommand(
    "ai-snippet.deleteSnippet",
    async (uri: vscode.Uri, range: vscode.Range) => {
      const document = await vscode.workspace.openTextDocument(uri);
      const editor = await vscode.window.showTextDocument(document);
      await editor.edit((editBuilder) => {
        editBuilder.delete(range);
      });
    },
  );

  // ── 命令：跳转到源文件指定行 ──────────────────────────────────
  const disposableGoto = vscode.commands.registerCommand(
    "ai-snippet.gotoSnippetSource",
    async (relativePath: string, lineNumber: number) => {
      // 在所有工作区文件夹中查找匹配的文件
      const workspaceFolders = vscode.workspace.workspaceFolders;
      if (!workspaceFolders) {
        vscode.window.showErrorMessage(t().noWorkspaceFolder);
        return;
      }

      let targetUri: vscode.Uri | undefined;
      for (const folder of workspaceFolders) {
        const candidate = vscode.Uri.joinPath(folder.uri, relativePath);
        try {
          await vscode.workspace.fs.stat(candidate);
          targetUri = candidate;
          break;
        } catch {
          // 文件不在此工作区，继续找
        }
      }

      if (!targetUri) {
        vscode.window.showErrorMessage(
          `Source file not found: ${relativePath}`,
        );
        return;
      }

      const doc = await vscode.workspace.openTextDocument(targetUri);
      const editor = await vscode.window.showTextDocument(doc);
      // lineNumber 是 1-indexed，VS Code Position 是 0-indexed
      const targetLine = Math.max(0, lineNumber - 1);
      const position = new vscode.Position(targetLine, 0);
      editor.selection = new vscode.Selection(position, position);
      editor.revealRange(
        new vscode.Range(position, position),
        vscode.TextEditorRevealType.InCenter,
      );
    },
  );

  context.subscriptions.push(disposableDelete, disposableGoto);

  // ── 命令 1：添加到指定文件（支持 QuickPick 直接输入新文件名）──
  const disposableSpecific = vscode.commands.registerCommand(
    "ai-snippet.addToSpecificFile",
    async () => {
      const snippetCtx = await getSnippetContext();
      if (!snippetCtx) {
        return;
      }

      const { textToAppend, workspaceFolder } = snippetCtx;
      const existingFiles = await listPromptFiles(workspaceFolder);

      const quickPick = vscode.window.createQuickPick();

      const buildItems = (filterText: string): vscode.QuickPickItem[] => {
        const filtered = filterText
          ? existingFiles.filter((f) =>
              f.toLowerCase().includes(filterText.toLowerCase()),
            )
          : existingFiles;

        const createLabel = filterText
          ? t().quickPickCreateNamed(
              filterText.endsWith(".md") || filterText.endsWith(".txt")
                ? filterText
                : `${filterText}.md`,
            )
          : t().quickPickCreateNew;

        return [
          { label: createLabel, alwaysShow: true },
          ...filtered.map((file) => ({ label: file })),
        ];
      };

      quickPick.items = buildItems("");
      quickPick.placeholder = t().quickPickPlaceholder;

      // 用户输入时动态更新列表（顶部实时预览创建选项）
      quickPick.onDidChangeValue((value) => {
        quickPick.items = buildItems(value);
      });

      quickPick.onDidChangeSelection(async (selection) => {
        if (selection[0]) {
          quickPick.hide();
          let targetFile = selection[0].label;

          if (targetFile.startsWith("$(add)")) {
            const inputValue = quickPick.value.trim();
            let newFileName: string;
            if (inputValue) {
              newFileName =
                inputValue.endsWith(".md") || inputValue.endsWith(".txt")
                  ? inputValue
                  : `${inputValue}.md`;
            } else {
              const result = await vscode.window.showInputBox({
                prompt: t().inputBoxPrompt,
                placeHolder: t().inputBoxPlaceholder,
              });
              if (!result) {
                return;
              }
              newFileName =
                result.endsWith(".md") || result.endsWith(".txt")
                  ? result
                  : `${result}.md`;
            }
            targetFile = newFileName;
          }

          await saveSnippet(context, targetFile, textToAppend, workspaceFolder);
        }
      });

      // 释放资源，防止泄漏
      quickPick.onDidHide(() => quickPick.dispose());
      quickPick.show();
    },
  );

  // ── 命令 2：添加到上次使用的文件（静默降级）────────────────────
  const disposableLast = vscode.commands.registerCommand(
    "ai-snippet.addToLastFile",
    async () => {
      const lastUsedFile = context.workspaceState.get<string>(LAST_FILE_KEY);

      if (!lastUsedFile) {
        // 静默降级：直接进入文件选择流程
        await vscode.commands.executeCommand("ai-snippet.addToSpecificFile");
        return;
      }

      const snippetCtx = await getSnippetContext();
      if (!snippetCtx) {
        return;
      }

      await saveSnippet(
        context,
        lastUsedFile,
        snippetCtx.textToAppend,
        snippetCtx.workspaceFolder,
      );
    },
  );

  context.subscriptions.push(disposableSpecific, disposableLast);
}

export function deactivate() {}
