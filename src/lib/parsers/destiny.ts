// Parser: 命运/天命 (Destiny page)
// Structure: <a data-hover href="xxx">天命名</a><div><div><span data-modifier-id>效果</span></div></div>

import { WikiEntry } from "../types";
import { stripTags, fetchHtml, BASE } from "../utils/html";

export async function parseDestiny(): Promise<WikiEntry[]> {
  const html = await fetchHtml("Destiny");
  if (!html) return [];

  const entries: WikiEntry[] = [];
  const seen = new Set<string>();

  // Split by destiny blocks: each starts with a data-hover link
  const blocks = html.split(/(?=<a[^>]*data-hover[^>]*href="[^"]*">[^<]{2,30}<\/a>\s*<div>)/);

  for (const block of blocks) {
    const nameMatch = block.match(/<a[^>]*data-hover[^>]*href="[^"]*">([^<]{2,30})<\/a>\s*<div>/);
    if (!nameMatch) continue;
    const name = nameMatch[1];
    if (seen.has(name)) continue;
    seen.add(name);

    // Extract the content div after the name link
    // Take everything between the first <div> after the link and the closing structure
    const contentStart = block.indexOf("<div>", nameMatch.index || 0);
    if (contentStart < 0) continue;

    // Get a reasonable chunk of content (up to next destiny block or 2000 chars)
    const content = block.slice(contentStart, Math.min(block.length, contentStart + 2000));
    const desc = stripTags(content);

    if (!desc || desc.length < 3) continue;

    // Clean up: remove "安装后替换一个中型天赋点 移除时需要消耗额外道具" boilerplate
    const cleanDesc = desc
      .replace(/安装后替换一个中型天赋点\s*移除时需要消耗额外道具/g, "")
      .trim();

    if (!cleanDesc) continue;

    entries.push({
      category: "命运",
      name,
      description: cleanDesc,
      pageUrl: `${BASE}/Destiny`,
    });
  }
  return entries;
}
