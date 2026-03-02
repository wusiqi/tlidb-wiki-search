# Wiki Search — 设计文档

## 架构概览

```
构建阶段（部署时）                         运行时
Wiki Pages ──→ 9 Parsers ──→ wiki-data.json ──→ Search API ──→ Frontend
  (tlidb.com)   (并行 fetch)   (public/, ~2MB)    (内存过滤)    (React)
```

### 两阶段分离

1. **构建阶段**：`npm run build` 触发 `scripts/build-data.ts`，并行 fetch 所有 Wiki 页面，9 个 parser 各自提取结构化数据，合并输出到 `public/wiki-data.json`（10000+ 条目）
2. **运行时**：搜索 API 从静态 JSON 加载数据到内存缓存，纯内存过滤，毫秒级响应。运行时不访问 wiki。

## 统一数据模型

```typescript
interface WikiEntry {
  category: string;     // 大类：游戏机制 | 技能 | 天赋 | 传奇装备 | 棱镜 | 契灵 | 命运 | 英雄 | 打造
  name: string;         // 名字：纠缠同调 | 法术纠缠 | 恶意缠绵 | 奇幻莫测
  description: string;  // 效果描述
  tags?: string[];      // 标签：[法术, 范围, 持续, 诅咒]
  source?: string;      // 来源（打造用）：法杖 | 项链
  subtype?: string;     // 子类型：至臻后缀 | 核心天赋·知识之神
  pageUrl: string;      // wiki 页面链接
}
```

所有 parser 输出统一的 `WikiEntry[]`，搜索和展示逻辑只需处理这一个类型。

## Parser 设计

每个 Wiki 类别有专门的 parser（`src/lib/parsers/`），针对该类别的 HTML 结构做定制化提取。

### 1. 游戏机制 (`mechanics.ts`)
- **数据源**：`/cn/Hyperlink` 页面
- **HTML 结构**：`<tr><td><a>词条名</a></td><td>描述</td></tr>`
- **提取**：正则匹配表格行，提取名字和描述

### 2. 技能 (`skills.ts`)
- **数据源**：7 个子页面（Active_Skill / Support_Skill / Passive_Skill / Activation_Medium_Skill / Triggered_Skill / Noble / Magnificent）
- **HTML 结构**：详情视图，`explicitMod` div 包含技能效果
- **提取**：按 data-hover 链接分块，提取名字、标签、效果描述

### 3. 天赋 (`talent.ts`)
- **数据源**：`/cn/Talent` 页面
- **HTML 结构**：`fw-bold` span 标识核心天赋，普通 span 标识小型/中型天赋
- **提取**：按 flex 容器分块，识别天赋类型和所属神系

### 4. 传奇装备 (`legendary.ts`)
- **数据源**：`/cn/Legendary_Gear` 页面
- **HTML 结构**：`data-hover` 链接 + `tierParent` div 包含词缀
- **提取**：按装备分块，自动从图片路径识别装备类型（头盔/项链/单手剑等），提取所有词缀
- **特殊**：装备类型作为 tag 输出，前端显示类型标签

### 5. 棱镜 (`prism.ts`)
- **数据源**：`/cn/Ethereal_Prism` 页面
- **HTML 结构**：表格行（col2 必须有链接，跳过 >200 字符的行）
- **提取**：正则匹配表格行

### 6. 契灵 (`pactspirit.ts`)
- **数据源**：`/cn/Pactspirit` 页面
- **HTML 结构**：`item_rarity` class + modifier div
- **提取**：按 data-hover 链接分块，提取契灵名和效果

### 7. 命运 (`destiny.ts`)
- **数据源**：`/cn/Destiny` 页面
- **HTML 结构**：content div 包含命运效果
- **提取**：按 data-hover 链接分块

### 8. 英雄 (`hero.ts`)
- **数据源**：25 个英雄详情页（并行 fetch）
- **HTML 结构**：`fw-bold` span 标识技能名，后续 div 包含效果
- **提取**：先从英雄列表页获取所有英雄链接，再逐个 fetch 详情页提取特性技能块
- **输出**：每个英雄的每个特性技能为独立 entry

### 9. 打造 (`craft.ts`)
- **数据源**：`/cn/Craft` 页面（统一词缀来源）
- **HTML 结构**：三列表格（效果 | 来源 | 类型）
- **提取**：正则匹配表格行，提取词缀效果、装备来源、词缀等级

## Search 阶段

```typescript
// 在所有字段上做 AND 匹配
function matchEntry(entry: WikiEntry, keywords: string[]): boolean {
  const searchable = [name, description, tags, source, subtype].join(" ");
  return keywords.every(k => searchable.includes(k));
}
```

### 后处理流程
1. **去重**：按 `category:name:source:description` 去重
2. **合并**：同 category + name + subtype 的多条 entry 合并 description（用 `｜` 分隔）
3. **分组**：按 category 分组，固定排序（打造 → 技能 → 天赋 → 传奇装备 → 棱镜 → 契灵 → 命运 → 英雄 → 游戏机制）

## 前端设计

### 布局
- **桌面**：三栏（左侧分类 Sidebar + 中间结果 + 右侧 TagPanel）
- **平板**：两栏（左侧 Sidebar + 中间结果，TagPanel 隐藏）
- **手机**：单栏（Sidebar 变为横向滚动 pills，TagPanel 隐藏）

### 组件
- `page.tsx`：主页面，搜索栏 + 布局编排
- `Sidebar.tsx`：分类过滤（首次点击单选，之后多选 toggle）
- `ResultGroup.tsx`：结果展示（打造用表格，英雄用嵌套布局，其他用卡片）
- `TagPanel.tsx`：常用标签面板（元素、技能类型、异常状态、装备类型、天赋、英雄等），可折叠分组
- `Highlight.tsx`：关键词高亮 + 多行描述渲染

### 搜索交互
- 多关键词搜索：Enter 添加 tag，✕ 移除，Backspace 删除最后一个
- 分类过滤：左侧 Sidebar 点击 toggle
- 标签快捷搜索：右侧 TagPanel 点击添加/移除关键词

## 数据加载

`dataset.ts` 从 `public/wiki-data.json` 读取数据，内存缓存。支持两个路径：
1. `public/wiki-data.json`（正常部署路径）
2. `wiki-data.json`（本地开发 fallback）

## 部署

- 平台：Vercel，连接 GitHub repo `wusiqi/tlidb-wiki-search`
- 根目录：`wiki-search`
- 自定义域名：`www.wsiq.cloud`（阿里云 DNS CNAME → cname.vercel-dns.com）
- 构建命令：`npm run build`（先 build-data.ts 再 next build）
- 更新数据：Redeploy 或 push commit
