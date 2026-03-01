# 🔥 火炬之光：无限 Wiki 搜索

一个针对 [tlidb.com](https://tlidb.com) 游戏 Wiki 的结构化搜索工具，帮助玩家快速查找游戏机制、技能、装备、天赋等信息。

## 功能

- **结构化数据解析**：从 Wiki 页面提取 10000+ 条结构化数据，覆盖游戏机制、技能、天赋、传奇装备、棱镜、契灵、命运、英雄特性、打造词缀等
- **多关键词搜索**：支持多个关键词 AND 搜索，回车添加关键词 tag，点击 ✕ 移除
- **分类过滤**：左侧 sidebar 按类别过滤结果，支持单选和多选
- **常用标签面板**：右侧快捷标签（元素、技能类型、装备类型、英雄等），点击直接添加为搜索关键词
- **打造词缀表格**：打造类结果以表格形式展示（词缀效果 | 来源 | 类型）
- **英雄特性嵌套**：英雄特性技能以嵌套结构展示，包含需求等级和效果描述
- **关键词高亮**：搜索结果中关键词橙色高亮
- **响应式布局**：适配桌面、平板、手机

## 架构

```
数据构建（一次性）          搜索（即时）
Wiki Pages ──→ Parsers ──→ wiki-data.json ──→ Search ──→ Frontend
```

- **构建阶段**：点击「构建数据」按钮，并行 fetch Wiki 页面，每个类别有专门的 parser 提取结构化数据，存储为 JSON
- **搜索阶段**：纯内存过滤，毫秒级响应

## 项目结构

```
src/
  app/                      Next.js 页面 & API
    api/build/              POST 触发数据构建
    api/search/             GET 搜索接口
    page.tsx                主页面
  components/               UI 组件
    Highlight.tsx           关键词高亮
    Sidebar.tsx             分类过滤侧栏
    ResultGroup.tsx         结果展示（卡片/表格/英雄嵌套）
    TagPanel.tsx            常用标签面板
  lib/                      核心逻辑
    types.ts                数据模型
    dataset.ts              数据构建 & 缓存
    search.ts               搜索 & 去重 & 分组
    parsers/                Wiki 解析器
      mechanics.ts          游戏机制词条
      skills.ts             技能（主动/辅助/被动/触媒/崇高/华贵）
      talent.ts             天赋系统
      legendary.ts          传奇装备
      prism.ts              棱镜
      pactspirit.ts         契灵
      destiny.ts            命运
      hero.ts               英雄特性
      craft.ts              打造词缀
    utils/
      html.ts               HTML 工具函数
docs/                       设计文档
```

## 开发

```bash
npm install
npm run dev
```

打开 http://localhost:3000，点击右上角「构建数据」抓取 Wiki 数据（首次约 3-5 秒），之后即可搜索。

## 技术栈

- Next.js 14 + TypeScript
- Tailwind CSS
- 数据来源：[tlidb.com](https://tlidb.com)（火炬之光：无限 中文 Wiki）
