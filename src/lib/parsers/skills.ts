// Parser: 技能 (Active/Support/Passive/Activation_Medium/Noble/Magnificent)
// Two views in each page:
// 1. Grid view: <a data-hover>技能名</a> + <div>标签</div> (no description)
// 2. Detail view: <a data-hover>技能名</a><div></div><div></div><div class="explicitMod">效果</div>
// We use the detail view for full descriptions.

import { WikiEntry } from "../types";
import { stripTags, fetchHtml, BASE } from "../utils/html";

const SKILL_PAGES: { slug: string; subtype: string }[] = [
  { slug: "Active_Skill", subtype: "主动技能" },
  { slug: "Support_Skill", subtype: "辅助技能" },
  { slug: "Passive_Skill", subtype: "被动技能" },
  { slug: "Activation_Medium_Skill", subtype: "触媒技能" },
  { slug: "Triggered_Skill", subtype: "触发技能" },
  { slug: "Noble_Support_Skill", subtype: "崇高辅助技能" },
  { slug: "Magnificent_Support_Skill", subtype: "华贵辅助技能" },
];

export async function parseSkills(): Promise<WikiEntry[]> {
  const all: WikiEntry[] = [];
  const settled = await Promise.allSettled(
    SKILL_PAGES.map(p => parseSkillPage(p.slug, p.subtype))
  );
  for (const r of settled) {
    if (r.status === "fulfilled") all.push(...r.value);
  }
  return all;
}

function cleanDesc(raw: string): string {
  let d = stripTags(raw);
  // Remove level scaling data like (Lv1:37/5) (Lv21:77/5)
  d = d.replace(/\s*\(Lv\d+:[^)]+\)\s*/g, " ");
  return d.replace(/\s+/g, " ").trim();
}

async function parseSkillPage(slug: string, subtype: string): Promise<WikiEntry[]> {
  const html = await fetchHtml(slug);
  if (!html) return [];

  const entries: WikiEntry[] = [];
  const seen = new Set<string>();

  // === Step 1: Extract tags from grid view ===
  const tagMap: Record<string, string[]> = {};
  const gridRe = /<a[^>]*data-hover="[^"]*"[^>]*href="([^"]*)"[^>]*>([^<]+)<\/a>\s*<div>([\s\S]*?)<\/div>\s*<\/div>/gi;
  let gm;
  while ((gm = gridRe.exec(html)) !== null) {
    const href = gm[1];
    const tags: string[] = [];
    const tagRe = /data-filter="([^"]+)"/g;
    let tm;
    while ((tm = tagRe.exec(gm[3])) !== null) tags.push(tm[1]);
    if (tags.length > 0) tagMap[href] = tags;
  }

  // === Step 2: Extract descriptions from detail view ===
  // Detail blocks: <a data-hover href="xxx">技能名</a> followed by explicitMod divs
  // Split by detail blocks
  const detailParts = html.split(/<a[^>]*data-hover="[^"]*"[^>]*href="/);

  for (const part of detailParts) {
    // Extract href and name
    const headerMatch = part.match(/^([^"]+)"[^>]*>([^<]+)<\/a>/);
    if (!headerMatch) continue;
    const href = headerMatch[1];
    const name = headerMatch[2];

    // Only process detail view blocks (they have explicitMod)
    if (!part.includes('class="explicitMod"')) continue;
    if (seen.has(href)) continue;
    seen.add(href);

    // Extract all explicitMod content
    const modRe = /<div class="explicitMod">([\s\S]*?)<\/div>/g;
    const mods: string[] = [];
    let mm;
    while ((mm = modRe.exec(part)) !== null) {
      const mod = cleanDesc(mm[1]);
      if (mod && mod.length > 2) mods.push(mod);
    }

    // Also extract implicitMod (some skills have these)
    const implRe = /<div class="implicitMod">([\s\S]*?)<\/div>/g;
    while ((mm = implRe.exec(part)) !== null) {
      const mod = cleanDesc(mm[1]);
      if (mod && mod.length > 2) mods.push(mod);
    }

    const desc = mods.join(" ｜ ");
    if (!desc) continue;

    entries.push({
      category: "技能",
      name,
      description: desc,
      tags: tagMap[href],
      subtype,
      pageUrl: `${BASE}/${slug}`,
    });
  }

  return entries;
}
