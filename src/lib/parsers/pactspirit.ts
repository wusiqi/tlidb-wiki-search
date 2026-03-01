// Parser: 契灵 (Pactspirit page)
// Structure: <a data-hover href="xxx" class="item_rarity...">契灵名</a>
//            <div>类型 稀有度</div>
//            <div>属性加成</div>
//            <div class="border-top"><div class="modifier">效果</div>...</div>

import { WikiEntry } from "../types";
import { stripTags, fetchHtml, BASE } from "../html";

export async function parsePactspirit(): Promise<WikiEntry[]> {
  const html = await fetchHtml("Pactspirit");
  if (!html) return [];

  const entries: WikiEntry[] = [];
  const seen = new Set<string>();

  // Split by pactspirit blocks: each has a data-hover link with item_rarity class
  const blocks = html.split(/(?=<a[^>]*data-hover[^>]*href="[^"]*"[^>]*class="item_rarity)/);

  for (const block of blocks) {
    // Extract name
    const nameMatch = block.match(/<a[^>]*class="item_rarity\d+"[^>]*>([^<]+)<\/a>/);
    if (!nameMatch) continue;
    const name = nameMatch[1];
    if (seen.has(name)) continue;
    seen.add(name);

    // Extract type/rarity: first <div> after the link
    const typeMatch = block.match(/<\/a>\s*<div>([^<]*(?:<span[^>]*>[^<]*<\/span>)?[^<]*)<\/div>/);
    const typeStr = typeMatch ? stripTags(typeMatch[1]) : "";

    // Extract stat bonuses: second <div>
    const statMatch = block.match(/<\/div>\s*<div>([^<]+)<\/div>\s*<div class="border-top">/);
    const stats = statMatch ? stripTags(statMatch[1]) : "";

    // Extract modifier effects from <div class="modifier"> blocks
    const modRe = /<div class="modifier">([\s\S]*?)<\/div>/g;
    const mods: string[] = [];
    let mm;
    while ((mm = modRe.exec(block)) !== null) {
      const mod = stripTags(mm[1]);
      if (mod && mod.length > 2) mods.push(mod);
    }

    const descParts: string[] = [];
    if (typeStr) descParts.push(typeStr);
    if (stats) descParts.push(stats);
    if (mods.length > 0) descParts.push(mods.join(" ｜ "));

    if (descParts.length === 0) continue;

    entries.push({
      category: "契灵",
      name,
      description: descParts.join(" — "),
      tags: typeStr ? [typeStr.split(" ")[0]] : undefined, // 攻击/法术/防御
      pageUrl: `${BASE}/Pactspirit`,
    });
  }
  return entries;
}
