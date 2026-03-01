export interface WikiEntry {
  category: string;
  name: string;
  description: string;
  tags?: string[];
  source?: string;   // 打造用：装备类型
  subtype?: string;  // 子类型：至臻后缀 / 核心天赋·知识之神
  pageUrl: string;
}

export interface SearchResponse {
  query: string;
  total: number;
  groups: ResultGroup[];
}

export interface ResultGroup {
  category: string;
  pageUrl: string;
  entries: WikiEntry[];
  isTable?: boolean; // 打造用表格展示
}
