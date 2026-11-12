---
title: LangChain 与 LangGraph
description: 链与图的分工、LCEL 核心组件、StateGraph 十大概念、检查点持久化与 Human-in-the-loop。
---

# LangChain 与 LangGraph

## 为什么需要框架：五类重复劳动

| 重复问题 | 框架提供 |
| --- | --- |
| 多厂商 API 差异 | Model / Provider 抽象 |
| Prompt 拼接与变量管理 | `ChatPromptTemplate` |
| 输出解析与结构化 | OutputParser / `withStructuredOutput` |
| 工具注册与执行 | `tool()` / `ToolNode` |
| 多步流程编排 | LCEL 链 / StateGraph 图 |

::: tip 什么时候可以不用框架
只有一个固定调用、一个固定 Prompt、没有工具和循环时，直接调 SDK 更直观。
框架的价值随「步骤数 × 分支数 × 状态复杂度」上升而上升，别为了用而用。
:::

## LangChain：LCEL 把组件串成链

```ts
const chain = prompt
  .pipe(model)                    // ChatPromptTemplate → ChatModel
  .pipe(new StringOutputParser()) // AIMessage → string

const out = await chain.invoke({ question: '什么是 RAG？' })
```

| 组件 | 作用 |
| --- | --- |
| `ChatModel` / Message | 统一不同厂商的消息对象 |
| `ChatPromptTemplate` | 模板渲染、变量校验、Few-shot 注入 |
| LCEL `pipe()` | 声明式组合，天然支持 stream / batch / 重试 |
| `StringOutputParser` | 把消息对象转成纯文本（不是「格式化字符串」） |
| Memory | 会话历史读写；复杂场景交给 checkpointer |
| Tool / Agent | 工具注册与循环执行 |
| Retriever | 把 RAG 检索封装成可组合组件 |

**核心限制**：LCEL 是**有向无环图（DAG）**。线性流水线很好用，但表达不了
「写手 → 审校 → 打回重写」这种**循环**，也难做跨请求状态持久化。这正是 LangGraph 的切入点。

## LangGraph：把流程建模成一张有状态的图

### 十大核心概念

| 概念 | 一句话 |
| --- | --- |
| `State` | 节点间共享的「白板」，定义字段 + reducer |
| `Reducer` | 决定字段语义：覆盖 `( _c, n) => n` 还是累加 `(c, n) => c + n` |
| `MessagesState` | 预置消息字段，自动累积对话 |
| `Node` | `async (state) => 增量`，纯函数式，不直接改全局 |
| `Edge` | 普通边，`START` / `END` 是特殊节点 |
| `Conditional Edges` | 按 State 决定下一跳（路由、循环、终止） |
| `Command` | 节点一次性指定「更新哪些字段 + 去哪个节点」 |
| `StateGraph` | 描述拓扑；`compile()` 得到可执行图 |
| `stream` | 以 `updates` / `values` 等模式逐节点输出，驱动 SSE |
| `checkpointer` | 图之外的持久化存储，支撑多轮、断点、时间旅行 |

```ts
const graph = new StateGraph(S)
  .addNode('supervisor', supervisor)
  .addNode('researcher', researcher)
  .addEdge(START, 'supervisor')
  .addConditionalEdges('supervisor', route, {
    researcher: 'researcher',
    summarizer: 'summarizer',
    [END]: END,
  })
  .addEdge('researcher', 'supervisor')     // ★ 循环边：反思/重试靠它
  .compile({ checkpointer, recursionLimit: 30 })

await graph.invoke(input, { configurable: { thread_id: 't-1' } })
```

> **循环边是 LangGraph 相对 chain 的核心价值**。
> 有了它，「不达标就重来」「人工审批后继续」都变成了图上的一条边，而不是业务代码里的 while。

### 持久化与断点续跑

| 操作 | 语义 |
| --- | --- |
| `invoke({ messages }, cfg)` | 从 START 跑一轮 |
| `invoke(null, cfg)` | 从最后一个检查点**续跑** |
| `getState(cfg)` | 当前快照（含 `next` 待执行节点） |
| `getStateHistory(cfg)` | 历史检查点（时间旅行） |
| `updateState(cfg, patch)` | 人工改状态，HITL 审批的基础 |
| `interrupt()` + `Command` | 图内暂停，等人工批准后再继续 |

```ts
// checkpointer 必须是进程级单例
export const checkpointer = new MemorySaver()  // 生产换 SqliteSaver / RedisSaver，业务代码 0 改动
```

::: warning 四个高频踩坑
1. 在 `buildGraph()` 内部 `new MemorySaver()` → 每次请求换一个空本子，跨请求记忆全丢。
2. `getState().next` 非空 **不等于**有断点（运行中 also 非空）；判定要 `!running && next.length > 0`。
3. `graph.stream()` 返回 Promise，要先 `await` 再 `for await`。
4. `AbortSignal` 要手动透传到 `model.invoke()`，否则客户端断开后后端继续烧 token。
:::

## 选型对照

| 场景 | 首选 |
| --- | --- |
| 单步问答、格式转换 | SDK / LCEL |
| 固定顺序的多步流水线 | LCEL chain |
| 需要条件路由、循环、重试 | LangGraph |
| 多 Agent 协作、共享状态、HITL | LangGraph |
| 只需低代码搭界面 | Dify / Coze（学原理阶段不推荐） |

> 更贴合实战的一页纸速查见 [LangGraph 速查表](./langgraph-cheatsheet.md)，
> 里面把「框架本身」与「为了让 Demo 能在浏览器里点着玩的 plumbing」明确分开了。

## 自测

1. 为什么 chain 表达不了「审校不通过就重写」？
2. reducer 怎么写能区分覆盖与累加？
3. 把 `MemorySaver` 换成 `SqliteSaver`，业务代码要改几行？
4. `invoke(null, cfg)` 用在哪类场景？

---

[返回 AI 知识地图](../index.md) · 上一篇：[Function Calling](./function-calling.md) · 下一篇：[Agent 与记忆](./agent-workflow-memory.md)
