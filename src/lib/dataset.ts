// Dataset: fetch entire wiki and store as structured data
// Triggered manually, results cached in memory + JSON file

import { WikiEntry } from "./types";
import { parseMechanics } from "./parsers/mechanics";
import { parseCraft } from "./parsers/craft";
import { parseSkills } from "./parsers/skills";
import { parseTalent } from "./parsers/talent";
import { parseLegendary } from "./parsers/legendary";
import { parseDestiny } from "./parsers/destiny";
import { parsePactspirit } from "./parsers/pactspirit";
import { parsePrism } from "./parsers/prism";
import { parseHero } from "./parsers/hero";
import { writeFile, readFile } from "fs/promises";
import { existsSync } from "fs";

const DATA_PATH = "wiki-data.json";

// In-memory cache
let cache: WikiEntry[] | null = null;
let lastBuild: string | null = null;

export interface BuildStatus {
  ok: boolean;
  total: number;
  categories: Record<string, number>;
  buildTime: string;
  durationMs: number;
}

// Build dataset: fetch all wiki pages, parse, save
export async function buildDataset(): Promise<BuildStatus> {
  const start = Date.now();

  const results = await Promise.allSettled([
    parseMechanics(),
    parseSkills(),
    parseTalent(),
    parseLegendary(),
    parseDestiny(),
    parsePactspirit(),
    parsePrism(),
    parseHero(),
    parseCraft(),
  ]);

  const all: WikiEntry[] = [];
  for (const r of results) {
    if (r.status === "fulfilled") all.push(...r.value);
  }

  // Save to file
  const buildTime = new Date().toISOString();
  await writeFile(DATA_PATH, JSON.stringify({ buildTime, entries: all }, null, 0));

  // Update cache
  cache = all;
  lastBuild = buildTime;

  // Stats
  const categories: Record<string, number> = {};
  for (const e of all) {
    categories[e.category] = (categories[e.category] || 0) + 1;
  }

  return {
    ok: true,
    total: all.length,
    categories,
    buildTime,
    durationMs: Date.now() - start,
  };
}

// Get dataset: from cache, or load from file
export async function getDataset(): Promise<WikiEntry[]> {
  if (cache) return cache;

  // Try loading from file
  if (existsSync(DATA_PATH)) {
    try {
      const raw = await readFile(DATA_PATH, "utf-8");
      const data = JSON.parse(raw);
      cache = data.entries || [];
      lastBuild = data.buildTime || null;
      return cache!;
    } catch {
      // File corrupted, return empty
    }
  }

  return [];
}

export function getLastBuild(): string | null {
  return lastBuild;
}
