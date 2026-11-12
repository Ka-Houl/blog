---
title: AI 大模型与 Agent · 知识地图
description: 从 Prompt、RAG、Agent 到企业级工程化：把碎片化资料整理成一条可复习、可实践的知识主线。
---

# AI 大模型与 Agent · 知识地图

> 面向 AI 应用开发（Agent 开发 / AI 工程化）的知识整理，内容以概念说明、选型判据与排错方法为主。

## 一条主线，四层能力

```
① Prompt 控制输出  →  ② RAG 给知识  →  ③ Agent 做执行  →  ④ 工程能力做稳定
   稳定可控的表达       私域/时效知识      工具与流程编排      安全、成本、可观测、上线
```

这四层是**递进依赖**：没有稳定的输出格式，工具调用就不可靠；没有检索，Agent 只能凭模型记忆作答；
没有工程化，Demo 永远只是 Demo。

## 学习路线（六阶段）

| 阶段 | 主题 | 学完应能回答 | 对应章节 |
| --- | --- | --- | --- |
| 1 | 基础认知 | Token / Context / 幻觉 / 训练链路是怎么回事 | [大模型基础](./01-foundation/llm-fundamentals.md) · [API 与流式](./01-foundation/api-and-streaming.md) |
| 2 | 表达控制 | 怎么让输出稳定、可解析、可维护 | [Prompt 工程](./02-prompt/prompt-engineering.md) |
| 3 | 知识增强 | 私域知识怎么进上下文，怎么评估检索质量 | [RAG 基础](./03-rag/rag-fundamentals.md) · [进阶与评测](./03-rag/rag-advanced-eval.md) · [本地实操](./03-rag/local-rag-lab.md) |
| 4 | 执行能力 | 模型怎么调工具、怎么编排流程、何时该拆多 Agent | [Function Calling](./04-agent/function-calling.md) · [LangChain / LangGraph](./04-agent/langchain-langgraph.md) · [Agent 与记忆](./04-agent/agent-workflow-memory.md) · [Multi-Agent](./04-agent/multi-agent.md) · [MCP](./04-agent/mcp.md) |
| 5 | 上线能力 | 原型怎么变成稳定、安全、可控成本的服务 | [企业级架构](./05-engineering/enterprise-architecture.md) · [部署与成本](./05-engineering/deployment-and-cost.md) |
| 6 | 复盘与表达 | 怎么把做过的事讲清楚、怎么应对深问 | [实战复盘](./06-practice/learning-path-review.md) · [面试速查](./interview/cheat-sheet.md) |

章节按 1 → 6 顺序组织；复习时可直接查看 [面试速查](./interview/cheat-sheet.md) 与对应章节的判据表。

## 章节总览

### 01 · 基础认知

- [大模型基础：够用即可的理论](./01-foundation/llm-fundamentals.md)：Token、Attention、预训练→SFT→RLHF/DPO、LoRA、幻觉与知识边界。
- [API、流式输出与多轮对话](./01-foundation/api-and-streaming.md)：消息格式、SSE、采样参数、Token 计费、Provider 抽象。

### 02 · 表达控制

- [Prompt 工程与结构化输出](./02-prompt/prompt-engineering.md)：六要素模板、Few-shot / CoT / ReAct、防注入、Prompt 工程化。

### 03 · 知识增强（RAG）

- [RAG 基础：Embedding 与向量库](./03-rag/rag-fundamentals.md)：两阶段数据流、切分、相似度、选型、引用溯源。
- [高级检索与 RAG 评测](./03-rag/rag-advanced-eval.md)：混合检索、Rerank、HyDE、指标与分层排查。
- [从零搭一套本地 RAG 实验室](./03-rag/local-rag-lab.md)：Ollama + Chroma + pgvector 端到端清单。

### 04 · 执行与编排（Agent）

- [Function Calling 与工具设计](./04-agent/function-calling.md)：完整调用链路、Schema、幂等与最小权限。
- [LangChain 与 LangGraph](./04-agent/langchain-langgraph.md)：链 vs 图、StateGraph 十概念、持久化与 HITL。
- [LangGraph 一页纸速查](./04-agent/langgraph-cheatsheet.md)：六个必须掌握的概念与踩坑结论。
- [Agent、Workflow 与记忆](./04-agent/agent-workflow-memory.md)：ReAct、工作流选型、分层记忆、可靠性。
- [Multi-Agent：什么时候不该拆](./04-agent/multi-agent.md)：协作模式与五个判据。
- [MCP：工具生态的标准化层](./04-agent/mcp.md)：Host/Client/Server、三大能力、与 Function Calling 的边界。

### 05 · 企业级工程化

- [企业级 Agent 架构](./05-engineering/enterprise-architecture.md)：六层架构、核心链路、数据表、安全与可观测。
- [部署、成本与稳定性](./05-engineering/deployment-and-cost.md)：Ollama、Docker、CI/CD、缓存与降级。

### 06 · 实战与复盘

- [从 Example 1 到 6：一条能力阶梯](./06-practice/learning-path-review.md)：把 demo 流水账提炼成原理地图。
- [AI Native R&D Platform 架构方案](./06-practice/ai-native-rd-platform.md)：Case / Orchestrator / Waker 五层架构笔记。
- [前端 UI/UE 走查工具实践](./06-practice/uiue-review-tool.md)：设计 DSL 与 DOM 属性级核验的落地经验。

### 面试

- [大模型应用开发 · 六板块速查](./interview/cheat-sheet.md)

## 资料来源与整理原则

| 来源 | 处理方式 |
| --- | --- |
| 语雀导出资料库（约 359 篇：70 章主干教程、12 章理论体系、NestJS/Ollama/LangGraph 实操、企业级案例与面试八股） | 按**知识点**重组，去除重复的副本、附件链接与简历话术，只保留概念、判据、指标、排错逻辑 |
| 个人实战仓库（Example 1～6：流式 → 工具 → RAG → 多 Agent → LangGraph → MCP） | 提炼成 [学习阶梯复盘](./06-practice/learning-path-review.md)，原始逐日日志移入归档 |
| 飞书知识库架构方案与团队实践分享 | 保留为 [实战案例](./06-practice/ai-native-rd-platform.md)，作为企业级设计的延伸阅读 |

::: warning 已知的资料缺口
原资料没有系统覆盖 **vLLM / 推理加速 / 量化 / GGUF**（仅一处提及），也没有深入分布式训练。
本栏定位是应用开发，因此不强行补齐算法侧内容；若后续要做推理服务，需要单独开一个专题。
:::
