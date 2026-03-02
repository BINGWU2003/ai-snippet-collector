import * as vscode from "vscode";
import { t } from "./i18n";

interface SnippetLocation {
  codeLensLine: number;
  deleteRange: vscode.Range;
  sourceRelativePath: string;
  sourceStartLine: number;
  sourceEndLine: number;
  /** 已展开（引用行后紧跟代码块）*/
  isExpanded: boolean;
  /** 仅展开时有值：代码块的范围（用于折叠命令）*/
  codeBlockRange?: vscode.Range;
}

/**
 * 逐行扫描文档，识别所有代码引用片段。
 * 格式 A（仅引用）：
 *   ---
 *   **File:** `path` (Lines: X-Y)
 *
 * 格式 B（已展开）：
 *   ---
 *   **File:** `path` (Lines: X-Y)
 *   ```lang
 *   ...code...
 *   ```
 */
function findSnippets(document: vscode.TextDocument): SnippetLocation[] {
  const lines = document
    .getText()
    .split("\n")
    .map((l) => l.trimEnd());
  const results: SnippetLocation[] = [];

  let i = 0;
  while (i < lines.length) {
    if (
      lines[i] !== "---" ||
      i + 1 >= lines.length ||
      !lines[i + 1].startsWith("**File:**")
    ) {
      i++;
      continue;
    }

    const sepLineNum = i;
    const refLineNum = i + 1;
    const refLine = lines[refLineNum];

    const locMatch = refLine.match(/`([^`]+)` \(Lines: (\d+)-(\d+)\)/);
    const sourceRelativePath = locMatch?.[1] ?? "";
    const sourceStartLine = locMatch ? parseInt(locMatch[2], 10) : 1;
    const sourceEndLine = locMatch ? parseInt(locMatch[3], 10) : 1;

    // 删除起点（含前置空行）
    let startLineNum = sepLineNum;
    if (
      startLineNum >= 2 &&
      lines[startLineNum - 1] === "" &&
      lines[startLineNum - 2] === ""
    ) {
      startLineNum -= 2;
    } else if (startLineNum >= 1 && lines[startLineNum - 1] === "") {
      startLineNum -= 1;
    }

    // 判断是否已展开：引用行的下一行是否为开栅栏 ```
    const afterRefLine = refLineNum + 1;
    const hasCodeBlock =
      afterRefLine < lines.length && lines[afterRefLine].startsWith("```");

    if (hasCodeBlock) {
      // 找关闭栅栏
      let closeFenceLine = -1;
      for (let j = afterRefLine + 1; j < lines.length; j++) {
        if (lines[j] === "```") {
          closeFenceLine = j;
          break;
        }
      }

      if (closeFenceLine === -1) {
        i++;
        continue;
      }

      const deleteEndLine =
        closeFenceLine + 1 < lines.length ? closeFenceLine + 1 : closeFenceLine;
      const deleteEndChar =
        closeFenceLine + 1 < lines.length ? 0 : lines[closeFenceLine].length;

      results.push({
        codeLensLine: sepLineNum,
        deleteRange: new vscode.Range(
          new vscode.Position(startLineNum, 0),
          new vscode.Position(deleteEndLine, deleteEndChar),
        ),
        sourceRelativePath,
        sourceStartLine,
        sourceEndLine,
        isExpanded: true,
        // 代码块范围：从开栅栏行首到关闭栅栏行末（含换行）
        codeBlockRange: new vscode.Range(
          new vscode.Position(afterRefLine, 0),
          new vscode.Position(
            closeFenceLine + 1 < lines.length
              ? closeFenceLine + 1
              : closeFenceLine,
            closeFenceLine + 1 < lines.length
              ? 0
              : lines[closeFenceLine].length,
          ),
        ),
      });

      i = closeFenceLine + 1;
    } else {
      // 仅引用格式
      const deleteEndLine =
        refLineNum + 1 < lines.length ? refLineNum + 1 : refLineNum;
      const deleteEndChar =
        refLineNum + 1 < lines.length ? 0 : lines[refLineNum].length;

      results.push({
        codeLensLine: sepLineNum,
        deleteRange: new vscode.Range(
          new vscode.Position(startLineNum, 0),
          new vscode.Position(deleteEndLine, deleteEndChar),
        ),
        sourceRelativePath,
        sourceStartLine,
        sourceEndLine,
        isExpanded: false,
      });

      i = refLineNum + 1;
    }
  }

  return results;
}

function isPromptsFile(document: vscode.TextDocument): boolean {
  const p = document.uri.fsPath.replace(/\\/g, "/");
  return (
    p.includes("/prompts/") &&
    (document.fileName.endsWith(".md") || document.fileName.endsWith(".txt"))
  );
}

export class SnippetCodeLensProvider implements vscode.CodeLensProvider {
  provideCodeLenses(document: vscode.TextDocument): vscode.CodeLens[] {
    if (!isPromptsFile(document)) {
      return [];
    }

    return findSnippets(document).flatMap((snippet) => {
      const {
        codeLensLine,
        deleteRange,
        sourceRelativePath,
        sourceStartLine,
        sourceEndLine,
        isExpanded,
        codeBlockRange,
      } = snippet;
      const lineRange = new vscode.Range(codeLensLine, 0, codeLensLine, 3);
      const lenses: vscode.CodeLens[] = [];

      // 删除整个片段（已展开时也一并删除代码块）
      lenses.push(
        new vscode.CodeLens(lineRange, {
          title: t().deleteSnippet,
          command: "ai-snippet.deleteSnippet",
          arguments: [document.uri, deleteRange],
        }),
      );

      // 跳转到源码
      if (sourceRelativePath) {
        lenses.push(
          new vscode.CodeLens(lineRange, {
            title: t().gotoSource,
            command: "ai-snippet.gotoSnippetSource",
            arguments: [sourceRelativePath, sourceStartLine],
          }),
        );
      }

      // 展开 / 折叠（互斥）
      if (isExpanded && codeBlockRange) {
        lenses.push(
          new vscode.CodeLens(lineRange, {
            title: t().collapseReference,
            command: "ai-snippet.collapseReference",
            arguments: [document.uri, codeBlockRange],
          }),
        );
      } else if (!isExpanded && sourceRelativePath) {
        lenses.push(
          new vscode.CodeLens(lineRange, {
            title: t().expandReference,
            command: "ai-snippet.expandReference",
            arguments: [
              document.uri,
              codeLensLine,
              sourceRelativePath,
              sourceStartLine,
              sourceEndLine,
            ],
          }),
        );
      }

      return lenses;
    });
  }
}
