// Build script: fetch wiki data during next build
// Run via: npx tsx scripts/build-data.ts

import { writeFileSync, mkdirSync } from "fs";
import { join } from "path";

// Import parsers directly (can't use path aliases in standalone script)
async function main() {
  console.log("🔄 Building wiki dataset...");
  const start = Date.now();

  // Dynamic imports to avoid path alias issues
  const { parseMechanics } = await import("../src/lib/parsers/mechanics");
  const { parseCraft } = await import("../src/lib/parsers/craft");
  const { parseSkills } = await import("../src/lib/parsers/skills");
  const { parseTalent } = await import("../src/lib/parsers/talent");
  const { parseLegendary } = await import("../src/lib/parsers/legendary");
  const { parseDestiny } = await import("../src/lib/parsers/destiny");
  const { parsePactspirit } = await import("../src/lib/parsers/pactspirit");
  const { parsePrism } = await import("../src/lib/parsers/prism");
  const { parseHero } = await import("../src/lib/parsers/hero");

  const results = await Promise.allSettled([
    parseMechanics(), parseSkills(), parseTalent(), parseLegendary(),
    parseDestiny(), parsePactspirit(), parsePrism(), parseHero(), parseCraft(),
  ]);

  const entries: unknown[] = [];
  for (const r of results) {
    if (r.status === "fulfilled") entries.push(...r.value);
  }

  const outPath = join(__dirname, "../public/wiki-data.json");
  mkdirSync(join(__dirname, "../public"), { recursive: true });
  const data = { buildTime: new Date().toISOString(), entries };
  writeFileSync(outPath, JSON.stringify(data));

  const duration = ((Date.now() - start) / 1000).toFixed(1);
  console.log(`✅ Built ${entries.length} entries in ${duration}s → public/wiki-data.json`);
}

main().catch(e => { console.error("❌ Build failed:", e); process.exit(1); });
