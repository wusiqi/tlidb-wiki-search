"use client";
import { useState } from "react";

interface TagGroup {
  label: string;
  tags: string[];
}

const TAG_GROUPS: TagGroup[] = [
  {
    label: "元素",
    tags: ["物理", "火焰", "冰冷", "闪电", "腐蚀"],
  },
  {
    label: "技能类型",
    tags: ["攻击", "法术", "近战", "投射物", "范围", "持续", "引导", "召唤", "光环", "位移", "战吼", "诅咒", "哨卫", "连携"],
  },
  {
    label: "异常状态",
    tags: ["点燃", "冰结", "冰封", "麻痹", "凋零", "创伤", "震慑"],
  },
  {
    label: "增益机制",
    tags: ["战意", "迷踪", "屏障", "坚韧祝福", "灵动祝福", "聚能祝福", "法术迸发", "纠缠", "统御"],
  },
  {
    label: "单手武器",
    tags: ["单手剑", "单手斧", "单手锤", "匕首", "爪", "手枪", "法杖"],
  },
  {
    label: "双手武器",
    tags: ["双手剑", "双手斧", "双手锤", "弓", "弩", "火枪", "锡杖", "灵杖"],
  },
  {
    label: "防具",
    tags: ["头部", "胸甲", "手套", "鞋子", "盾"],
  },
  {
    label: "饰品",
    tags: ["项链", "戒指", "灵戒", "腰带"],
  },
  {
    label: "天赋",
    tags: ["巨力之神", "狩猎之神", "知识之神", "征战之神", "欺诈之神", "机械之神"],
  },
  {
    label: "英雄",
    tags: ["雷恩", "卡里诺", "艾瑞卡", "宾", "吉玛", "希雅", "尤加", "莫托", "罗莎", "伊瑞斯", "赛琳娜"],
  },
];

interface TagPanelProps {
  onAddTag: (tag: string) => void;
  activeKeywords: string[];
}

export function TagPanel({ onAddTag, activeKeywords }: TagPanelProps) {
  const [expanded, setExpanded] = useState<Set<string>>(new Set(["元素", "技能类型"]));

  function toggle(label: string) {
    setExpanded(prev => {
      const n = new Set(prev);
      if (n.has(label)) n.delete(label); else n.add(label);
      return n;
    });
  }

  return (
    <aside className="w-40 shrink-0">
      <div className="sticky top-5">
        <p className="text-[11px] text-gray-500 mb-2 px-1">常用标签</p>
        <div className="space-y-1">
          {TAG_GROUPS.map(g => (
            <div key={g.label}>
              <button onClick={() => toggle(g.label)}
                className="w-full text-left px-2 py-1.5 rounded text-[12px] text-gray-400
                           hover:text-gray-200 hover:bg-[#141a24] transition-colors flex items-center gap-1">
                <span className={`text-[10px] transition-transform ${expanded.has(g.label) ? "rotate-90" : ""}`}>▶</span>
                {g.label}
              </button>
              {expanded.has(g.label) && (
                <div className="flex flex-wrap gap-1 px-2 pb-2 pt-1">
                  {g.tags.map(tag => {
                    const active = activeKeywords.includes(tag);
                    return (
                      <button key={tag} onClick={() => onAddTag(tag)}
                        className={`px-2 py-0.5 rounded text-[11px] transition-colors ${
                          active
                            ? "bg-orange-600/30 text-orange-300 border border-orange-500/30"
                            : "bg-[#1c2433] text-gray-400 border border-transparent hover:text-gray-200 hover:border-[#2a3545]"
                        }`}>
                        {tag}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </aside>
  );
}
