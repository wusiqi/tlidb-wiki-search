// Parser: 游戏机制词条 (Hyperlink page)
// Structure: <tr><td><a href="xxx">词条名</a></td><td>描述</td></tr>

import { WikiEntry } from "../types";
import { stripTags, fetchHtml, BASE } from "../html";

export async function parseMechanics(): Promise<WikiEntry[]> {
  const html = await fetchHtml("Hyperlink");
  if (!html) return [];

  const entries: WikiEntry[] = [];
  const re = /<tr>\s*<td>\s*<a[^>]*>([^<]+)<\/a>\s*<\/td>\s*<td>([\s\S]*?)<\/td>\s*<\/tr>/gi;
  let m;
  while ((m = re.exec(html)) !== null) {
    const name = stripTags(m[1]);
    const desc = stripTags(m[2]);
    if (!name || !desc) continue;
    entries.push({
      category: "游戏机制",
      name,
      description: desc,
      pageUrl: `${BASE}/Hyperlink`,
    });
  }
  return entries;
}
