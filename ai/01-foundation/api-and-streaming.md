---
title: API、流式输出与多轮对话
description: 消息格式、SSE 协议、采样参数、Token 计费、统一 Provider 抽象与流式前端的工程细节。
---

# API、流式输出与多轮对话

## 消息格式：模型是无状态的

每次请求都要把**完整对话历史**重新发一遍。所谓「多轮记忆」，是应用侧在维护一个 messages 数组。

```ts
const messages = [
  { role: 'system', content: '你是客服助手，只依据知识库回答，无法回答时转人工。' },
  { role: 'user', content: '订单什么时候发货？' },
  { role: 'assistant', content: '请提供订单号。' },
  { role: 'user', content: 'A-1024' },
  // 工具调用还会出现 role: 'tool' 的消息，见 Function Calling 章节
]
```

| 角色 | 作用 |
| --- | --- |
| `system` | 设定角色、边界、输出规范；优先级高，应避免把用户输入拼进这里 |
| `user` | 用户内容；是不可信输入，需要防注入 |
| `assistant` | 历史回答；多轮推理与工具循环依赖它 |
| `tool` | 工具执行结果回填，供模型做二次生成 |

## 采样参数：随机性的旋钮

| 参数 | 影响 | 经验取值 |
| --- | --- | --- |
| `temperature` | 概率分布平滑度，越高越发散 | 抽取/分类 0～0.2；通用对话 0.6～0.8；创意 1.0+ |
| `top_p` | 核采样，只在累计概率前 p 的候选里选 | 通常与 temperature 二选一调 |
| `top_k` | 只保留概率最高的 k 个候选 | 本地模型（Ollama）常用 |
| `max_tokens` / `num_predict` | 输出上限 | 防止失控消耗，是成本护栏 |
| `seed` | 固定随机性，便于复现 | 评测集、A/B 测试必开 |
| `repeat_penalty` | 抑制重复 | 本地模型调优常用 |
| `num_ctx` | 本地模型的上下文窗口 | 与切分策略联动 |

::: tip 排查「同样的问题答案不一样」
先固定 `seed` + `temperature=0` 复现，再检查 messages 是否被历史裁剪改变，
最后才怀疑模型本身。评测集必须记录模型版本与参数，否则结果不可比。
:::

## SSE：流式输出到底是什么

服务端以 `text/event-stream` 持续推 `data: {...}\n\n` 分片，前端逐块拼出回答。

```ts
const res = await fetch('/api/chat', { method: 'POST', body: JSON.stringify({ messages }), signal })
const reader = res.body!.getReader()
const decoder = new TextDecoder()
let buffer = ''
while (true) {
  const { done, value } = await reader.read()
  if (done) break
  buffer += decoder.decode(value, { stream: true })
  const events = buffer.split('\n\n')
  buffer = events.pop() ?? ''          // 最后一段可能不完整，留到下一轮
  for (const evt of events) {
    const line = evt.split('\n').find((l) => l.startsWith('data: '))
    if (!line || line.includes('[DONE]')) continue
    append(JSON.parse(line.slice(6)).choices[0].delta.content ?? '')
  }
}
```

工程细节（都是踩过的坑）：

- **按 `\n\n` 切事件、保留不完整尾部**：一个 TCP 包可能包含半个 JSON。
- **AbortSignal 必须一路透传到模型调用**：客户端断开后若不中止，后端会继续烧 token。
- **事件要分类型**：`token` / `tool_call` / `step` / `error` / `done`，
  让 UI 能显示「正在检索…」「正在调用工具…」，而不是一堆纯文本。
- **前端状态竞态**：快速连续提问、HMR 重连、组件卸载后 setState，都要用请求 id / AbortController 处理。

## 结构化输出 vs Function Calling

| | 结构化输出 | 工具调用 |
| --- | --- | --- |
| 目的 | 让回答是稳定的 JSON | 让模型**请求执行**一个动作 |
| 手段 | `response_format` / JSON Schema / `withStructuredOutput` | `tools` 参数 + `tool_calls` 回填 |
| 副作用 | 无 | 有（写库、下单、发邮件） |

两者容易混淆：结构化输出只是**格式约束**，不代表模型真的调用了什么。详见 [Function Calling](../04-agent/function-calling.md)。

## Provider 抽象：别把业务绑死在一家模型上

```ts
interface LLMProvider {
  chat(messages: Message[], opts?: ChatOptions): Promise<ChatResult>
  chatStream(messages: Message[], opts?: ChatOptions): AsyncIterable<Chunk>
}

// 统一处理：baseURL、鉴权、超时、重试、token 计数、错误归一化、模型降级
```

抽象层要收敛这些横切关注点：

- 不同厂商的 `base_url` 与 `/v1` 路径差异（例如 DeepSeek 的 `https://api.deepseek.com` 不带 `/v1`）。
- 推理模型与普通模型的**响应字段差异**（推理内容、tool_calls 位置）在 Provider 层抹平，
  不要泄漏到业务与前端契约。
- 超时、指数退避重试、限流、多模型 fallback、调用日志与 token 统计。

## 成本与安全的底层事实

- 计费按输入 + 输出 token，输出通常更贵；系统提示词每次都计费 → 语义缓存/Prompt 缓存价值很大。
- 不要在日志里打印完整 Prompt（可能含用户隐私）；密钥只在服务端环境变量，**永不进前端、永不进笔记**。

## 自测

1. 「多轮对话」的状态到底存在哪？
2. SSE 解析为什么要保留 buffer 尾部？
3. 客户端点了「停止」，后端怎么才能真正停止消耗？
4. 结构化输出和工具调用的区别是什么？

---

[返回 AI 知识地图](../index.md) · 上一篇：[大模型基础](./llm-fundamentals.md) · 下一篇：[Prompt 工程](../02-prompt/prompt-engineering.md)
