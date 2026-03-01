// Dataset: load pre-built wiki data from public/wiki-data.json
// Data is built at deploy time via scripts/build-data.ts

import { WikiEntry } from "./types";
import { readFileSync, existsSync } from "fs";
import { join } from "path";

let cache: WikiEntry[] | null = null;

export async function getDataset(): Promise<WikiEntry[]> {
  if (cache) return cache;

  // Try loading from public directory (built at deploy time)
  const publicPath = join(process.cwd(), "public/wiki-data.json");
  if (existsSync(publicPath)) {
    try {
      const raw = readFileSync(publicPath, "utf-8");
      const data = JSON.parse(raw);
      cache = data.entries || [];
      return cache!;
    } catch { /* fall through */ }
  }

  // Fallback: try root directory (local dev with manual build)
  const rootPath = join(process.cwd(), "wiki-data.json");
  if (existsSync(rootPath)) {
    try {
      const raw = readFileSync(rootPath, "utf-8");
      const data = JSON.parse(raw);
      cache = data.entries || [];
      return cache!;
    } catch { /* fall through */ }
  }

  return [];
}
