/**
 * 锚点解析：当行号因代码增删而漂移时，通过首行内容匹配找到新位置。
 */
export interface ResolveResult {
  startLine: number;
  endLine: number;
  /** true 表示行号已更新（与存储值不同） */
  updated: boolean;
}

/**
 * 根据锚点（选中代码的首行内容）在源文件中定位当前实际行号。
 *
 * @param sourceContent 源文件完整内容
 * @param startLine     引用中存储的起始行号（1-indexed）
 * @param endLine       引用中存储的结束行号（1-indexed）
 * @param anchor        保存时记录的首行内容（trim 后）
 */
export function resolveAnchor(
  sourceContent: string,
  startLine: number,
  endLine: number,
  anchor: string,
): ResolveResult {
  const lines = sourceContent.split("\n");
  const count = endLine - startLine + 1;
  const trimmedAnchor = anchor.trim();

  if (!trimmedAnchor) {
    return { startLine, endLine, updated: false };
  }

  // 先验证存储的行号是否仍然有效
  const storedIdx = startLine - 1;
  if (storedIdx < lines.length && lines[storedIdx].trim() === trimmedAnchor) {
    return { startLine, endLine, updated: false };
  }

  // 全文搜索锚点
  for (let i = 0; i < lines.length; i++) {
    if (lines[i].trim() === trimmedAnchor) {
      const newStart = i + 1;
      const newEnd = newStart + count - 1;
      return { startLine: newStart, endLine: newEnd, updated: true };
    }
  }

  // 锚点未找到，返回原始行号（可能已过期）
  return { startLine, endLine, updated: false };
}
