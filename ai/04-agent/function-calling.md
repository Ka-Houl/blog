---
title: Function Calling 与工具设计
description: 工具调用的完整链路、Schema 设计、并行调用、幂等与最小权限、Registry/Executor 与副作用审批。
---

# Function Calling 与工具设计

> 大模型本身**不会执行任何东西**。它只会「请求调用一个工具」，真正执行的是你的代码。
> 理解这条边界，Agent 的大部分安全问题就都有了答案。

## 一次完整调用链路

```
① 请求：messages + tools(Schema)
      ↓
② 模型返回：assistant 消息里带 tool_calls[{name, arguments}]
      ↓
③ 应用侧：校验参数 → 执行工具 → 得到结果
      ↓
④ 回填：{ role: 'tool', tool_call_id, content: 结果 } 追加到 messages
      ↓
⑤ 二次请求：模型基于结果生成最终回答（或继续请求下一个工具）
```

```ts
const tools = [{
  type: 'function',
  function: {
    name: 'search_knowledge',
    description: '在售后知识库中检索规则；当用户问题涉及具体政策、时限、流程时调用。',
    parameters: {
      type: 'object',
      properties: { query: { type: 'string', description: '检索关键词或完整问题' } },
      required: ['query'],
      additionalProperties: false,
    },
  },
}]

const msg = await llm.chat(messages, { tools, tool_choice: 'auto' })
for (const call of msg.tool_calls ?? []) {
  const args = schema.parse(JSON.parse(call.function.arguments)) // 一定要校验
  const result = await registry.execute(call.function.name, args)
  messages.push({ role: 'tool', tool_call_id: call.id, content: JSON.stringify(result) })
}
```

| 参数 | 语义 |
| --- | --- |
| `tool_choice: 'auto'` | 模型自己决定是否调用 |
| `tool_choice: 'none'` | 禁止调用（例如只做分类时） |
| `tool_choice: { name }` | 强制调用指定工具 |
| 并行 tool_calls | 一次返回多个无依赖调用，可并发执行后一起回填 |

## 与结构化输出的区别（最容易混淆）

| | 结构化输出 | Function Calling |
| --- | --- | --- |
| 模型在做什么 | 决定**输出格式** | 决定**要执行哪个动作** |
| 结果流向 | 直接给业务解析 | 回填给模型做二次生成 |
| 是否有副作用 | 没有 | 可能有（下单、退款、发邮件） |
| 失败代价 | 重试 | 可能需要补偿事务 |

## 工具设计六原则

1. **描述写给模型看**：说清「什么时候该用 / 什么时候不该用」，比罗列参数更重要。
2. **参数最小化**：只暴露必要字段，用枚举与 `additionalProperties: false` 收紧。
3. **校验在应用侧**：模型生成的 arguments 是**不可信输入**，zod/Pydantic 必须过一遍。
4. **最小权限**：工具执行上下文带用户身份与租户，工具内部再验一次权限，别信模型传的 user_id。
5. **幂等**：写操作带 `idempotency_key`，重试/断点恢复不会重复下单。
6. **可观测**：记录 tool_call_id、参数摘要、耗时、结果状态，方便用 trace 复盘。

::: warning 有副作用工具的三道闸
- 执行前：参数校验 + 权限校验 + 风险分级。
- 高风险动作：走 [HITL 人工审批](./agent-workflow-memory.md)（`interrupt` + `Command` 续跑）。
- 执行后：审计日志 + 失败补偿/回滚路径。
:::

## Registry / Executor：别写 if-else 分发

```ts
const registry = {
  search_knowledge: { schema: SearchArgs, run: ({ query }) => rag.search(query, 3) },
  get_order:        { schema: OrderArgs,  run: ({ id }) => db.orders.find(id) },
}

async function execute(name: string, rawArgs: unknown) {
  const tool = registry[name]
  if (!tool) throw new ToolNotFoundError(name)
  return tool.run(tool.schema.parse(rawArgs))
}
```

框架层（LangChain `tool()`、LangGraph `ToolNode`）帮你做的正是**参数校验**与**执行入口**两件事；
手写版本可以先用这套结构理解原理，再换成框架。

## 让用户看见「正在发生什么」

工具调用往往耗时几秒，纯文本等待体验很差。用 SSE 把过程推给前端：

```json
{"event":"tool_call","data":{"name":"search_knowledge","status":"running"}}
{"event":"tool_result","data":{"name":"search_knowledge","hit":3,"ms":420}}
{"event":"step","data":{"node":"supervisor","next":"summarizer"}}
{"event":"token","data":{"content":"根据知识库…"}}
```

> 模型并不知道这些事件的存在——它们是**应用侧在编排循环里主动发出的**。
> 把「模型输出」和「执行状态」分成两类事件，前端状态机才不会打架。

## 自测

1. 模型返回 `tool_calls` 后，工具是不是已经执行了？
2. `tool_choice: 'auto'` 与强制调用分别用在什么场景？
3. 为什么工具内部还要再验一次用户权限？
4. 断点恢复时重复执行了下单工具，设计上少了什么？

---

[返回 AI 知识地图](../index.md) · 上一篇：[本地 RAG 实验室](../03-rag/local-rag-lab.md) · 下一篇：[LangChain 与 LangGraph](./langchain-langgraph.md)
