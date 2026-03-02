import * as vscode from "vscode";
import { t } from "./i18n";

interface SnippetLocation {
  /** CodeLens 显示在 --- 所在行 */
  codeLensLine: number;
  /** 删除整个片段（含前置空行）的范围 */
  deleteRange: vscode.Range;
  /** 源文件相对路径（从 Location 行解析） */
  sourceRelativePath: string;
  /** 源文件起始行（1-indexed） */
  sourceStartLine: number;
}

/**
 * 逐行扫描文档，找出所有符合格式的代码片段位置。
 * 片段格式（由 formatter.ts 写入）：
 *   \n\n---\n**Location:** ...\n```lang\n...code...\n```\n
 */
function findSnippets(document: vscode.TextDocument): SnippetLocation[] {
  // trimEnd() 去除 Windows CRLF 中的 \r，确保跨平台匹配
  const lines = document.getText().split("\n").map((l) => l.trimEnd());
  const results: SnippetLocation[] = [];

  let i = 0;
  while (i < lines.length) {
    const isSep = lines[i] === "---";
    const hasLocation =
      i + 1 < lines.length && lines[i + 1].startsWith("**Location:**");
    const hasOpenFence = i + 2 < lines.length && lines[i + 2].startsWith("```");

    if (isSep && hasLocation && hasOpenFence) {
      const sepLineNum = i;
      const locationLine = lines[i + 1];

      // 解析 **Location:** `path` (Lines: X-Y)
      const locMatch = locationLine.match(
        /\*\*Location:\*\* `([^`]+)` \(Lines: (\d+)-(\d+)\)/,
      );
      const sourceRelativePath = locMatch?.[1] ?? "";
      const sourceStartLine = locMatch ? parseInt(locMatch[2], 10) : 1;

      // 向后寻找单独一行的关闭围栏 ```
      let closeFenceLine = -1;
      for (let j = i + 3; j < lines.length; j++) {
        if (lines[j] === "```") {
          closeFenceLine = j;
          break;
        }
      }
      if (closeFenceLine === -1) {
        i++;
        continue;
      }

      // 删除起点：若 --- 前有两个空行（\n\n），一并删除
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

      // 删除终点：关闭围栏的下一行行首（即整行含换行符一起删掉）
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
      });

      i = closeFenceLine + 1;
    } else {
      i++;
    }
  }

  return results;
}

/** 仅在 prompts 目录下的 .md / .txt 文件激活 */
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

    return findSnippets(document).flatMap(
      ({ codeLensLine, deleteRange, sourceRelativePath, sourceStartLine }) => {
        const lineRange = new vscode.Range(codeLensLine, 0, codeLensLine, 3);
        const lenses: vscode.CodeLens[] = [];

        // 删除按钮
        lenses.push(
          new vscode.CodeLens(lineRange, {
            title: t().deleteSnippet,
            command: "ai-snippet.deleteSnippet",
            arguments: [document.uri, deleteRange],
          }),
        );

        // 跳转到源码按钮
        if (sourceRelativePath) {
          lenses.push(
            new vscode.CodeLens(lineRange, {
              title: t().gotoSource,
              command: "ai-snippet.gotoSnippetSource",
              arguments: [sourceRelativePath, sourceStartLine],
            }),
          );
        }

        return lenses;
      },
    );
  }
}
