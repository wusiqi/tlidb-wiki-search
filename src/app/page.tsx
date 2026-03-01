"use client";
import { useState, FormEvent } from "react";

interface WikiEntry {
  category: string; name: string; description: string;
  tags?: string[]; source?: string; subtype?: string;
}
interface ResultGroup {
  category: string; pageUrl: string; entries: WikiEntry[]; isTable?: boolean;
}
interface SearchData { query: string; total: number; groups: ResultGroup[]; }

function Hl({ text, q }: { text: string; q: string }) {
  if (!q) return <>{text}</>;
  const kws = q.split(/\s+/).filter(Boolean);
  const re = new RegExp(`(${kws.map(k => k.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")).join("|")})`, "gi");
  return <>{text.split(re).map((p, i) =>
    re.test(p) ? <mark key={i} className="bg-orange-500/25 text-orange-200 rounded px-0.5">{p}</mark> : <span key={i}>{p}</span>
  )}</>;
}

function Desc({ text, q }: { text: string; q: string }) {
  const lines = text.split(" ｜ ").filter(Boolean);
  if (lines.length <= 1) return <Hl text={text} q={q} />;
  return (
    <ul className="space-y-1 list-none mt-1">
      {lines.map((line, i) => (
        <li key={i} className="text-[13px] text-gray-300 leading-relaxed pl-3 border-l-2 border-[#2a3040]">
          <Hl text={line.trim()} q={q} />
        </li>
      ))}
    </ul>
  );
}

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
      setBuildInfo(d.ok ? `✅ ${d.total} 条（${(d.durationMs/1000).toFixed(1)}s）` : "❌ 失败");
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
      {/* Header */}
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
        {/* Search */}
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
            {/* Sidebar */}
            <aside className="w-44 shrink-0">
              <div className="sticky top-5 space-y-0.5">
                <button onClick={toggleAll}
                  className="w-full text-left px-3 py-2 rounded-lg text-xs text-gray-400 hover:text-gray-200 hover:bg-[#141a24]">
                  {filterMode === "all" ? "全部" : "全选"}
                  <span className="float-right text-gray-500">{data.total}</span>
                </button>
                <div className="border-t border-[#222c3a] my-1" />
                {data.groups.map(g => {
                  const on = activeFilters.has(g.category);
                  return (
                    <button key={g.category} onClick={() => toggleFilter(g.category)}
                      className={`w-full text-left px-3 py-2 rounded-lg text-[13px] transition-colors ${
                        on ? "text-gray-100 bg-[#1c2433]" : "text-gray-500 hover:text-gray-300 hover:bg-[#141a24]"
                      }`}>
                      {g.category}
                      <span className={`float-right text-xs ${on ? "text-orange-400" : "text-gray-600"}`}>
                        {g.entries.length}
                      </span>
                    </button>
                  );
                })}
              </div>
            </aside>

            {/* Results */}
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

function Group({ g, q }: { g: ResultGroup; q: string }) {
  const slug = g.pageUrl.split("/").pop() || "";
  return (
    <section className="rounded-xl border border-[#222c3a] overflow-hidden">
      <div className="px-5 py-3 bg-[#141a24] flex items-center justify-between">
        <h2 className="text-sm font-bold text-gray-200">{g.category}</h2>
        <a href={g.pageUrl} target="_blank" rel="noopener noreferrer"
          className="text-xs text-gray-500 hover:text-blue-400">{slug} ↗</a>
      </div>
      {g.isTable ? <CraftTable entries={g.entries} q={q} />
        : g.category === "英雄" ? <HeroList entries={g.entries} q={q} />
        : <EntryList entries={g.entries} q={q} />}
    </section>
  );
}

function EntryList({ entries, q }: { entries: WikiEntry[]; q: string }) {
  return (
    <div className="divide-y divide-[#1c2433]">
      {entries.map((e, i) => (
        <div key={i} className="px-5 py-3 hover:bg-[#141a24]/60">
          <div className="flex items-center gap-2 mb-1.5">
            {e.name && <span className="text-sm font-semibold text-blue-300">{e.name}</span>}
            {e.subtype && <span className="text-[11px] text-gray-500 bg-[#1c2433] px-2 py-0.5 rounded">{e.subtype}</span>}
            {e.tags && e.tags.length > 0 && (
              <div className="flex gap-1 ml-auto">
                {e.tags.map((t, j) => (
                  <span key={j} className="text-[11px] text-gray-400 bg-[#1c2433] px-2 py-0.5 rounded">{t}</span>
                ))}
              </div>
            )}
          </div>
          <div className="text-[13px] leading-relaxed text-gray-300">
            <Desc text={e.description} q={q} />
          </div>
        </div>
      ))}
    </div>
  );
}

function HeroList({ entries, q }: { entries: WikiEntry[]; q: string }) {
  const groups: { header: WikiEntry; skills: WikiEntry[] }[] = [];
  for (const e of entries) {
    if (e.name.includes("|")) groups.push({ header: e, skills: [] });
    else if (groups.length > 0) groups[groups.length - 1].skills.push(e);
  }
  return (
    <div className="divide-y divide-[#1c2433]">
      {groups.map((g, gi) => (
        <div key={gi}>
          <div className="px-5 py-3 bg-[#141a24]/40">
            <span className="text-sm font-bold text-orange-300">{g.header.name}</span>
            {g.header.subtype && (
              <span className="ml-2 text-[11px] text-gray-500 bg-[#1c2433] px-2 py-0.5 rounded">{g.header.subtype}</span>
            )}
            <p className="text-[13px] text-gray-300 mt-1.5 leading-relaxed">
              <Hl text={g.header.description} q={q} />
            </p>
          </div>
          {g.skills.map((s, si) => (
            <div key={si} className="pl-10 pr-5 py-2.5 hover:bg-[#141a24]/40 border-t border-[#1c2433]/60">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-[13px] font-semibold text-blue-300">{s.name}</span>
                {s.subtype && (
                  <span className="text-[11px] text-gray-500">{s.subtype.split("·").pop()}</span>
                )}
              </div>
              <p className="text-[13px] text-gray-400 leading-relaxed">
                <Hl text={s.description} q={q} />
              </p>
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}

function CraftTable({ entries, q }: { entries: WikiEntry[]; q: string }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-[13px]">
        <thead>
          <tr className="text-gray-400 border-b border-[#222c3a]">
            <th className="text-left py-2.5 px-5 font-medium">词缀效果</th>
            <th className="text-left py-2.5 px-4 font-medium w-24">来源</th>
            <th className="text-left py-2.5 px-4 font-medium w-24">类型</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-[#1c2433]/60">
          {entries.map((e, i) => (
            <tr key={i} className="hover:bg-[#141a24]/60">
              <td className="py-2.5 px-5 text-gray-300"><Hl text={e.description} q={q} /></td>
              <td className="py-2.5 px-4 text-gray-400">{e.source}</td>
              <td className="py-2.5 px-4 text-gray-400">{e.subtype}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
