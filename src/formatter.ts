/** 将代码片段格式化为 AI 友好的 Markdown 结构 */
export function formatForAI(
  filePath: string,
  startLine: number,
  endLine: number,
  code: string,
  language: string,
): string {
  return `\n\n---\n**Location:** \`${filePath}\` (Lines: ${startLine}-${endLine})\n\`\`\`${language}\n${code}\n\`\`\`\n`;
}
