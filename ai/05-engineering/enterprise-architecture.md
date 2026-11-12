---
title: 企业级 Agent 架构
description: 六层架构、六条核心链路、八大模块与数据表、可观测性、十类安全风险与上线检查清单。
---

# 企业级 Agent 架构

> Demo 到生产之间隔的不是「更好的 Prompt」，而是**一整套工程约束**：
> 权限、状态、审计、可观测、成本、安全与降级。

## 六层架构

```
① 前端层            Web / 移动端 / IDE 插件（SSE 展示步骤、工具状态、引用）
② API Gateway / BFF  鉴权、限流、租户、请求上下文 RequestContext
③ Agent Application  会话、Agent 配置、任务编排、SSE 事件协议
④ Runtime            LangGraph / DeepAgents、checkpointer、工具执行、HITL
⑤ Capability         LLM Provider、RAG、Tool / MCP、Memory、Guard
⑥ Data & Infra       PostgreSQL + pgvector、Redis、对象存储、消息队列、监控系统
```

## 六条核心链路

| 链路 | 关键路径 |
| --- | --- |
| Chat | 请求 → 组装上下文 → 模型流式 → SSE → 落库 |
| RAG | 检索（带权限过滤）→ 重排 → 上下文组装 → 生成 → 引用溯源 |
| Tool | tool_calls → 参数校验 → 权限校验 → 执行 → 结果回填 |
| MCP | 发现工具 → 转成框架 Tool → 调用 → 审计 |
| HITL | `interrupt()` → 审批 UI → `Command` 续跑 → 状态快照 |
| Multi-Agent | 共享 State → 路由/并行 → trace → 汇总 → 终止条件 |

## 八大模块与核心数据表

| 模块 | 职责 |
| --- | --- |
| 用户与租户 | 身份、角色、租户隔离、配额 |
| Agent 配置 | Prompt 版本、工具集、模型参数、灰度发布 |
| 会话与任务 | 会话、消息、任务状态 |
| 知识库 | 文档、切片、索引版本、权限标签 |
| 工具与 MCP | 注册、Schema、权限、审计 |
| 成本与限流 | token 统计、预算、配额、队列 |
| 安全与审计 | Guard、审批、操作日志、脱敏 |
| 可观测 | Trace/Span、指标、日志、告警 |

```text
Agent / AgentVersion     配置与版本（可回滚）
Conversation / Message   会话与消息
AgentRun / RunStep       一次运行与每一步（支持断点恢复）
ToolCall / CostRecord    工具调用明细与成本
```

**State 是业务 Source of Truth**：Runtime 可以故障、重启、迁移、重建，
只要 State Store 还在，任务就能续跑。重试建 Attempt，不新建 Task。

## 可观测性：能从 Trace 回答「错在哪一层」

| 观测对象 | 记录内容 |
| --- | --- |
| Trace / Span | 每个节点、工具、模型调用的输入输出、耗时、token |
| 检索 | query、Top-K 得分、命中 chunk、召回率 |
| 工具 | tool_call_id、参数摘要、结果状态、重试次数 |
| 业务 | 任务完成率、拒答率、转人工率、P95 延迟、单次成本 |

::: tip 分层的排障价值
一次「答错」要在 Trace 里能一眼看出：是**检索没命中**、**工具返回异常**、
**Prompt 约束失效**，还是**模型能力不足**。没有 Trace，调优只能靠猜。
:::

## 安全：十类风险与对应护栏

| 风险 | 防护 |
| --- | --- |
| 直接 / 间接 Prompt Injection | Input Guard、指令边界、外部内容当数据 |
| 敏感信息泄露 | 脱敏、输出 Guard、日志脱敏 |
| RAG 越权 | 检索阶段带租户/部门过滤（不能先检索后过滤） |
| Tool Injection / 工具描述投毒 | 可信 Server 白名单、Schema 审核 |
| Excessive Agency（过度授权） | 最小权限、高风险动作审批 |
| MCP 风险 | Server 侧鉴权、传输加密、MCP Guard |
| 输出被直接执行 | 沙箱、结果校验、人工确认 |
| System Prompt 泄露 | 分离配置、拒绝「复述指令」类请求 |
| 无限循环消耗 | 步数上限、超时、预算护栏 |
| 审计缺失 | 全链路操作日志、不可篡改留存 |

架构上对应五道闸：**Input Guard → RAG Guard → Tool/MCP Guard → Output Guard → Approval + Audit**。

## 成本与稳定性

- 限流：QPS / 并发 / 多级队列 / 按租户配额 / 降级策略。
- 缓存：语义缓存、Prompt 缓存、Embedding 缓存（详见 [部署与成本](./deployment-and-cost.md)）。
- 多模型 fallback：主模型不可用时切备用模型，简单任务走小模型。
- 幂等与补偿：写操作带幂等键，失败有回滚或人工兜底路径。

## 上线检查清单

- [ ] 所有外部输入都过 Guard，工具执行前二次鉴权
- [ ] 状态可持久化，服务重启后任务可续跑
- [ ] 每个回答可溯源，检索带权限过滤
- [ ] 高风险动作有审批与审计日志
- [ ] 有步数/超时/预算护栏，异常可降级
- [ ] Trace 覆盖节点、工具、模型调用，指标有告警
- [ ] 健康检查、优雅退出、CI/CD 回滚方案就绪
- [ ] 评测集（含无答案、越权、注入样本）跑通并留基线

## 自测

1. 为什么说「State 是 Source of Truth」？
2. 权限过滤为什么必须放在检索阶段？
3. 没有 Trace 时，「答案错了」会有几种无法区分的原因？
4. 说出三个上线前必须有的护栏。

---

[返回 AI 知识地图](../index.md) · 上一篇：[MCP](../04-agent/mcp.md) · 下一篇：[部署与成本](./deployment-and-cost.md)
