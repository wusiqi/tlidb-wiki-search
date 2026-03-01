// Parser: 传奇装备 (Legendary_Gear page)
// Structure: <a data-hover href="xxx">装备名</a><br/>需求等级 N
//            followed by <div class="tierParent"> containing modifier divs

import { WikiEntry } from "../types";
import { stripTags, fetchHtml, BASE } from "../html";

export async function parseLegendary(): Promise<WikiEntry[]> {
  const html = await fetchHtml("Legendary_Gear");
  if (!html) return [];

  const entries: WikiEntry[] = [];

  // Split by gear blocks
  const blocks = html.split(/(?=<a[^>]*data-hover[^>]*href="[^"]*">[^<]{2,30}<\/a>\s*<br\s*\/?>\s*需求等级)/);

  for (const block of blocks) {
    const nameMatch = block.match(/<a[^>]*data-hover[^>]*href="[^"]*">([^<]{2,30})<\/a>\s*<br\s*\/?>\s*需求等级/);
    if (!nameMatch) continue;
    const name = nameMatch[1];

    // Extract each tier div as a separate modifier line
    // Each modifier is in <div class="t1"> or similar
    const tierRe = /<div class="t\d+">([\s\S]*?)<\/div>/g;
    const mods: string[] = [];
    let tm;
    while ((tm = tierRe.exec(block)) !== null) {
      const mod = stripTags(tm[1]);
      if (mod && mod.length > 2) mods.push(mod);
    }

    if (mods.length === 0) continue;

    entries.push({
      category: "传奇装备",
      name,
      description: mods.join(" ｜ "),
      pageUrl: `${BASE}/Legendary_Gear`,
    });
  }
  return entries;
}
