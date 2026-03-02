/**
 * compile-prompt.ts
 *
 * 将 prompts 文件中的代码引用（**File:** `path` (Lines: X-Y)）
 * 实时替换为磁盘上当前最新的代码内容，然后输出到 stdout。
 *
 * 用法：
 *   compile-prompt prompts/my-prompt.md
 *   compile-prompt prompts/my-prompt.md | claude
 *   compile-prompt prompts/my-prompt.md > /tmp/compiled.md
 */

import * as fs from "fs";
import * as path from "path";

// ── 参数解析 ──────────────────────────────────────────────────────────────────
const cliName = path
  .basename(process.argv[1] ?? "compile-prompt")
  .replace(/\.js$/, "");
const arg = process.argv[2];

if (!arg || arg === "--help" || arg === "-h") {
  console.log(
    `
用法：${cliName} <prompt文件路径>

示例：
  ${cliName} prompts/current.md              # 输出到 stdout
  ${cliName} prompts/current.md | clip       # 复制到剪贴板 (Windows)
  ${cliName} prompts/current.md | pbcopy     # 复制到剪贴板 (macOS)
  ${cliName} prompts/current.md | claude     # 直接发给 Claude CLI

说明：
  将 prompts 文件中的 **File:** 代码引用实时展开为当前磁盘上的最新代码。
  如果引用已经展开（含代码块），将用最新代码替换旧代码块。
`.trim(),
  );
  process.exit(arg ? 0 : 1);
}

const promptFilePath = arg;
const absPromptPath = path.resolve(process.cwd(), promptFilePath);

if (!fs.existsSync(absPromptPath)) {
  console.error(`❌ 文件不存在：${absPromptPath}`);
  process.exit(1);
}

// ── 读取 prompt 文件 ───────────────────────────────────────────────────────────
const content = fs.readFileSync(absPromptPath, "utf8");
const lines = content.split("\n").map((l) => l.trimEnd());

// ── 逐行解析 ──────────────────────────────────────────────────────────────────
const refLineRe = /^\*\*File:\*\* `([^`]+)` \(Lines: (\d+)-(\d+)\)$/;
const output: string[] = [];

let i = 0;
while (i < lines.length) {
  const line = lines[i];

  // 检测 --- + **File:** 组合
  if (line === "---" && i + 1 < lines.length) {
    const nextLine = lines[i + 1];
    const match = nextLine.match(refLineRe);

    if (match) {
      const [, relPath, startStr, endStr] = match;
      const startLine = parseInt(startStr, 10);
      const endLine = parseInt(endStr, 10);
      const absSourcePath = path.resolve(process.cwd(), relPath.trim());

      // 若引用行后已有代码块，跳过旧代码块（找到关闭围栏）
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
        i = skipTo;
        continue;
      }

      // 实时读取源文件最新代码
      const sourceLines = fs.readFileSync(absSourcePath, "utf8").split("\n");
      const startIdx = Math.max(0, startLine - 1);
      const endIdx = Math.min(sourceLines.length, endLine);
      const codeSnippet = sourceLines.slice(startIdx, endIdx).join("\n");
      const ext = path.extname(relPath).replace(".", "") || "text";

      output.push("---");
      output.push(`**File:** \`${relPath}\` (Lines: ${startLine}-${endLine})`);
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

// ── 输出编译结果 ───────────────────────────────────────────────────────────────
process.stdout.write(output.join("\n") + "\n");
