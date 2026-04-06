/**
 * 锚点解析：当行号因代码增删而漂移时，通过首行内容匹配找到新位置。
 */
export interface ResolveResult {
  startLine: number;
  endLine: number;
  /** true 表示行号已更新（与存储值不同） */
  updated: boolean;
  /** true 表示文件中有多处相同锚点，已自动选取最近的一处 */
  ambiguous: boolean;
  /** true 表示锚点在文件中找到了匹配（存储位置或漂移后），false 表示未找到或锚点为空 */
  found: boolean;
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
    return { startLine, endLine, updated: false, ambiguous: false, found: false };
  }

  // 先验证存储的行号是否仍然有效
  const storedIdx = startLine - 1;
  if (storedIdx < lines.length && lines[storedIdx].trim() === trimmedAnchor) {
    return { startLine, endLine, updated: false, ambiguous: false, found: true };
  }

  // 全文收集所有匹配行
  const matches: number[] = [];
  for (let i = 0; i < lines.length; i++) {
    if (lines[i].trim() === trimmedAnchor) {
      matches.push(i + 1); // 1-indexed
    }
  }

  if (matches.length === 0) {
    // 锚点未找到，返回原始行号（可能已过期）
    return { startLine, endLine, updated: false, ambiguous: false, found: false };
  }

  // 多重匹配时优先选取离存储行号最近的一处
  let best = matches[0];
  let minDist = Math.abs(matches[0] - startLine);
  for (const m of matches.slice(1)) {
    const dist = Math.abs(m - startLine);
    if (dist < minDist) {
      minDist = dist;
      best = m;
    }
  }

  return {
    startLine: best,
    endLine: best + count - 1,
    updated: best !== startLine,
    ambiguous: matches.length > 1,
    found: true,
  };
}
