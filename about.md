---
title: 关于本站
description: 小虾米的技术知识库：内容结构、资料来源与构建方式。
---

# 关于本站

小虾米的技术知识库，收录 AI 应用开发、前端与图形、工程实践相关的笔记与整理。

内容来自公开资料学习、个人练习与项目实践的归纳，按主题分类，
以概念说明、选型判据与排错记录为主；逐日实验记录另置于归档，不混入正文。

## 内容结构

```
ai/                    AI 大模型与 Agent（基础、Prompt、RAG、Agent、工程化、实战、面试）
frontend/              前端：语言与运行时、工程化
  └── threejs/         Three.js 渲染管线九章
engineering/           Git 场景速查、AI 编程工作流
essays/                观点与随笔
archive/               归档（srcExclude，不参与构建）
```

每个栏目有一张索引页列出章节，文章之间按主题顺序相连。

## 资料来源

| 来源 | 处理方式 |
| --- | --- |
| 语雀导出资料库（约 359 篇：主干教程、理论体系、实操文档、企业案例、面试资料） | 按知识点重组，去除重复副本与话术，保留概念、指标、判据与排错逻辑 |
| 练习仓库 `threejs-study`（4 个递进 demo 与学习指南） | 归纳为 [Three.js 九章](./frontend/threejs/index.md) |
| 个人 AI 实战记录（Example 1～6） | 逐日日志归档，结论提炼为 [能力阶梯复盘](./ai/06-practice/learning-path-review.md) |
| 飞书架构方案与团队实践分享 | 保留为 [架构方案](./ai/06-practice/ai-native-rd-platform.md) 与 [UI/UE 走查实践](./ai/06-practice/uiue-review-tool.md) |

被移出的原始材料位于 `archive/`，说明见仓库中的 `archive/README.md`。

## 构建方式

- VitePress 1.x，本地搜索、暗色模式、页脚与编辑链接
- 自定义主题色与首页样式（`.vitepress/theme/custom.css`）
- GitHub Pages 部署，`base: /blog/`，推送 `main` 自动构建

---

[返回首页](./index.md) · [AI 知识体系](./ai/index.md) · [前端](./frontend/index.md)
