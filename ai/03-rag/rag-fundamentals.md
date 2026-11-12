---
title: RAG 基础：Embedding 与向量库
description: 写入/查询两阶段数据流、切分与相似度、向量库选型、引用溯源与 RAG 的适用边界。
---

# RAG 基础：Embedding 与向量库

RAG（Retrieval-Augmented Generation）= **先检索，再生成**。
它解决三个模型本身解决不了的问题：私域知识、知识时效性、答案可溯源。

## 两阶段数据流

```
离线写入  Ingestion
文档 → 解析 → 切分(Chunk) → 向量化(Embedding) → 入库(向量 + 元数据 + 原文)

在线查询  Query
问题 → 向量化 → 相似检索 Top-K →（可选重排）→ 组装 Prompt → LLM 生成 → 附引用来源
```

> 常见误解：RAG 不是「把文档丢给模型」，也不是「搜关键词」。
> 它是**把检索结果作为上下文的一部分**交给模型，模型负责组织语言，检索负责提供事实。

## 切分（Chunking）：最影响效果的朴素环节

| 参数 | 说明 | 经验 |
| --- | --- | --- |
| chunk size | 每片 token 数 | 300～800 token 起步，按文档结构调 |
| overlap | 相邻片重叠 | 10%～20%，避免把一句话切断 |
| 切分依据 | 字符 / 递归字符 / 语义 / 结构 | 优先按标题、段落、条款等**结构边界**切 |
| 元数据 | 来源、章节、时间、权限、租户 | 过滤与溯源都依赖它，别只存向量 |

::: tip 父子 chunk（Small-to-Big）
用小片段做检索（语义更集中），命中后把**其所属的父段落**塞进上下文（信息更完整）。
这是「检索精度」与「生成完整性」冲突时最常用的解法。
:::

## Embedding 与相似度

Embedding 模型把文本映射成固定维度的向量（如 1024 维），语义相近的文本在向量空间中距离更近。

| 相似度 | 直觉 | 备注 |
| --- | --- | --- |
| 余弦相似度 | 看方向，不看长度 | 文本检索最常用；向量归一化后等价于点积 |
| 点积 | 方向 + 长度 | 计算最快，要求归一化 |
| 欧氏距离 | 绝对距离 | 对向量长度敏感 |

```sql
-- pgvector：余弦距离 <=> 越小越相似
SELECT chunk, 1 - (embedding <=> :query_vec) AS score
FROM langchain_pg_embedding
ORDER BY embedding <=> :query_vec
LIMIT 5;
```

工程要点：

- **Query 与 Document 必须用同一个 Embedding 模型**，维度必须一致。
- 有些嵌入模型要求查询加前缀（例如 `Represent this sentence for searching relevant passages:`），
  写入时不加、查询时加；漏了会明显掉召回。
- `Top-K` 不是越大越好：K 太大引入噪声、挤占上下文、成本上升，通常 3～8 起步并用评测集调。
- **维度不是越高越好**：`vector(3)` 只能做教学演示，真实语义需要几百到上千维；维度影响存储与索引性能。

## 向量库选型

| 方案 | 形态 | 适合 | 取舍 |
| --- | --- | --- | --- |
| FAISS | 本地库/算法库 | 离线实验、单机基准 | 无持久化与权限体系，需自己包一层 |
| Chroma | 轻量嵌入式 | 本地开发、Demo、小项目 | 易上手，生产治理能力有限 |
| pgvector | PostgreSQL 扩展 | **已有 PG 的业务系统**、需要事务与权限 | 与业务数据同库，JOIN 与元数据过滤方便 |
| Qdrant / Milvus | 专用向量数据库 | 大规模、高并发检索 | 运维成本更高 |
| Elasticsearch | 倒排 + 向量 | 需要关键词与向量混合检索 | 已有 ES 栈时顺理成章 |

::: tip 选型判据
先看「是否已有 PostgreSQL / ES 栈」「是否需要租户隔离与事务」「数据规模与 QPS」，
再谈 benchmark。小项目用 Chroma、业务系统用 pgvector，往往比一步上 Milvus 更划算。
:::

## 引用溯源：RAG 的企业级价值

每个 chunk 保留 `source / page / section / url / doc_id`，生成时要求模型输出引用编号，
前端把编号渲染成可点击来源。没有溯源的 RAG 在企业里很难过审——因为无法验证「这句话从哪来」。

```json
{ "answer": "报销需在 30 天内提交…", "sources": [{ "doc_id": "fin-001", "section": "3.2" }] }
```

## RAG 的能力边界

| 需求 | 是否适合 RAG |
| --- | --- |
| 知识频繁更新、需要引用、按权限隔离 | ✅ 非常适合 |
| 需要统计/聚合（「本月共多少单」） | ❌ 应走结构化查询（Text-to-SQL / 工具） |
| 需要改变输出风格或固定格式 | ❌ 更适合 Prompt / 微调 |
| 需要实时执行动作 | ❌ 属于 Agent / 工具调用 |

## 自测

1. 「答案错了」时，怎么判断是检索没找到还是生成没用好？（下一篇）
2. 为什么写入和查询必须用同一个 Embedding 模型？
3. chunk 太大 / 太小分别会出现什么问题？
4. 什么时候该选 pgvector 而不是 Chroma？

---

[返回 AI 知识地图](../index.md) · 上一篇：[Prompt 工程](../02-prompt/prompt-engineering.md) · 下一篇：[高级检索与评测](./rag-advanced-eval.md)
