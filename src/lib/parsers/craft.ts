// Parser: 打造 (Craft page)
// Structure: <tr><td>词缀效果</td><td>来源</td><td>类型</td></tr>

import { WikiEntry } from "../types";
import { stripTags, fetchHtml, BASE } from "../html";

export async function parseCraft(): Promise<WikiEntry[]> {
  const html = await fetchHtml("Craft");
  if (!html) return [];

  const entries: WikiEntry[] = [];
  const re = /<tr><td>([\s\S]*?)<\/td><td>([\s\S]*?)<\/td><td>([\s\S]*?)<\/td><\/tr>/gi;
  let m;
  while ((m = re.exec(html)) !== null) {
    const desc = stripTags(m[1]);
    const source = stripTags(m[2]);
    const subtype = stripTags(m[3]);
    if (!desc || !source || source === "来源") continue; // skip header
    entries.push({
      category: "打造",
      name: "",
      description: desc,
      source,
      subtype,
      pageUrl: `${BASE}/Craft`,
    });
  }
  return entries;
}
