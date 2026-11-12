---
title: 归档说明（不参与站点构建）
description: 被移出知识体系的原始资料清单：demo 流水账、实验 README、旧索引、协作约定与外部离线镜像。
---

# 归档说明

本目录存放**移出博客知识体系、但不删除**的原始材料。
`.vitepress/config.ts` 通过 `srcExclude: ['archive/**']` 排除它，因此不会生成页面、不会进入导航、不会被搜索索引。

> 整理原则：**知识体系里只留「可脱离项目独立成立」的概念、判据与方法**；
> 逐日进度、实验现场记录、外部资料副本放进这里，需要查细节时再回看。

## 目录清单

| 目录 | 内容 | 为什么移出 |
| --- | --- | --- |
| `learning-log/` | `LEARNING_LOG.md` + `example1～5.md` 逐日进度（约 88 KB） | 流水账记录「哪天做了什么」，结论已提炼为 [实战复盘](../ai/06-practice/learning-path-review.md) |
| `demo-readmes/` | Example 3 / 5 / 6 的项目 README（约 74 KB） | 与代码目录强绑定的操作记录，知识点已拆进 RAG / LangGraph / MCP 章节 |
| `drafts/` | `hello-world`、`blog/index`、`git-commands/index`、`frontend-notes/index` | 空壳示例页与旧版链接清单，已被新首页与栏目索引取代 |
| `collaboration/` | `AGENTS.md`、`intro.md`、`ai-learning/index.md` | 旧学习项目的协作约定与占位页（指向已不存在的 example 目录） |
| `notes-offline/` | `3v3.top` 离线镜像：73 个 HTML + 144 个静态资源（约 12 MB） | 外部站点副本，不是本站知识；也不该进入构建产物 |

## 已提升为正式文章的内容

| 原文件 | 现在 |
| --- | --- |
| `logs/langgraph-cheatsheet.md` | [LangGraph 一页纸速查](../ai/04-agent/langgraph-cheatsheet.md) |
| `wiki-notes/AI-Native-RD-Platform-架构方案.md` | [AI Native R&D Platform 架构方案](../ai/06-practice/ai-native-rd-platform.md) |
| `wiki-notes/AI实践分享-前端UIUE走查工具实践.md` | [前端 UI/UE 走查工具实践](../ai/06-practice/uiue-review-tool.md) |
| `self-thought/` 四篇 | [观点与随笔](../essays/index.md) 下的三篇 + 综述 |
| `frontend-notes/js-basics.md` | 扩写为 [JavaScript 核心知识](../frontend/javascript-basics.md) |
| `git-commands/common.md` | 扩写为 [Git 场景化速查](../engineering/git-cheatsheet.md) |

## 怎么查 / 怎么恢复

- **查资料**：直接在编辑器里打开本目录对应文件；`notes-offline/` 可双击 `index.html` 阅读
  （`file://` 下 mermaid、深色模式等 JS 交互不可用），或运行目录内的本地服务脚本获得完整体验，
  `全部页面.html` 是页面清单。
- **恢复某篇到站点**：把文件移回对应栏目目录（或新建 `.md`），
  在 `.vitepress/config.ts` 的 sidebar 中加一条 link 即可；无需改动 `srcExclude`。
- **彻底删除**：确认不需要后直接删掉对应子目录即可，站点构建不依赖本目录。

::: warning 关于 AGENTS.md
归档后的 `collaboration/AGENTS.md` **不再是本项目生效的协作规则**（它描述的是另一个练习仓库）。
若需要给当前博客重新定义 AI 协作约定，请在项目根目录新建 `AGENTS.md`。
:::
