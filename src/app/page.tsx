"use client";
import { useState, useCallback, KeyboardEvent } from "react";
import { Sidebar } from "@/components/Sidebar";
import { Group } from "@/components/ResultGroup";
import { TagPanel } from "@/components/TagPanel";

interface WikiEntry {
  category: string; name: string; description: string;
  tags?: string[]; source?: string; subtype?: string;
}
interface ResultGroup {
  category: string; pageUrl: string; entries: WikiEntry[]; isTable?: boolean;
}
interface SearchData { query: string; total: number; groups: ResultGroup[]; }

export default function Home() {
  const [input, setInput] = useState("");
  const [keywords, setKeywords] = useState<string[]>([]);
  const [data, setData] = useState<SearchData | null>(null);
  const [loading, setLoading] = useState(false);
  const [building, setBuilding] = useState(false);
  const [buildInfo, setBuildInfo] = useState("");
  const [error, setError] = useState("");
  const [activeFilters, setActiveFilters] = useState<Set<string>>(new Set());
  const [filterMode, setFilterMode] = useState<"all" | "picking">("all");

  const doSearch = useCallback(async (kws: string[]) => {
    if (kws.length === 0) { setData(null); return; }
    const q = kws.join(" ");
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
  }, []);

  function addKeyword() {
    const kw = input.trim();
    if (!kw || keywords.includes(kw)) return;
    const next = [...keywords, kw];
    setKeywords(next);
    setInput("");
    doSearch(next);
  }

  function addTag(tag: string) {
    if (keywords.includes(tag)) {
      removeKeyword(tag); // toggle off if already active
    } else {
      const next = [...keywords, tag];
      setKeywords(next);
      doSearch(next);
    }
  }

  function removeKeyword(kw: string) {
    const next = keywords.filter(k => k !== kw);
    setKeywords(next);
    doSearch(next);
  }

  function handleKeyDown(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter") { e.preventDefault(); addKeyword(); }
    if (e.key === "Backspace" && input === "" && keywords.length > 0) {
      removeKeyword(keywords[keywords.length - 1]);
    }
  }

  async function doBuild() {
    setBuilding(true); setBuildInfo("正在抓取 Wiki 数据...");
    try {
      const r = await fetch("/api/build", { method: "POST" });
      const d = await r.json();
      setBuildInfo(d.ok ? `✅ ${d.total} 条（${(d.durationMs / 1000).toFixed(1)}s）` : "❌ 失败");
    } catch { setBuildInfo("❌ 失败"); }
    finally { setBuilding(false); }
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

  function quickSearch(kw: string) {
    setKeywords([kw]); setInput(""); doSearch([kw]);
  }

  const filtered = data?.groups.filter(g => activeFilters.has(g.category)) || [];
  const filteredTotal = filtered.reduce((s, g) => s + g.entries.length, 0);
  const queryStr = keywords.join(" ");

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
        {/* Search bar with keyword tags */}
        <div>
          <div className="flex items-center gap-2 min-h-[44px] px-3 bg-[#0c1018] border border-[#222c3a]
                          rounded-lg focus-within:border-orange-500/60 transition-colors flex-wrap">
            {keywords.map(kw => (
              <span key={kw} className="flex items-center gap-1 px-2.5 py-1 bg-orange-600/20 border border-orange-500/30
                                        rounded-md text-sm text-orange-300 shrink-0">
                {kw}
                <button onClick={() => removeKeyword(kw)}
                  className="text-orange-400/60 hover:text-orange-300 text-xs ml-0.5">✕</button>
              </span>
            ))}
            <input type="text" value={input} onChange={e => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={keywords.length === 0 ? "输入关键词，回车添加..." : "继续添加关键词..."}
              className="flex-1 min-w-[120px] h-9 bg-transparent text-sm text-gray-200
                         placeholder-gray-500 focus:outline-none" />
            <button onClick={addKeyword} disabled={loading || !input.trim()}
              className="px-4 py-1.5 bg-orange-600 hover:bg-orange-500 disabled:bg-gray-700
                         rounded-md text-sm font-semibold shrink-0">
              {loading ? "..." : "搜索"}
            </button>
          </div>
        </div>

        {error && <p className="mt-3 text-red-400 text-sm">{error}</p>}
        {loading && <p className="mt-12 text-center text-gray-500">正在扫描 Wiki...</p>}

        {data && !loading && (
          <div className="mt-5 flex gap-6">
            <div className="hidden lg:block">
              <Sidebar groups={data.groups} total={data.total}
                activeFilters={activeFilters} filterMode={filterMode}
                onToggleFilter={toggleFilter} onToggleAll={toggleAll} />
            </div>
            <div className="flex-1 min-w-0">
              {/* Mobile filter bar */}
              <div className="lg:hidden flex gap-2 mb-3 overflow-x-auto pb-1">
                {data.groups.map(g => {
                  const on = activeFilters.has(g.category);
                  return (
                    <button key={g.category} onClick={() => toggleFilter(g.category)}
                      className={`shrink-0 px-3 py-1 rounded-full text-xs transition-colors ${
                        on ? "bg-orange-600/20 text-orange-300 border border-orange-500/30"
                           : "bg-[#1c2433] text-gray-500 border border-transparent"
                      }`}>
                      {g.category} {g.entries.length}
                    </button>
                  );
                })}
              </div>
              <p className="text-xs text-gray-500 mb-4">显示 {filteredTotal} / {data.total} 条</p>
              <div className="space-y-5">
                {filtered.map((g, i) => <Group key={i} g={g} q={queryStr} />)}
              </div>
              {data.total === 0 && <p className="text-gray-500 text-center py-16">未找到相关内容</p>}
            </div>
            <div className="hidden xl:block">
              <TagPanel onAddTag={addTag} activeKeywords={keywords} />
            </div>
          </div>
        )}

        {!data && !loading && (
          <div className="mt-5 flex gap-6">
            <div className="flex-1">
              <div className="text-center py-20">
                <p className="text-gray-500 mb-4">试试这些关键词</p>
                <div className="flex flex-wrap justify-center gap-2">
                  {["纠缠", "冰结", "破击蓄能", "战意", "凋零", "麻痹", "法术迸发"].map(kw => (
                    <button key={kw} onClick={() => quickSearch(kw)}
                      className="px-4 py-2 bg-[#141a24] border border-[#222c3a] rounded-lg text-sm
                                 text-gray-400 hover:text-orange-300 hover:border-orange-500/30">
                      {kw}
                    </button>
                  ))}
                </div>
              </div>
            </div>
            <div className="hidden xl:block">
              <TagPanel onAddTag={addTag} activeKeywords={keywords} />
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
