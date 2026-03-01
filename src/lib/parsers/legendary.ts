// Parser: 传奇装备 (Legendary_Gear page)
// Structure: <a data-hover href="xxx">装备名</a><br/>需求等级 N
//            followed by <div class="tierParent"> with tier divs

import { WikiEntry } from "../types";
import { stripTags, fetchHtml, BASE } from "../utils/html";

export async function parseLegendary(): Promise<WikiEntry[]> {
  const html = await fetchHtml("Legendary_Gear");
  if (!html) return [];

  const entries: WikiEntry[] = [];
  const seen = new Set<string>();

  // Split by gear blocks
  const blocks = html.split(/(?=<a[^>]*data-hover[^>]*href="[^"]*">[^<]{2,30}<\/a>\s*<br\s*\/?>\s*需求等级)/);

  for (const block of blocks) {
    const nameMatch = block.match(/<a[^>]*data-hover[^>]*href="[^"]*">([^<]{2,30})<\/a>\s*<br\s*\/?>\s*需求等级/);
    if (!nameMatch) continue;
    const name = nameMatch[1];
    if (seen.has(name)) continue;
    seen.add(name);

    // Extract gear type from image path: Icon_Equip_{Type}_{Subtype}_xxx
    const gearType = extractGearType(block);

    // Extract each tier div — use the FULL div content, not just inner span
    // Tier divs: <div class="t1">...all content...</div>
    // We need to handle nested divs, so match from class="t to the tier-level closing
    const mods: string[] = [];
    const tierRe = /<div class="t\d+"><span class="tier[^"]*"><\/span>([\s\S]*?)(?=<\/div><div class="t\d+">|<\/div><\/div>)/g;
    let tm;
    while ((tm = tierRe.exec(block)) !== null) {
      const mod = stripTags(tm[1]);
      if (mod && mod.length > 1) mods.push(mod);
    }

    // Fallback: if tier regex didn't work, try extracting from tierParent
    if (mods.length === 0) {
      const tierParent = block.match(/<div class="tierParent">([\s\S]*?)(?=<\/div>\s*<\/div>\s*<\/div>)/);
      if (tierParent) {
        const desc = stripTags(tierParent[1]);
        if (desc && desc.length > 3) mods.push(desc);
      }
    }

    if (mods.length === 0) continue;

    entries.push({
      category: "传奇装备",
      name,
      description: mods.join(" ｜ "),
      source: gearType,
      pageUrl: `${BASE}/Legendary_Gear`,
    });
  }
  return entries;
}

const GEAR_TYPE_MAP: Record<string, string> = {
  "Armor": "胸甲", "Helmet": "头盔", "Gloves": "手套",
  "Shoes": "鞋子", "Belt": "腰带", "Ring": "戒指", "Amulet": "项链",
  "Shield": "盾", "Wand": "法杖", "Staff": "锡杖",
  "1HSword": "单手剑", "2HSword": "双手剑",
  "1HAxe": "单手斧", "2HAxe": "双手斧",
  "1HMace": "单手锤", "2HMace": "双手锤",
  "Dagger": "匕首", "Claw": "爪",
  "Bow": "弓", "crossbow": "弩",
  "Pistol": "手枪", "Shotgun": "火枪",
};

function extractGearType(block: string): string {
  // Try weapon subtype first: Icon_Equip_Weapon_{Subtype}_
  const weaponMatch = block.match(/Icon_Equip_Weapon_(\w+?)_/);
  if (weaponMatch && GEAR_TYPE_MAP[weaponMatch[1]]) {
    return GEAR_TYPE_MAP[weaponMatch[1]];
  }
  // Try general type: Icon_Equip_{Type}_
  const typeMatch = block.match(/Icon_Equip_(\w+?)_/);
  if (typeMatch && GEAR_TYPE_MAP[typeMatch[1]]) {
    return GEAR_TYPE_MAP[typeMatch[1]];
  }
  return "";
}
