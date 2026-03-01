interface ResultGroup {
  category: string;
  entries: { category: string }[];
}

interface SidebarProps {
  groups: ResultGroup[];
  total: number;
  activeFilters: Set<string>;
  filterMode: "all" | "picking";
  onToggleFilter: (cat: string) => void;
  onToggleAll: () => void;
}

export function Sidebar({ groups, total, activeFilters, filterMode, onToggleFilter, onToggleAll }: SidebarProps) {
  return (
    <aside className="w-44 shrink-0">
      <div className="sticky top-5 space-y-0.5">
        <button onClick={onToggleAll}
          className="w-full text-left px-3 py-2 rounded-lg text-xs text-gray-400 hover:text-gray-200 hover:bg-[#141a24]">
          {filterMode === "all" ? "全部" : "全选"}
          <span className="float-right text-gray-500">{total}</span>
        </button>
        <div className="border-t border-[#222c3a] my-1" />
        {groups.map(g => {
          const on = activeFilters.has(g.category);
          return (
            <button key={g.category} onClick={() => onToggleFilter(g.category)}
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
  );
}
