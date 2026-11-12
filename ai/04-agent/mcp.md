---
title: MCP：工具生态的标准化层
description: MCP 解决的痛点、Host/Client/Server 架构、Tools/Resources/Prompts 与 Function Calling 的边界。
---

# MCP：工具生态的标准化层

## 它到底解决什么问题

Function Calling 让「一个应用」能调工具，但每接一个系统都要重写一遍：

| 痛点 | 具体表现 |
| --- | --- |
| 重复开发 | 每个 Agent 项目都自己写一套「查订单」「查知识库」的工具 |
| 描述不统一 | Schema、命名、错误格式各异，模型难以稳定选择 |
| 发现机制缺失 | 新增工具要改代码、改 Prompt、重新发版 |
| 权限分散 | 每个应用各自管密钥与权限，审计困难 |
| 资源读取不规范 | 文件、数据库记录、模板没有统一入口 |
| 生态不互通 | A 应用写的工具，B 应用（或 Claude Desktop）用不了 |

**MCP（Model Context Protocol）把这些约定标准化**：工具由 Server 提供，
任何 Host 通过 Client 连接就能发现并调用，像 USB-C 统一了外设接口。

::: tip 一句话定位
MCP 是**工具与上下文的协议层**，不是模型、不是框架、不是 Agent，也不做推理。
它不替代 Function Calling，而是让「有哪些工具可用」这件事变得可发现、可复用、可治理。
:::

## 架构与三大能力

```
Host（IDE / Agent 应用 / 桌面客户端）
 └─ MCP Client  ──stdio / Streamable HTTP(SSE)──▶  MCP Server
                                                   ├─ Tools     （可执行动作，有副作用）
                                                   ├─ Resources（可读数据/文件，只读）
                                                   └─ Prompts  （可复用的提示模板）
```

| 能力 | 谁来触发 | 例子 |
| --- | --- | --- |
| Tools | 模型决定是否调用 | `search_knowledge(query)`、`create_ticket(...)` |
| Resources | 应用按需读取、塞进上下文 | 一份规范文档、数据库 schema |
| Prompts | 用户/应用显式选择 | 「代码审查模板」 |

**传输**：本地进程用 `stdio`（简单、无网络暴露）；远程服务用 HTTP/SSE 类传输（需鉴权与 TLS）。

## 与相邻概念的边界

| 对比 | 结论 |
| --- | --- |
| MCP vs Function Calling | FC 是模型的一次能力（产出 tool_calls）；MCP 是「工具从哪来、怎么描述、怎么连」的协议。MCP 工具最终仍要转成 `tools` 参数交给模型 |
| MCP vs HTTP API | API 面向开发者，MCP 额外提供面向模型的**语义描述与发现机制** |
| MCP vs RAG | RAG 提供**知识片段**；MCP 提供**能力/资源**。知识库检索也可以做成一个 MCP Tool |
| MCP vs LangChain / LangGraph | 框架负责编排，MCP 负责工具供给；适配器（如 `@langchain/mcp-adapters`）把 MCP Tool 转成框架 Tool |
| MCP 不是什么 | 不是 Agent 框架、不是向量库、不是模型网关、不等于多智能体、不自动解决权限问题 |

## 最小 Server 形态

```ts
// 概念示意：注册工具名、描述、参数 Schema、处理函数
server.tool(
  'search_knowledge',
  '在售后知识库检索政策片段',
  { query: z.string() },
  async ({ query }) => ({ content: await rag.search(query, 3) })
)
```

Client 侧三步：`connect()` → `listTools()` → 调用并把结果回填给模型。
在 Agent 框架里通常只需把 `listTools()` 的结果转成 `tools` 数组，其余链路不变。

> 实战提示：让工具以**独立进程**运行（stdio），能明显改善隔离性——
> 工具崩了不会带崩主服务，权限与依赖也可以单独约束。

## 企业接入的收益与风险

收益：工具复用、统一描述与发现、集中鉴权与审计、跨 Host 复用、版本治理、新人接入成本低。

风险（必须在设计里回应）：

| 风险 | 防护 |
| --- | --- |
| 工具描述被投毒（诱导模型做危险操作） | 只接入可信 Server，描述做审核与版本锁定 |
| 越权调用 | Server 侧基于用户身份鉴权，最小权限，不信任模型传入的身份 |
| 敏感数据经工具外泄 | 输出 Guard、脱敏、审计日志、租户隔离 |
| 高风险动作被自动执行 | 分级审批 / HITL / 幂等键 |
| 远程 Server 不可信 | 白名单、TLS、超时、限流、MCP Guard 类中间层 |

::: warning 别把「接了一堆 MCP Server」当架构能力
工具越多，模型选择错误率越高、上下文越拥挤。
按场景**按需挂载**工具集，并给描述写清「该用 / 不该用」，比堆数量重要得多。
:::

## 自测

1. MCP 和 Function Calling 是替代关系吗？
2. Tools / Resources / Prompts 分别由谁触发？
3. 为什么高风险工具的鉴权必须放在 Server 侧？
4. 什么时候该用 stdio，什么时候该用远程传输？

---

[返回 AI 知识地图](../index.md) · 上一篇：[Multi-Agent](./multi-agent.md) · 下一篇：[企业级架构](../05-engineering/enterprise-architecture.md)
