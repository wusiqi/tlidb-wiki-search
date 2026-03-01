// Search: operates on pre-built dataset, pure in-memory filtering

import { WikiEntry, SearchResponse, ResultGroup } from "./types";
import { getDataset } from "./dataset";

function matchEntry(entry: WikiEntry, keywords: string[]): boolean {
  const searchable = [
    entry.name, entry.description,
    entry.tags?.join(" ") || "",
    entry.source || "", entry.subtype || "",
  ].join(" ").toLowerCase();
  return keywords.every(k => searchable.includes(k.toLowerCase()));
}

function cleanup(entries: WikiEntry[]): WikiEntry[] {
  const seen = new Set<string>();
  const deduped: WikiEntry[] = [];
  for (const e of entries) {
    const key = `${e.category}:${e.name}:${e.source || ""}:${e.description}`;
    if (seen.has(key)) continue;
    seen.add(key);
    deduped.push(e);
  }

  const merged: WikiEntry[] = [];
  for (const e of deduped) {
    if (e.name && e.category !== "打造" && e.category !== "棱镜") {
      const existing = merged.find(
        m => m.category === e.category && m.name === e.name && m.subtype === e.subtype
      );
      if (existing) {
        existing.description += " ｜ " + e.description;
        continue;
      }
    }
    merged.push({ ...e });
  }
  return merged;
}

function groupResults(entries: WikiEntry[]): ResultGroup[] {
  const order = [
    "打造", "技能", "天赋", "传奇装备",
    "棱镜", "契灵", "命运", "英雄", "游戏机制",
  ];
  const byCategory: Record<string, WikiEntry[]> = {};
  for (const e of entries) {
    if (!byCategory[e.category]) byCategory[e.category] = [];
    byCategory[e.category].push(e);
  }
  const groups: ResultGroup[] = [];
  const ordered = [
    ...order.filter(c => byCategory[c]),
    ...Object.keys(byCategory).filter(c => !order.includes(c)),
  ];
  for (const cat of ordered) {
    const catEntries = byCategory[cat];
    if (!catEntries || catEntries.length === 0) continue;
    groups.push({
      category: cat,
      pageUrl: catEntries[0].pageUrl,
      entries: catEntries,
      isTable: cat === "打造",
    });
  }
  return groups;
}

export async function searchWiki(query: string): Promise<SearchResponse> {
  const keywords = query.split(/\s+/).filter(Boolean);
  if (keywords.length === 0) {
    return { query, total: 0, groups: [] };
  }

  const dataset = await getDataset();
  if (dataset.length === 0) {
    return { query, total: -1, groups: [] }; // -1 = no dataset
  }

  const matched = dataset.filter(e => matchEntry(e, keywords));
  const cleaned = cleanup(matched);
  const groups = groupResults(cleaned);
  const total = groups.reduce((s, g) => s + g.entries.length, 0);
  return { query, total, groups };
}
