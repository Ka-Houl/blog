---
title: 01 · Gosling 与 AI 泡沫
description: 对炒作的批判是否成立？对 AI 编程能力的判断是否已被事实推翻？
---

# 01 · Gosling：「AI 是骗局，无法取代程序员」——结合 2026 AI 现状的评价

> 本页归属 [观点与随笔](./index.md)；三篇材料的合论见 [综述](./ai-coding-views.md)。

> 原文：Java 之父怒斥：AI 是场骗局，无法取代程序员，在编程方面的最大作用是生成没人想写的文档
> 来源：公众号「前端大全」转载自 MaxAIBox ｜ 时间：2025-05-26 ｜ 主角：James Gosling（Java 之父，Java 30 周年专访）
> 原文链接：https://mp.weixin.qq.com/s/qE73FIRHePauJoEGTys0xQ

## 一、文章观点

| 维度 | 内容 |
|------|------|
| 本质批判 | AI 是「高级统计 / 复杂工具」，不是真智能；「AI」是带坑的营销术语，基本是骗局；VC 只为退出获利，绝大多数 AI 投资会打水漂 |
| 编程局限 | 演示惊艳但「项目稍复杂就失灵」，靠爬代码复制已知模式；真正开发是解决新问题与创造性架构，AI 做不到；最大价值是「生成没人愿写的文档」 |
| 不可替代 | 仍会教孩子编程；编程核心是问题建模与抽象，统计工具触及不到；巨头「AI 裁员威胁论」是自私话术 |

## 二、检索（2 关键词 / 12 篇资料）

**关键词 1：AI 编程助手能否取代程序员（2026 现状）**
- [1] 2026 Q2 开发者趋势报告：AI 编程助手使用率突破 70% — CSDN `https://blog.csdn.net/m0_73827294/article/details/162014038`
- [2] AI 编程助手能否替代程序员？2026 深度调查 — publicdata.online `https://publicdata.online/articles/2026-05-08-ai-coding-assistant-vs-human-programmer.html`
- [3] AI 会取代程序员吗？结合 2026 年 5 月行业报告 — 知乎 `https://zhuanlan.zhihu.com/p/2058916555799449829`
- [4] 2026 AI 编程助手横评：Copilot vs Claude Code vs Cursor vs 通义灵码 — 掘金 `https://juejin.cn/post/7626681742503411738`
- [5] AI 编程会取代程序员吗？2026 深度分析（30–50% 工作） — 提效录 `https://www.tixiaolu.com/posts/ai-replace-programmer/`
- [6] AI 编程助手会取代初级程序员吗？2026 — CSDN `https://blog.csdn.net/qq_26629277/article/details/162466401`

**关键词 2：AI Coding Agent / 大模型编程能力 2026（SWE-bench、自主编程）**
- [7] SWE-bench and Coding Agent Benchmarks 2026 — programming-helper.com `https://www.programming-helper.com/tech/swe-bench-coding-agent-benchmarks-2026-software-engineering-ai-evaluation`
- [8] Coding Agent Benchmarks 2026 (SWE-Bench / TerminalBench) — presenc.ai `https://presenc.ai/research/coding-agent-benchmarks-2026`
- [9] 2026 AI Coding Agent 能力横评 — 龙虾智能体 `https://clawpk.net/research/R-BENCH-01-coding-agent-comparison`
- [10] 大模型代码编程能力评测排行榜 SWE-Bench — datalearner.com `https://www.datalearner.com/leaderboards/category/code`
- [11] 代码大模型 2026 排行：SWE-Bench Pro 时代 — guijiagi.com `https://guijiagi.com/posts/code-llm-2026-ranking/`
- [12] Agent 评估框架 2026：AgentBench vs SWE-bench — holysheep.cn `https://www.holysheep.cn/articles/zh-agent-pinggukuangjia-2026agentbench-vs-swe-bench-v-2026-04-18-0031.html`

## 三、我的评价（2026-09 视角）

Gosling 发言于 **2025-05**，距 2026-09 约 16 个月——正是 AI 编程从「补全玩具」跃迁到「Agent 标配」的窗口。

1. **对「炒作与泡沫」的警惕——站得住，甚至被印证。** 他点名的虚高估值、人工冒充 AI（21 亿美元一键购物 App 实为外包）在 2025–2026 不断出现，「绝大多数投资打水漂」与大量 AI 项目商业化不及预期吻合。
2. **对「AI 编程能力」的判断——明显过时。** GitHub 数据显示 AI 编程助手使用率从 2024 的 49% 升到 2026 Q2 的 **70%+**（[1]）；SWE-bench Verified 上头部 Coding Agent 已能自主修复**多数真实 GitHub issue**（[7][10][11]）；Claude Code / Cursor / Devin / OpenHands / SWE-agent 已从「补全」进化到「多文件重构、自主跑测试、提 PR」（[4][8][9]）。「稍复杂就失灵、只能复制模式」在 2026 已不成立——他低估了工具天花板。
3. **「文档才是最大价值」——只说对一半。** 自动生成 / 解释文档、当「代码语义搜索引擎」仍是刚需，但 2026 年 AI 价值早已远超文档：脚手架、单测、Bug 定位与修复、重构、CI 排错皆日常。
4. **「能否取代程序员」——最 nuanced，也最接近现实。** 共识（[2][5][6]）：AI 已吸收约 **30–70% 常规编码**（CRUD、单测、样板），初级 / 重复型岗位受压最重；但需求理解、问题建模、架构设计、系统级调试与安全仍是人类主场。**分歧只在程度**：他倾向「基本不能」，现实是「替掉一大块脏活，决策与兜底仍靠人」。「仍要教孩子编程」在 2026 反而更成立——当 AI 写大部分代码，人更需懂底层以审查、调试、兜底。

## 四、一句话结论

> Gosling 对**泡沫与欺诈的批判是预言性的、对的**；但对 **AI 编程能力上限的轻视，已被 16 个月后的事实推翻**。最公允的当下判断不是「AI 是骗局」也不是「AI 取代程序员」，而是他本人用的框架——**AI 是极其强大的工具**，只是能耐比他 2025 年以为的大得多；「人负责建模、抽象、把关，AI 负责实现常规」的协作范式，恰是他观点的升级版。
