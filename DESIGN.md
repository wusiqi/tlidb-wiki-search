# Wiki Search v2 — 设计文档

## 架构概览

```
[Wiki Pages] → [Fetch & Parse] → [Structured Data] → [Search] → [Cleanup] → [Frontend]
```

三个阶段：
1. **Fetch & Parse**：每个大类有专门的 parser，从 HTML 提取结构化数据
2. **Search**：在结构化数据的字段上做关键词匹配
3. **Cleanup & Present**：去重、排序、分组，输出给前端

## 统一数据模型

```typescript
interface WikiEntry {
  category: string;     // 大类：游戏机制 | 技能 | 天赋 | 传奇装备 | 棱镜 | 契灵 | 命运 | 打造
  name: string;         // 名字：纠缠同调 | 法术纠缠 | 恶意缠绵 | 奇幻莫测
  description: string;  // 效果描述
  tags?: string[];      // 标签：[法术, 范围, 持续, 诅咒]
  source?: string;      // 来源（打造用）：法杖 | 项链
  subtype?: string;     // 子类型：至臻后缀 | 核心天赋 | 小型天赋·知识之神
  pageUrl: string;      // wiki 页面链接
}
```

所有 parser 输出同一个 `WikiEntry[]`，搜索和展示逻辑只需要处理这一个类型。

## 各大类 Parser 设计

### 1. 游戏机制 (Hyperlink)
- **HTML 结构**：`<tr><td><a>词条名</a></td><td>描述</td></tr>` — 纯表格
- **提取方式**：正则匹配 `<tr><td>` 行，提取名字和描述
- **输出**：`{ category: "游戏机制", name: "纠缠同调", description: "拥有纠缠同调时..." }`

### 2. 英雄 (Hero)
- **HTML 结构**：`<div class="d-flex">` 容器，英雄名在链接里，特性描述在 div 里
- **提取方式**：按 flex 容器分块，提取英雄名和特性描述
- **输出**：`{ category: "英雄", name: "雷恩|怒影", description: "受到远古祖灵的庇佑..." }`

### 3. 天赋 (Talent)
- **HTML 结构**：
  - 核心天赋：`<span class="fw-bold">天赋名</span>` + 效果描述
  - 小型/中型天赋：`<span>小型天赋</span><span><a>知识之神</a></span>` + 效果
- **提取方式**：按 flex 容器分块，识别 fw-bold（核心）和 span（小型/中型）
- **输出**：`{ category: "天赋", name: "奇幻莫测", subtype: "核心天赋·知识之神", description: "你可以对敌人附着1个额外纠缠 额外-30%纠缠技能范围" }`

### 4. 传奇装备 (Legendary_Gear)
- **HTML 结构**：`<a data-hover>装备名</a><br/>需求等级` + `<div class="tierParent">` 里的词缀
- **提取方式**：按 data-hover 链接分块，提取装备名，再从 tierParent 提取所有词缀
- **输出**：`{ category: "传奇装备", name: "恶意缠绵", description: "+2纠缠数量上限 | 每有1个激活纠缠，暴击时额外+(25-35)%伤害" }`

### 5. 棱镜 (Ethereal_Prism)
- **HTML 结构**：混合 — 表格（词缀）+ flex 容器（棱镜本体）
- **提取方式**：flex 容器提取棱镜名和效果，表格提取可出现词缀
- **输出**：`{ category: "棱镜", name: "棱镜名", description: "效果..." }`

### 6. 契灵 (Pactspirit)
- **HTML 结构**：`<a data-hover>契灵名</a>` + flex 容器里的效果描述
- **提取方式**：按 data-hover 链接分块
- **输出**：`{ category: "契灵", name: "花语者", description: "增加投射物伤害..." }`

### 7. 命运 (Destiny)
- **HTML 结构**：`<a data-hover>天命名</a>` + div 里的效果
- **提取方式**：按 data-hover 链接分块
- **输出**：`{ category: "命运", name: "双生天命：怨偶", description: "每有一个未激活纠缠..." }`

### 8. 技能 (Active_Skill / Support_Skill / Passive_Skill / Activation_Medium_Skill / Noble / Magnificent)
- **HTML 结构**：`<a data-hover>技能名</a>` + `<div>标签列表</div>` + 效果描述
- **提取方式**：按 data-hover 链接分块，提取名字、标签、效果
- **输出**：`{ category: "技能", name: "法术纠缠", tags: ["辅助","法术"], subtype: "辅助技能", description: "被辅助技能以法术纠缠的形式释放..." }`

### 9. 打造 (Craft)
- **HTML 结构**：`<tr><td>效果</td><td>来源</td><td>类型</td></tr>` — 纯表格
- **提取方式**：已实现，正则匹配表格行
- **输出**：`{ category: "打造", name: "", source: "法杖", subtype: "至臻后缀", description: "+(60-70)%纠缠伤害加深" }`

## Search 阶段

```typescript
function search(entries: WikiEntry[], keywords: string[]): WikiEntry[] {
  return entries.filter(e => {
    const searchable = `${e.name} ${e.description} ${e.tags?.join(" ") || ""} ${e.source || ""} ${e.subtype || ""}`;
    return keywords.every(k => searchable.toLowerCase().includes(k.toLowerCase()));
  });
}
```

在所有字段上匹配关键词，简单直接。

## Cleanup 阶段

1. **去重**：按 `name + description` 去重
2. **排序**：name 里包含关键词的排前面，description 里包含的排后面
3. **分组**：按 category 分组
4. **合并**：同一个 name 的多条 description 合并成一条

## 前端展示

- **打造**：表格（词缀效果 | 来源 | 类型）
- **其他类别**：卡片（蓝色标签名字 + 灰色描述文本）
- 关键词高亮
