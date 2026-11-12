---
title: 大模型应用开发 · 六板块速查
description: 基础、Prompt、RAG、Agent、工程实践、微调原理六大板块的高频追问与站内索引。
---

# 大模型应用开发 · 六板块速查

> 复习用的「索引页」，不是答案库。每板块给**必须能答的三问**和对应章节，
> 答不上来就跳转补概念，别背结论。

## 通用答题结构

```
定义（一句话） → 解决什么问题 → 怎么判断该不该用（判据） → 落地细节/参数 → 出问题时怎么排查
```

面试官追问通常落在后两段。只背定义，第二问就会露馅。

## 一、大模型应用基础

- Token / Context 窗口 / 截断策略各是什么，长上下文有什么代价？
- Transformer 里 QKV、因果掩码、位置编码分别解决什么？
- 幻觉的成因是什么，通用模型与推理模型的取舍？

→ [大模型基础](../01-foundation/llm-fundamentals.md) · [API 与流式](../01-foundation/api-and-streaming.md)

**易错点**：把「多轮对话」说成模型有记忆；把 SSE 说成 WebSocket。

## 二、提示词工程

- 一个可维护的 Prompt 由哪几部分构成？System 与 User 的边界在哪？
- Few-shot / CoT / ReAct 各自的代价是什么？
- 什么是结构化输出？解析失败怎么兜底？如何防注入？

→ [Prompt 工程与结构化输出](../02-prompt/prompt-engineering.md)

**易错点**：把「请务必准确」当约束；把业务事实硬塞进 System Prompt。

## 三、RAG 与检索增强

- 写出完整数据流（离线写入 + 在线查询），并说出每一步可能丢信息的地方。
- 余弦相似度 / 点积 / 欧氏距离的差别？为什么写入与查询必须用同一模型？
- 混合检索、Rerank、HyDE、父子 chunk 各解决什么？答错了怎么**分层定位**？
- RAG 评测有哪些指标？RAG vs 如何与微调取舍？

→ [RAG 基础](../03-rag/rag-fundamentals.md) · [高级检索与评测](../03-rag/rag-advanced-eval.md) · [本地实操](../03-rag/local-rag-lab.md)

**易错点**：一上来就说「换个更强的模型」，却没看 Recall@K。

## 四、Agent 与智能体应用

- Function Calling 的完整链路？谁真正执行工具？
- chain（DAG）与 graph（可循环）的本质差别？State / Reducer / checkpointer 是什么？
- Workflow vs Agent 怎么选？ReAct / Plan-and-Execute / Reflection 的区别？
- 什么时候**不该**用 Multi-Agent？MCP 与 Function Calling 什么关系？
- 可靠性：幂等、循环检测、超时降级、HITL、Agent 评测指标？

→ [Function Calling](../04-agent/function-calling.md) · [LangChain/LangGraph](../04-agent/langchain-langgraph.md) · [速查](../04-agent/langgraph-cheatsheet.md) · [Agent 与记忆](../04-agent/agent-workflow-memory.md) · [Multi-Agent](../04-agent/multi-agent.md) · [MCP](../04-agent/mcp.md)

**易错点**：把确定性节点、条件路由都叫「多智能体」；把 MCP 说成「替代 Function Calling」。

## 五、应用工程实践

- 企业级 Agent 的分层架构与核心模块？State 为什么是 Source of Truth？
- 可观测要看哪些 Trace/Span，怎么判断错误来自 RAG / Tool / Prompt / 模型？
- 十类安全风险里，间接 Prompt Injection、RAG 越权、Excessive Agency 分别怎么防？
- 成本与性能：语义缓存、Token 压缩、限流队列、多模型 fallback、降级？
- 上线检查清单有哪些项？

→ [企业级架构](../05-engineering/enterprise-architecture.md) · [部署与成本](../05-engineering/deployment-and-cost.md)

**易错点**：权限「先检索后过滤」；只盯单次调用成本、不看循环步数。

## 六、微调原理（理解即可，不必动手）

- 预训练 / SFT / RLHF / DPO 各自解决什么？
- LoRA / QLoRA 为什么省显存？适合什么场景？
- 全参微调 vs PEFT；知识蒸馏的直觉；常用评测指标？

→ [大模型基础](../01-foundation/llm-fundamentals.md)

**易错点**：用微调去「灌一批经常更新的文档」。

## 复盘路径

1. 先做一遍自测，标记答不上的板块。
2. 只补该章节的「判据表」与「自测题」，不重读全文。
3. 用自己的项目举一个例子（例：Ex5 的 checkpointer 单例踩坑），比背概念更有说服力。
4. 回到 [AI 知识地图](../index.md) 检查四层能力栈是否都能串起来。

---

[返回 AI 知识地图](../index.md) · 实战佐证：[从 Example 1 到 6](../06-practice/learning-path-review.md)
