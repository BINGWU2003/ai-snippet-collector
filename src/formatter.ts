/**
 * 格式化为「代码引用」—— 只记录文件路径和行号，不内嵌代码内容。
 * 代码可通过 CodeLens「展开代码」按钮随时读取最新版本。
 *
 * anchor：保存时选中代码的首行内容（trim 后），用于行号漂移时重新定位。
 */
export function formatAsReference(
  filePath: string,
  startLine: number,
  endLine: number,
  anchor?: string,
): string {
  const anchorPart = anchor ? ` <!-- anchor: "${anchor}" -->` : "";
  return `\n\n---\n**File:** \`${filePath}\` (Lines: ${startLine}-${endLine})${anchorPart}\n`;
}
