/**
 * compile-prompt.ts
 *
 * 将 prompts 文件中的代码引用（**File:** `path` (Lines: X-Y)）
 * 实时替换为磁盘上当前最新的代码内容，然后输出到 stdout。
 *
 * 若引用含锚点注释（<!-- anchor: "..." -->），会在行号漂移时自动修正。
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
用法：${cliName} <prompt文件路径> | --clear <路径>

示例：
  ${cliName} prompts/current.md              # 展开引用，输出到 stdout
  ${cliName} prompts/current.md | clip       # 复制到剪贴板 (Windows)
  ${cliName} prompts/current.md | claude     # 直接发给 Claude CLI
  ${cliName} --clear prompts                 # 删除文件夹下的所有文件
  ${cliName} --clear prompts/current.md      # 删除单个文件

说明：
  如果传入文件路径，会将 prompts 文件中的 **File:** 代码引用实时展开为当前磁盘上的最新代码。
  如果引用已经展开（含代码块），将用最新代码替换旧代码块。
  如果引用含锚点（<!-- anchor: "..." -->），行号漂移时会自动修正后再读取代码。
`.trim(),
  );
  process.exit(arg ? 0 : 1);
}

// ── 清理命令 (--clear / -c) ───────────────────────────────────────────────────
if (arg === "--clear" || arg === "-c") {
  const targetArg = process.argv[3];
  if (!targetArg) {
    console.error(
      `❌ 清理失败：未提供目标路径！\n示例：${cliName} --clear prompts`,
    );
    process.exit(1);
  }

  const absTarget = path.resolve(process.cwd(), targetArg);
  if (!fs.existsSync(absTarget)) {
    console.log(`✅ [已跳过] 目标不存在：${targetArg}`);
    process.exit(0);
  }

  const stat = fs.statSync(absTarget);
  let count = 0;
  if (stat.isDirectory()) {
    const files = fs.readdirSync(absTarget);
    for (const file of files) {
      const fullPath = path.join(absTarget, file);
      if (fs.statSync(fullPath).isFile()) {
        fs.unlinkSync(fullPath);
        count++;
      }
    }
    console.log(`✅ 成功清空目录 ${targetArg} 下的 ${count} 个文件。`);
  } else {
    fs.unlinkSync(absTarget);
    console.log(`✅ 成功删除文件 ${targetArg}。`);
  }
  process.exit(0);
}

// ── 锚点解析（与 src/anchorResolver.ts 逻辑一致）──────────────────────────────
function resolveAnchor(
  sourceContent: string,
  startLine: number,
  endLine: number,
  anchor: string,
): { startLine: number; endLine: number } {
  const lines = sourceContent.split("\n");
  const count = endLine - startLine + 1;
  const trimmedAnchor = anchor.trim();

  if (!trimmedAnchor) {
    return { startLine, endLine };
  }

  const storedIdx = startLine - 1;
  if (storedIdx < lines.length && lines[storedIdx].trim() === trimmedAnchor) {
    return { startLine, endLine };
  }

  for (let i = 0; i < lines.length; i++) {
    if (lines[i].trim() === trimmedAnchor) {
      return { startLine: i + 1, endLine: i + count };
    }
  }

  return { startLine, endLine };
}

// ── 编译命令 ──────────────────────────────────────────────────────────────────
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
const refLineRe =
  /^\*\*File:\*\* `([^`]+)` \(Lines: (\d+)-(\d+)\)(?:\s*<!--\s*anchor:\s*"([^"]*?)"\s*-->)?$/;
const output: string[] = [];

let i = 0;
while (i < lines.length) {
  const line = lines[i];

  // 检测 --- + **File:** 组合
  if (line === "---" && i + 1 < lines.length) {
    const nextLine = lines[i + 1];
    const match = nextLine.match(refLineRe);

    if (match) {
      const [, relPath, startStr, endStr, anchor] = match;
      let startLine = parseInt(startStr, 10);
      let endLine = parseInt(endStr, 10);
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

      // 用锚点修正行号
      const sourceContent = fs.readFileSync(absSourcePath, "utf8");
      if (anchor) {
        const resolved = resolveAnchor(sourceContent, startLine, endLine, anchor);
        startLine = resolved.startLine;
        endLine = resolved.endLine;
      }

      // 实时读取源文件最新代码
      const sourceLines = sourceContent.split("\n");
      const startIdx = Math.max(0, startLine - 1);
      const endIdx = Math.min(sourceLines.length, endLine);
      const codeSnippet = sourceLines.slice(startIdx, endIdx).join("\n");
      const ext = path.extname(relPath).replace(".", "") || "text";

      output.push("---");
      // 输出修正后的行号（锚点注释保留，对 AI 无干扰）
      output.push(nextLine.replace(/\(Lines: \d+-\d+\)/, `(Lines: ${startLine}-${endLine})`));
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
