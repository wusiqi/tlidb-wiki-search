# 🔥 火炬之光：无限 Wiki 搜索

**在线访问：[www.wsiq.cloud](https://www.wsiq.cloud)**

一个针对 [tlidb.com](https://tlidb.com) 游戏 Wiki 的结构化搜索工具，帮助玩家快速查找游戏机制、技能、装备、天赋等信息。

## 功能

- **结构化数据解析**：从 Wiki 页面提取 10000+ 条结构化数据，覆盖游戏机制、技能、天赋、传奇装备、棱镜、契灵、命运、英雄特性、打造词缀等
- **多关键词搜索**：支持多个关键词 AND 搜索，回车添加关键词 tag，点击 ✕ 移除，Backspace 删除最后一个
- **分类过滤**：左侧 sidebar 按类别过滤结果，首次点击单选，之后多选
- **常用标签面板**：右侧快捷标签（元素、技能类型、异常状态、装备类型、天赋、英雄等），点击 toggle 添加/移除搜索关键词
- **打造词缀表格**：打造类结果以三列表格展示（词缀效果 | 来源 | 类型）
- **传奇装备类型标签**：自动识别装备类型（头盔/项链/单手剑等）
- **英雄特性嵌套**：英雄特性技能以嵌套结构展示，包含需求等级和效果描述
- **关键词高亮**：搜索结果中关键词橙色高亮
- **多行词缀展示**：传奇装备词缀按 `｜` 分隔为独立行
- **响应式布局**：桌面三栏、平板两栏、手机单栏（横向滚动 filter pills）

## 架构

```
构建阶段（部署时）                    运行时
Wiki Pages ──→ Parsers ──→ public/wiki-data.json ──→ Search API ──→ Frontend
               (9 parsers)    (10000+ entries)        (内存过滤)
```

- **构建阶段**：`npm run build` 时自动执行 `scripts/build-data.ts`，并行 fetch 所有 Wiki 页面，每个类别有专门的 parser 提取结构化数据，输出到 `public/wiki-data.json`
- **运行时**：搜索 API 从静态 JSON 加载数据到内存，纯内存过滤，毫秒级响应

## 项目结构

```
scripts/
  build-data.ts             构建脚本（部署时 fetch wiki 数据）
src/
  app/                      Next.js 页面 & API
    api/search/             GET 搜索接口
    page.tsx                主页面（搜索栏 + 布局）
  components/               UI 组件
    Highlight.tsx           关键词高亮 + 多行描述
    Sidebar.tsx             分类过滤侧栏
    ResultGroup.tsx         结果展示（卡片/表格/英雄嵌套）
    TagPanel.tsx            常用标签面板
  lib/                      核心逻辑
    types.ts                数据模型（WikiEntry, SearchResponse, ResultGroup）
    dataset.ts              数据加载 & 内存缓存
    search.ts               搜索、去重、合并、分组
    parsers/                Wiki 解析器（每个类别一个文件）
      index.ts              统一导出
      mechanics.ts          游戏机制词条（Hyperlink 页面，表格结构）
      skills.ts             技能（7 个子页面，详情视图提取）
      talent.ts             天赋系统（核心/小型/中型天赋）
      legendary.ts          传奇装备（装备类型自动识别）
      prism.ts              棱镜（表格行提取）
      pactspirit.ts         契灵（modifier div 提取）
      destiny.ts            命运（content div 提取）
      hero.ts               英雄特性（25 个详情页并行 fetch）
      craft.ts              打造词缀（三列表格）
    utils/
      html.ts               HTML 工具函数（stripTags, fetchHtml）
docs/                       设计文档
```

## 开发

```bash
cd wiki-search
npm install

# 本地开发（需要先构建数据）
npm run build:data        # 单独构建 wiki 数据
npm run dev               # 启动开发服务器

# 完整构建（构建数据 + Next.js）
npm run build
npm start
```

## 部署

项目部署在 [Vercel](https://vercel.com)，连接 GitHub repo，push 自动部署。

`npm run build` 会先执行 `scripts/build-data.ts` fetch wiki 数据，再构建 Next.js。数据在部署时生成，运行时无需访问 wiki。

要更新数据：在 Vercel dashboard 点 Redeploy，或 push 任意 commit。

## 技术栈

- Next.js 14 + TypeScript
- Tailwind CSS
- Vercel（部署）
- 数据来源：[tlidb.com](https://tlidb.com)（火炬之光：无限 中文 Wiki）
