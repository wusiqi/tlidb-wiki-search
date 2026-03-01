# v2 Bug List

## Critical
- [ ] 棱镜 parser：把所有词缀合并成一条巨大 entry，需要重写。每个棱镜应该是独立 entry，词缀表格单独处理
- [ ] 传奇装备 description 截断：数值被截成 `+(250–350)` 丢失后面的文字（如"该装备护盾"）
- [ ] 技能 description 重复：同一技能的效果文本出现两遍

## Medium
- [ ] 天赋 description 里名字重复：name 和 subtype 已经有了，description 里不应该再包含
- [ ] 技能 parser 没有提取完整效果描述，只拿到了标签和部分文本

## Done
- [x] 游戏机制 parser ✅
- [x] 打造 parser ✅
- [x] 天命 parser ✅
- [x] 前端统一格式 ✅
