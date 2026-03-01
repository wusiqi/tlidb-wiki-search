// Parser: 英雄 (Hero page + individual trait pages)
// Step 1: Get trait slugs + summaries from Hero page
// Step 2: Fetch each trait page, extract trait skills with fw-bold names

import { WikiEntry } from "../types";
import { stripTags, fetchHtml, BASE } from "../html";

export async function parseHero(): Promise<WikiEntry[]> {
  const html = await fetchHtml("Hero");
  if (!html) return [];

  // Step 1: Extract trait slugs and names
  const traits: { slug: string; name: string; summary: string }[] = [];
  const blocks = html.split(/<div class="d-flex[^"]*border-top[^"]*"/);
  for (const block of blocks) {
    const nameMatch = block.match(/<a href="([^"]+)">([^<]*\|[^<]*)<\/a>/);
    if (!nameMatch) continue;
    const descMatch = block.match(/<hr[^>]*\/>([\s\S]*?)<\/div>/);
    const summary = descMatch ? stripTags(descMatch[1]) : "";
    traits.push({ slug: nameMatch[1], name: nameMatch[2], summary });
  }

  // Step 2: Fetch each trait detail page in parallel
  const entries: WikiEntry[] = [];
  const settled = await Promise.allSettled(
    traits.map(t => fetchTraitDetail(t.slug, t.name, t.summary))
  );
  for (const r of settled) {
    if (r.status === "fulfilled") entries.push(...r.value);
  }
  return entries;
}

async function fetchTraitDetail(
  slug: string, fullName: string, summary: string
): Promise<WikiEntry[]> {
  const html = await fetchHtml(slug);
  const entries: WikiEntry[] = [];

  // Split name
  const parts = fullName.split("|");
  const heroName = parts[0]?.trim() || fullName;

  if (!html) {
    // Fallback: just the summary
    if (summary) {
      entries.push({
        category: "英雄",
        name: fullName,
        description: summary,
        subtype: heroName,
        pageUrl: `${BASE}/${slug}`,
      });
    }
    return entries;
  }

  // Add the overview entry
  if (summary) {
    entries.push({
      category: "英雄",
      name: fullName,
      description: summary,
      subtype: heroName,
      pageUrl: `${BASE}/${slug}`,
    });
  }

  // Extract trait skills: <div class="fw-bold">技能名</div>需求等级 N<hr/>效果
  // Split by fw-bold blocks
  const skillBlocks = html.split(/<div class="fw-bold">/);
  for (let i = 1; i < skillBlocks.length; i++) {
    const block = skillBlocks[i];

    // Extract skill name
    const nameEnd = block.indexOf("</div>");
    if (nameEnd < 0) continue;
    const skillName = block.slice(0, nameEnd).trim();
    if (!skillName || skillName.length > 30) continue;

    // Extract level requirement
    const levelMatch = block.match(/需求等级\s*(\d+)/);
    const level = levelMatch ? levelMatch[1] : "";

    // Extract description: everything after <hr/> until next major block
    const hrPos = block.indexOf("<hr");
    if (hrPos < 0) continue;
    const descHtml = block.slice(hrPos).split(/<\/div>\s*<\/div>\s*<\/div>/)[0] || "";
    const desc = stripTags(descHtml);
    if (!desc || desc.length < 5) continue;

    entries.push({
      category: "英雄",
      name: skillName,
      description: desc,
      subtype: `${fullName}${level ? ` · 需求等级${level}` : ""}`,
      pageUrl: `${BASE}/${slug}`,
    });
  }

  return entries;
}
