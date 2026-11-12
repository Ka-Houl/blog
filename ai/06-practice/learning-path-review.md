---
title: 从 Example 1 到 6：一条能力阶梯
description: 把逐日 demo 日志提炼成原理地图：流式 → 工具 → RAG → 多 Agent → 框架化 → MCP。
---

# 从 Example 1 到 6：一条能力阶梯

> 原始材料是一份逐日更新的学习日志（Example 1～6 + 若干「补缺」任务）。
> 流水账适合记录进度，不适合复习。这一页把它压成**六个阶段 × 四个维度**的能力地图。

## 阶梯总览

| 阶段 | 做出来的东西 | 真正要掌握的原理 | 对应章节 |
| --- | --- | --- | --- |
| Ex1 | 流式对话界面 | SSE 分片、前端增量渲染、消息数组、AbortSignal | [API 与流式](../01-foundation/api-and-streaming.md) |
| Ex2 | 工具调用 + ReAct 循环 | tool_calls 链路、工具分发、多轮记忆、思维链开关 | [Function Calling](../04-agent/function-calling.md) |
| Ex3 | RAG 知识库问答 | 切分、BM25 / 语义 / 混合检索、评测集、引用溯源 | [RAG 基础](../03-rag/rag-fundamentals.md) · [评测](../03-rag/rag-advanced-eval.md) |
| Ex4 | 手搓 Supervisor 多 Agent | 共享状态、路由、循环与终止条件、SSE 步骤事件 | [Multi-Agent](../04-agent/multi-agent.md) |
| Ex5 | 用 LangGraph 重写 Ex4 | State/Reducer/条件边/循环边、checkpointer、HITL、可观测 | [LangGraph](../04-agent/langchain-langgraph.md) · [速查表](../04-agent/langgraph-cheatsheet.md) |
| Ex6 | 工具改走独立 MCP Server | 协议化工具、进程隔离、发现与 Schema | [MCP](../04-agent/mcp.md) |

## 每个阶段的「坑 → 认知」转化

| 阶段 | 当时踩的坑 | 抽象出来的通用认知 |
| --- | --- | --- |
| Ex1 | baseURL 多写了 `/v1`、SSE 半个 JSON、HMR 丢状态 | 抽象 Provider 层抹平厂商差异；流式要处理不完整包与竞态 |
| Ex2 | 模型推理链字段各家不同 | 请求参数 / 响应字段 / 前端契约**三层**都要归一化 |
| Ex3 | 关键词检索答不准 | 先建评测集（Top-1 / MRR / Top-3 召回）再谈换检索方案；语义检索 5/5 vs 关键词 4/5 |
| Ex4 | 最终答案后面没有内容 | 事件流要有终止事件；区分「模型输出」与「编排状态」 |
| Ex5 | `MemorySaver` 建在 `buildGraph()` 里导致跨请求丢记忆 | 存储必须是进程级单例；框架把存储抽象掉，业务代码 0 改动 |
| Ex5 | `next` 非空 ≠ 有断点；`BaseMessage` 没有 `.role` | 判断状态要结合 `running` 标志；框架行为不符预期时**写最小探针打印真实对象，别猜** |
| Ex6 | 工具与主服务耦合、权限难管 | 用独立进程 + 协议层统一工具描述与鉴权 |

::: tip 最值钱的一条方法论
> 「遇到框架行为不符合预期，先写最小探针打印真实对象，别猜。」
>
> 探针不调模型、不花钱、秒级跑完，把 State / 检查点 / 消息对象的真实结构打出来。
> 这条习惯能从「调试 3 小时」压缩到「验证 5 分钟」，也适用于 three.js 里排查 Helper 与阴影范围。
:::

## 为什么一定要补「框架化」这一环

校准标准有三条：① 能独立用 Agent 解决一个过去的问题；② 至少练熟一种框架；③ 对 Prompt/Context 调优有概念、知道怎么 debug。
Ex4 结束时 ① 达标、③ 部分达标、② 空白。Ex5 补的就是 ②。

> **原理到位 ≠ 工作达标**：生产环境不会让你从零写 supervisor loop，
> 但只会调用框架、不懂 State/循环/检查点的人，也排查不了线上问题。
> 正确顺序是「先手搓理解原理 → 再用框架替换 → 最后用工程约束把它变稳定」。

## 补缺任务其实是一张工程化清单

| 补缺 | 对应能力 | 归属章节 |
| --- | --- | --- |
| 结构化输出 | 输出可解析、可校验 | [Prompt 工程](../02-prompt/prompt-engineering.md) |
| 语义检索 / Embedding | 检索质量 | [RAG 基础](../03-rag/rag-fundamentals.md) |
| Eval 评测集 | 可量化迭代 | [RAG 评测](../03-rag/rag-advanced-eval.md) |
| HITL 人工审批 | 高风险动作可控 | [Agent 与记忆](../04-agent/agent-workflow-memory.md) |
| LangSmith 可观测 | Trace 排错 | [企业级架构](../05-engineering/enterprise-architecture.md) |
| MCP 工具集成 | 工具标准化 | [MCP](../04-agent/mcp.md) |

这六项恰好对应「把 Demo 变成生产系统」的六个缺口——**它们不是附加功能，而是上线的必要条件**。

## 从流水账到知识体系：四步法

1. **抽概念**：从日志里只挑「可以脱离这个项目独立成立」的名词（delta、checkpointer、Top-K、幂等）。
2. **写判据**：给每个概念补一句「什么时候该用 / 不该用」，知识才可被检索、可被复用。
3. **留最小实验**：每个概念保留一个 10 行以内可复现的代码或探针，比长篇解释更可靠。
4. **连成地图**：把概念按依赖顺序连起来（本栏的四层能力栈），孤立笔记自然消失。

> 原始逐日日志、各 Example 的 README 与协作约定已移入 `archive/`，需要查某次实验的细节时再回看；
> 日常复习只需这一页 + 对应章节。

---

[返回 AI 知识地图](../index.md) · 延伸：[案例：AI Native R&D Platform](./ai-native-rd-platform.md) · [面试速查](../interview/cheat-sheet.md)
