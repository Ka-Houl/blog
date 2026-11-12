---
title: 从零搭一套本地 RAG 实验室
description: Ollama + Chroma + pgvector 端到端实操清单：环境、嵌入、建表、两套检索实现与常见报错。
---

# 从零搭一套本地 RAG 实验室

这一章是把前两章的概念**全部跑一遍**的最小实验：本地模型 + 两套向量存储 + 可对比的检索实现。
不依赖任何云端 API Key，适合用来验证「切分 / 维度 / 混合检索」到底带来什么差异。

## 组件与职责

| 组件 | 职责 | 备注 |
| --- | --- | --- |
| Ollama | 本地跑 LLM 与 Embedding 模型 | `qwen3:4b` 之类做生成，`mxbai-embed-large` 做嵌入 |
| Chroma | 轻量向量库，快速验证 | 适合 Demo 与本地持久化 |
| PostgreSQL + pgvector | 生产形态的向量存储 | 与业务数据同库，可 JOIN、可加权限过滤 |
| NestJS / FastAPI | Embed 模块 + RAG 接口 | 统一封装，方便两套实现对比 |

::: tip 先跑通再优化
第一版只用「关键词检索」也能跑通全链路（解析 → 切分 → 检索 → 生成），
然后逐步升级到语义检索、混合检索。这样每一步的效果都能用同一份评测集量化。
:::

## 步骤清单

### 1. 起本地模型

```bash
ollama serve
ollama pull qwen3:4b
ollama pull mxbai-embed-large        # 1024 维
ollama list && ollama ps             # 确认已加载
```

本地模型调优常驻参数：`temperature` / `top_p` / `top_k` / `repeat_penalty` /
`num_predict` / `num_ctx` / `seed`。评测时固定 `seed`。

### 2. 准备 pgvector

```sql
CREATE EXTENSION IF NOT EXISTS vector;

CREATE TABLE documents (
  id        bigserial PRIMARY KEY,
  doc_id    text NOT NULL,
  section   text,
  content   text NOT NULL,
  embedding vector(1024)              -- 必须与嵌入模型维度一致
);

-- 余弦距离索引（数据量上来后再建）
CREATE INDEX ON documents USING hnsw (embedding vector_cosine_ops);
```

> `vector(3)` 只适合教学演示（三维可可视化），真实语义检索至少几百维。
> 换 Embedding 模型 = 换维度 = 必须重建表和索引，别在生产里热切换。

### 3. Embed 模块统一入口

```ts
interface Embedder {
  embed(texts: string[]): Promise<number[][]>
  readonly dimensions: number
}

// 查询侧按模型要求加前缀，写入侧不加
const queryVector = (await embedder.embed([
  'Represent this sentence for searching relevant passages: ' + question,
]))[0]
```

批量嵌入要分批 + 限流，失败可重试；把 `(doc_id, chunk_hash)` 做唯一键，
避免重复导入导致索引膨胀。

### 4. 两套检索实现对照

| | Chroma 版 | pgvector 版 |
| --- | --- | --- |
| 写入 | `collection.add({ ids, embeddings, documents, metadatas })` | `INSERT INTO documents(...)` |
| 查询 | `collection.query({ queryEmbeddings, nResults: 5 })` | `ORDER BY embedding <=> $1 LIMIT 5` |
| 元数据过滤 | `where: { dept: 'finance' }` | `WHERE dept = $2 AND ...` |
| 事务/权限 | 弱 | 强（复用 PG 的行级权限） |
| 适合 | 快速原型 | 接入已有业务系统 |

### 5. 组装 Prompt 并生成

```ts
const hits = await retriever.search(question, { topK: 5 })
const context = hits.map((h, i) => `[${i + 1}] ${h.content}（${h.doc_id}）`).join('\n\n')
const answer = await llm.chat([
  { role: 'system', content: '只依据 <context> 回答，无依据时输出 need_human。标注引用编号。' },
  { role: 'user', content: `<context>${context}</context>\n\n问题：${question}` },
])
```

## 常见报错与定位

| 现象 | 原因 |
| --- | --- |
| `dimension mismatch` | 表维度与 Embedding 模型不一致，或换了模型没重建 |
| 召回全是无关内容 | 查询漏了模型要求的前缀；写入/查询用了不同模型 |
| 中文检索效果差 | 用了只支持英文的嵌入模型，或切分把词切开 |
| pgvector 扩展装不上 | Windows 需放对应版本的 dll；优先用 Docker 镜像 |
| 生成很慢 | 本地模型与嵌入模型抢显存；`ollama ps` 看是否常驻 |
| 回答没有引用 | Prompt 没约束输出格式；加结构化输出与校验 |
| 工具调用不稳定 | 本地小模型对 tool calling 支持有限，换较新版本或用提示层兜底 |

## 验证清单

- [ ] 同一问题分别用关键词 / 语义 / 混合检索，记录 Top-1 命中与 MRR
- [ ] 造 20～50 条问答样本（含「知识库里没有」的问题）
- [ ] 关闭知识库时观察模型是否开始编造，打开后是否可溯源
- [ ] 重启服务后索引仍可查询（持久化是否真的生效）
- [ ] 记录 P95 延迟与每轮 token 消耗，作为后续成本基线

::: warning 别忘了权限
一旦接入真实文档，检索阶段就要带 `tenant_id` / `dept` 过滤。
「先检索后过滤」会泄漏不该出现的片段标题，必须在查询里过滤。
:::

---

[返回 AI 知识地图](../index.md) · 上一篇：[高级检索与评测](./rag-advanced-eval.md) · 下一篇：[Function Calling](../04-agent/function-calling.md)
