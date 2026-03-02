/**
 * 格式化为「代码引用」—— 只记录文件路径和行号，不内嵌代码内容。
 * 代码可通过 CodeLens「展开代码」按钮随时读取最新版本。
 */
export function formatAsReference(
  filePath: string,
  startLine: number,
  endLine: number,
): string {
  return `\n\n---\n**File:** \`${filePath}\` (Lines: ${startLine}-${endLine})\n`;
}

/**
 * 格式化为内嵌代码块（保留，供「展开代码」命令写入使用）。
 */
export function formatCodeBlock(
  filePath: string,
  startLine: number,
  endLine: number,
  code: string,
  language: string,
): string {
  return `\n\n---\n**File:** \`${filePath}\` (Lines: ${startLine}-${endLine})\n\`\`\`${language}\n${code}\n\`\`\`\n`;
}
