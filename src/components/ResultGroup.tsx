import { Hl, Desc } from "./Highlight";

interface WikiEntry {
  category: string; name: string; description: string;
  tags?: string[]; source?: string; subtype?: string;
}

interface GroupData {
  category: string; pageUrl: string; entries: WikiEntry[]; isTable?: boolean;
}

export function Group({ g, q }: { g: GroupData; q: string }) {
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
                {s.subtype && <span className="text-[11px] text-gray-500">{s.subtype.split("·").pop()}</span>}
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
