"use client";
import { useState, FormEvent } from "react";
import { Sidebar } from "@/components/Sidebar";
import { Group } from "@/components/ResultGroup";

interface WikiEntry {
  category: string; name: string; description: string;
  tags?: string[]; source?: string; subtype?: string;
}
interface ResultGroup {
  category: string; pageUrl: string; entries: WikiEntry[]; isTable?: boolean;
}
interface SearchData { query: string; total: number; groups: ResultGroup[]; }

export default function Home() {
  const [query, setQuery] = useState("");
  const [data, setData] = useState<SearchData | null>(null);
  const [loading, setLoading] = useState(false);
  const [building, setBuilding] = useState(false);
  const [buildInfo, setBuildInfo] = useState("");
  const [error, setError] = useState("");
  const [activeFilters, setActiveFilters] = useState<Set<string>>(new Set());
  const [filterMode, setFilterMode] = useState<"all" | "picking">("all");

  async function doBuild() {
    setBuilding(true); setBuildInfo("正在抓取 Wiki 数据...");
    try {
      const r = await fetch("/api/build", { method: "POST" });
      const d = await r.json();
      setBuildInfo(d.ok ? `✅ ${d.total} 条（${(d.durationMs / 1000).toFixed(1)}s）` : "❌ 失败");
    } catch { setBuildInfo("❌ 失败"); }
    finally { setBuilding(false); }
  }

  async function doSearch(q: string) {
    if (!q.trim()) return;
    setLoading(true); setError(""); setData(null);
    setActiveFilters(new Set()); setFilterMode("all");
    try {
      const r = await fetch(`/api/search?q=${encodeURIComponent(q)}`);
      if (!r.ok) throw new Error();
      const d: SearchData = await r.json();
      if (d.total === -1) { setError("请先点击「构建数据」"); return; }
      setData(d);
      setActiveFilters(new Set(d.groups.map(g => g.category)));
    } catch { setError("搜索出错"); }
    finally { setLoading(false); }
  }

  function toggleFilter(cat: string) {
    if (filterMode === "all") {
      setActiveFilters(new Set([cat])); setFilterMode("picking");
    } else {
      setActiveFilters(prev => {
        const n = new Set(prev); if (n.has(cat)) n.delete(cat); else n.add(cat); return n;
      });
    }
  }

  function toggleAll() {
    if (!data) return;
    setActiveFilters(new Set(data.groups.map(g => g.category))); setFilterMode("all");
  }

  const filtered = data?.groups.filter(g => activeFilters.has(g.category)) || [];
  const filteredTotal = filtered.reduce((s, g) => s + g.entries.length, 0);

  return (
    <main className="min-h-screen bg-[#0c1018] text-gray-200">
      <header className="bg-[#141a24] border-b border-[#222c3a]">
        <div className="max-w-7xl mx-auto px-5 py-4 flex items-center justify-between">
          <h1 className="text-lg font-bold text-orange-400">🔥 火炬之光：无限 Wiki 搜索</h1>
          <div className="flex items-center gap-3">
            {buildInfo && <span className="text-xs text-gray-400">{buildInfo}</span>}
            <button onClick={doBuild} disabled={building}
              className="px-3 py-1.5 bg-[#1c2433] hover:bg-[#253040] disabled:opacity-50
                         border border-[#2a3545] rounded-lg text-xs text-gray-300">
              {building ? "构建中..." : "🔄 构建数据"}
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-5 py-5">
        <form onSubmit={(e: FormEvent) => { e.preventDefault(); doSearch(query); }} className="flex gap-2 max-w-3xl">
          <input type="text" value={query} onChange={e => setQuery(e.target.value)}
            placeholder="搜索机制、技能、装备、天赋..."
            className="flex-1 h-11 px-4 bg-[#0c1018] border border-[#222c3a] rounded-lg text-sm text-gray-200
                       placeholder-gray-500 focus:outline-none focus:border-orange-500/60" />
          <button type="submit" disabled={loading}
            className="h-11 px-6 bg-orange-600 hover:bg-orange-500 disabled:bg-gray-700 rounded-lg text-sm font-semibold">
            {loading ? "..." : "搜索"}
          </button>
        </form>

        {error && <p className="mt-3 text-red-400 text-sm">{error}</p>}
        {loading && <p className="mt-12 text-center text-gray-500">正在扫描 Wiki...</p>}

        {data && !loading && (
          <div className="mt-5 flex gap-6">
            <Sidebar groups={data.groups} total={data.total}
              activeFilters={activeFilters} filterMode={filterMode}
              onToggleFilter={toggleFilter} onToggleAll={toggleAll} />
            <div className="flex-1 min-w-0">
              <p className="text-xs text-gray-500 mb-4">显示 {filteredTotal} / {data.total} 条</p>
              <div className="space-y-5">
                {filtered.map((g, i) => <Group key={i} g={g} q={data.query} />)}
              </div>
              {data.total === 0 && <p className="text-gray-500 text-center py-16">未找到相关内容</p>}
            </div>
          </div>
        )}

        {!data && !loading && (
          <div className="text-center py-20">
            <p className="text-gray-500 mb-4">试试这些关键词</p>
            <div className="flex flex-wrap justify-center gap-2">
              {["纠缠", "冰结", "破击蓄能", "战意", "凋零", "麻痹", "法术迸发"].map(kw => (
                <button key={kw} onClick={() => { setQuery(kw); doSearch(kw); }}
                  className="px-4 py-2 bg-[#141a24] border border-[#222c3a] rounded-lg text-sm
                             text-gray-400 hover:text-orange-300 hover:border-orange-500/30">
                  {kw}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
