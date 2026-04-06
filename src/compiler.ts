import * as fs from "fs";
import * as path from "path";
import { resolveAnchor } from "./anchorResolver";

export interface CompileResult {
  output: string;
  warnings: string[];
}

const refLineRe =
  /^\*\*File:\*\* `([^`]+)` \(Lines: (\d+)-(\d+)\)(?:\s*<!--\s*anchor:\s*"([^"]*?)"\s*-->)?$/;

/**
 * 将 prompt 文件内容中的代码引用展开为实际代码块。
 *
 * @param promptContent prompt 文件的完整文本内容
 * @param basePath      解析相对路径时使用的根目录（通常为 workspace 根目录）
 */
export function compilePrompt(
  promptContent: string,
  basePath: string,
): CompileResult {
  const warnings: string[] = [];
  const lines = promptContent.split("\n").map((l) => l.trimEnd());
  const output: string[] = [];

  let i = 0;
  while (i < lines.length) {
    const line = lines[i];

    if (line === "---" && i + 1 < lines.length) {
      const nextLine = lines[i + 1];
      const match = nextLine.match(refLineRe);

      if (match) {
        const [, relPath, startStr, endStr, anchor] = match;
        let startLine = parseInt(startStr, 10);
        let endLine = parseInt(endStr, 10);
        const absSourcePath = path.resolve(basePath, relPath.trim());

        // 若引用行后已有代码块，跳过旧代码块
        let skipTo = i + 2;
        if (skipTo < lines.length && lines[skipTo].startsWith("```")) {
          for (let j = skipTo + 1; j < lines.length; j++) {
            if (lines[j] === "```") {
              skipTo = j + 1;
              break;
            }
          }
        }

        if (!fs.existsSync(absSourcePath)) {
          output.push("---");
          output.push(nextLine);
          output.push(`> ⚠️ Warning: file not found → \`${relPath}\``);
          warnings.push(`File not found: ${relPath}`);
          i = skipTo;
          continue;
        }

        const sourceContent = fs.readFileSync(absSourcePath, "utf8");
        if (anchor) {
          const resolved = resolveAnchor(sourceContent, startLine, endLine, anchor);
          if (!resolved.found) {
            warnings.push(
              `Anchor not found in ${relPath}: "${anchor}", using stored line ${startLine}-${endLine}`,
            );
          } else if (resolved.ambiguous) {
            warnings.push(
              `Ambiguous anchor in ${relPath}: "${anchor}", selected nearest match at line ${resolved.startLine}`,
            );
          }
          startLine = resolved.startLine;
          endLine = resolved.endLine;
        }

        const sourceLines = sourceContent
          .split("\n")
          .map((l) => l.replace(/\r$/, ""));
        const startIdx = Math.max(0, startLine - 1);
        const endIdx = Math.min(sourceLines.length, endLine);
        const codeSnippet = sourceLines.slice(startIdx, endIdx).join("\n");
        const ext = path.extname(relPath).replace(".", "") || "text";

        output.push("---");
        output.push(
          nextLine.replace(/\(Lines: \d+-\d+\)/, `(Lines: ${startLine}-${endLine})`),
        );
        output.push(`\`\`\`${ext}`);
        output.push(codeSnippet);
        output.push("```");

        i = skipTo;
        continue;
      }
    }

    output.push(line);
    i++;
  }

  return { output: output.join("\n") + "\n", warnings };
}
