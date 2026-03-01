// Parser: 天赋 (Talent page)
// Core talents: <span class="fw-bold">天赋名</span> + description
// Small/medium: <span>小型天赋</span><span><a>知识之神</a></span> + effects

import { WikiEntry } from "../types";
import { stripTags, fetchHtml, BASE } from "../utils/html";

export async function parseTalent(): Promise<WikiEntry[]> {
  const html = await fetchHtml("Talent");
  if (!html) return [];

  const entries: WikiEntry[] = [];

  // Split into flex blocks — each talent node is a d-flex container
  const blockRe = /<div class="d-flex[^"]*border-top[^"]*"[^>]*>([\s\S]*?)<\/div>\s*<\/div>\s*<\/div>/gi;
  let m;
  while ((m = blockRe.exec(html)) !== null) {
    const block = m[1];

    // Core talent: <span class="fw-bold">名字</span>
    const coreMatch = block.match(/<span class="fw-bold">([^<]+)<\/span>/);
    // Small/medium talent: <span>(小型天赋|中型天赋|传奇中型天赋)</span>
    const smallMatch = block.match(/<span>(小型天赋|中型天赋|传奇中型天赋)<\/span>/);
    // God name: <a href="...">知识之神</a>
    const godMatch = block.match(/<a[^>]*href="[^"]*">([^<]+)<\/a><\/span>/);

    let name = "";
    let subtype = "";

    if (coreMatch) {
      name = coreMatch[1];
      subtype = godMatch ? `核心天赋·${godMatch[1]}` : "核心天赋";
    } else if (smallMatch) {
      name = smallMatch[1];
      subtype = godMatch ? `${smallMatch[1]}·${godMatch[1]}` : smallMatch[1];
    }

    if (!name) continue;

    // Extract description: remove the header div that contains name and god
    // Header pattern: <div class="d-flex justify-content-between">...name...god...</div>
    const descHtml = block.replace(/<div class="d-flex justify-content-between">[\s\S]*?<\/div>/, "");
    const desc = stripTags(descHtml);
    if (!desc) continue;

    entries.push({
      category: "天赋",
      name,
      description: desc,
      subtype,
      pageUrl: `${BASE}/Talent`,
    });
  }
  return entries;
}
