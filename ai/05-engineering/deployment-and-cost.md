---
title: 部署、成本与稳定性
description: Ollama 本地部署与参数调优、Docker 多阶段构建、健康检查与优雅退出、CI/CD 与成本工程。
---

# 部署、成本与稳定性

## 本地 / 私有化模型：Ollama 主线

```bash
ollama serve                 # 启动服务
ollama pull qwen3:4b         # 生成模型
ollama pull mxbai-embed-large# 嵌入模型
ollama list / ps             # 查看已下载 / 已加载
```

| 参数 | 作用 | 场景 |
| --- | --- | --- |
| `temperature` / `top_p` / `top_k` | 控制随机性 | 稳定场景 0～0.2，创意 0.8+ |
| `repeat_penalty` | 抑制重复 | 长文本生成 |
| `num_predict` | 输出上限 | 成本护栏 |
| `num_ctx` | 上下文窗口 | 与切分策略联动 |
| `seed` | 复现 | 评测集必开 |

::: tip 三套常用配置
**稳定通用版**（低温度、固定 seed）／**写代码**（低温度、较大 num_ctx）／
**创意文案**（较高温度 + repeat_penalty）。用配置文件管理，别散落在代码里。
:::

资料库在这条线上以 Ollama + Docker 为主，**没有系统覆盖 vLLM / 量化 / GGUF / 推理加速**；
若要做高并发推理服务，需要另开专题补齐。

## Docker 化

```dockerfile
# 多阶段构建：构建产物与运行环境分离
FROM node:22-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm ci                 # 锁文件保证可复现
COPY . .
RUN npm run build

FROM node:22-alpine AS runtime
WORKDIR /app
COPY --from=build /app/dist ./dist
COPY --from=build /app/node_modules ./node_modules
HEALTHCHECK --interval=30s CMD wget -qO- http://localhost:3000/health || exit 1
USER node
CMD ["node", "dist/main.js"]
```

要点：

- **层缓存**：先复制 manifest 安装依赖，再复制源码，改代码不重装依赖。
- **健康检查**：`/health` 区分存活与就绪（依赖 DB / 向量库是否连通）。
- **优雅退出**：收到 SIGTERM 后停止接新请求，等待在飞的 SSE 流结束或超时，再关闭连接池。
- **配置外置**：`.env` / 密钥管理，镜像里不含任何密钥。
- **Compose 全栈**：Nginx + Backend + PostgreSQL(pgvector) + Redis + 向量库 + Frontend。

## CI/CD 与发布

```
push → lint/typecheck → 单测 → 评测集回归 → 构建镜像 → 预发灰度 → 生产
                                   ↑
                        Prompt / 检索配置变更也要跑回归
```

- 数据库迁移（新增 pgvector 表、索引）与索引重建要有独立可回滚的步骤。
- Agent 配置（Prompt、工具集、模型版本）与代码一样要版本化、可灰度、可回滚。
- 回滚不只是「回退镜像」，还要考虑 State 结构兼容与索引版本。

## 成本工程：钱花在哪，就优化哪

| 手段 | 原理 | 注意 |
| --- | --- | --- |
| 语义缓存 | 相似问题复用历史答案 | 必须带租户/时效/权限维度，否则串数据 |
| Prompt 缓存 | 固定 System Prompt 前缀复用 | 把稳定内容放前面，变量放后面 |
| Embedding 缓存 | 文档不重复向量化 | 用 `chunk_hash` 去重 |
| Token 压缩 | 历史摘要、检索片段压缩 | 别压掉关键依据 |
| 模型分级 | 简单任务走小模型/本地模型 | 需路由判据与质量监控 |
| 限流与队列 | 削峰、按租户配额 | 高峰期要有降级话术 |
| 输出上限 | `max_tokens` 护栏 | 防失控循环 |
| 并行与流式 | 降感知延迟 | 不降总成本，但改善体验 |

监控指标（示例）：`ai_tokens_total`、`cache_requests_total`、
`agent_run_duration_seconds`、`tool_call_errors_total`、`rag_hit_rate`、`answer_reject_rate`。

::: warning 别只盯单次调用成本
Agent 的成本主要来自**循环步数**：多一次无意义的反思/重试，就是一整轮输入 + 输出。
先看 Trace 里的平均步数与循环率，再谈换便宜模型。
:::

## 上线清单（运维视角）

- [ ] 健康检查 / 就绪检查 / 优雅退出已验证（滚动更新不中断 SSE）
- [ ] 日志结构化且脱敏，Trace 可跨服务串联
- [ ] 密钥、数据库、向量库备份与恢复演练
- [ ] 模型/向量库/Embed 模型版本固定，升级有重建与回滚方案
- [ ] 预算告警、限流阈值、降级与人工兜底路径可用
- [ ] 评测集在预发自动跑，指标退化阻断发布

## 自测

1. 多阶段构建为什么先复制 `package*.json`？
2. 语义缓存最容易出什么安全事故？
3. 优雅退出对 SSE 应用意味着什么？
4. Agent 成本优化先看哪个指标？

---

[返回 AI 知识地图](../index.md) · 上一篇：[企业级架构](./enterprise-architecture.md) · 下一篇：[实战复盘](../06-practice/learning-path-review.md)
