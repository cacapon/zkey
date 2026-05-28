const WIKILINK_RE = /\[\[([^\]|]+?)(?:\\)?(?:\|[^\]]+)?\]\]/g;

// カーソル位置(col)を含む[[リンク]]のリンク先名を返す
export function parseLinkAtCursor(line: string, col: number): string | null {
  const re = /\[\[([^\]|]+?)(?:\\)?(?:\|[^\]]+)?\]\]/g;
  let match;
  while ((match = re.exec(line)) !== null) {
    const start = match.index;
    const end = start + match[0].length;
    if (col >= start && col <= end) {
      return match[1].trim();
    }
  }
  return null;
}

// 本文全体から[[リンク]]のリンク先名一覧を返す
export function extractLinks(content: string): string[] {
  const results: string[] = [];
  let match;
  const re = new RegExp(WIKILINK_RE.source, "g");
  while ((match = re.exec(content)) !== null) {
    results.push(match[1].trim());
  }
  return results;
}
