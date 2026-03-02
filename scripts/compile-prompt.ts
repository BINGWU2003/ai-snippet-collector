#!/usr/bin/env tsx
/**
 * compile-prompt.ts
 *
 * 将 prompts 文件中的代码引用（**File:** `path` (Lines: X-Y)）
 * 实时替换为磁盘上当前最新的代码内容，然后输出到 stdout。
 *
 * 用法：
 *   tsx scripts/compile-prompt.ts prompts/my-prompt.md
 *   tsx scripts/compile-prompt.ts prompts/my-prompt.md | claude chat
 *   tsx scripts/compile-prompt.ts prompts/my-prompt.md > /tmp/compiled.md
 */

import * as fs from "fs";
import * as path from "path";

// ── 参数校验 ──────────────────────────────────────────────────────────────────
const promptFilePath = process.argv[2];

if (!promptFilePath) {
  console.error("❌ 用法：tsx scripts/compile-prompt.ts <prompt文件路径>");
  console.error("   示例：tsx scripts/compile-prompt.ts prompts/current.md");
  process.exit(1);
}

const absPromptPath = path.resolve(process.cwd(), promptFilePath);

if (!fs.existsSync(absPromptPath)) {
  console.error(`❌ 文件不存在：${absPromptPath}`);
  process.exit(1);
}

// ── 读取 prompt 文件 ───────────────────────────────────────────────────────────
const content = fs.readFileSync(absPromptPath, "utf8");
const lines = content.split("\n");

// ── 逐行解析，将引用替换为代码块 ──────────────────────────────────────────────
const refLineRe = /^\*\*File:\*\* `([^`]+)` \(Lines: (\d+)-(\d+)\)$/;
const output: string[] = [];

let i = 0;
while (i < lines.length) {
  const line = lines[i].trimEnd();

  if (line === "---" && i + 1 < lines.length) {
    const nextLine = lines[i + 1].trimEnd();
    const match = nextLine.match(refLineRe);

    if (match) {
      const [, relPath, startStr, endStr] = match;
      const startLine = parseInt(startStr, 10);
      const endLine = parseInt(endStr, 10);
      const absSourcePath = path.resolve(process.cwd(), relPath.trim());

      if (!fs.existsSync(absSourcePath)) {
        // 文件不存在时保留原始引用，附加警告
        output.push("---");
        output.push(nextLine);
        output.push(`> ⚠️ Warning: file not found → \`${relPath}\``);
        i += 2;
        continue;
      }

      // 实时读取源文件当前内容
      const sourceLines = fs.readFileSync(absSourcePath, "utf8").split("\n");
      const startIdx = Math.max(0, startLine - 1);
      const endIdx = Math.min(sourceLines.length, endLine);
      const codeSnippet = sourceLines.slice(startIdx, endIdx).join("\n");
      const ext = path.extname(relPath).replace(".", "") || "text";

      // 输出展开后的代码块
      output.push("---");
      output.push(`**File:** \`${relPath}\` (Lines: ${startLine}-${endLine})`);
      output.push(`\`\`\`${ext}`);
      output.push(codeSnippet);
      output.push("```");

      i += 2;
      continue;
    }
  }

  output.push(line);
  i++;
}

// ── 输出编译结果 ───────────────────────────────────────────────────────────────
process.stdout.write(output.join("\n") + "\n");
