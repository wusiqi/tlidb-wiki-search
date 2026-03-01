// Parser: 棱镜 (Ethereal_Prism page)
// Only use table rows where second column has a prism name link.
// The flex containers are too complex (mix of prism effects, random affixes, talent bonuses).

import { WikiEntry } from "../types";
import { stripTags, fetchHtml, BASE } from "../html";

export async function parsePrism(): Promise<WikiEntry[]> {
  const html = await fetchHtml("Ethereal_Prism");
  if (!html) return [];

  const entries: WikiEntry[] = [];
  const seen = new Set<string>();

  // Only match table rows where second column has <a> link (= prism name)
  const re = /<tr><td>([\s\S]*?)<\/td><td>\s*<a[^>]*>([^<]+)<\/a>\s*<\/td><\/tr>/gi;
  let m;
  while ((m = re.exec(html)) !== null) {
    const desc = stripTags(m[1]);
    const name = stripTags(m[2]);
    if (!desc || desc.length < 3) continue;
    // Skip huge rows (prism overview rows that contain all effects)
    if (desc.length > 200) continue;

    const key = name + ":" + desc;
    if (seen.has(key)) continue;
    seen.add(key);

    entries.push({
      category: "棱镜",
      name,
      description: desc,
      pageUrl: `${BASE}/Ethereal_Prism`,
    });
  }
  return entries;
}
