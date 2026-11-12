---
title: 高级检索与 RAG 评测
description: 混合检索、Query 改写、Rerank、父子 chunk，以及检索侧/生成侧指标与分层排错方法。
---

# 高级检索与 RAG 评测

> 从「能跑通」到「能用」，差的就是这一章：**检索优化**与**可量化的评测**。

## 检索优化技术地图

| 技术 | 解决什么 | 代价 |
| --- | --- | --- |
| Query Rewrite | 口语化/带指代的问题（「那它呢？」） | 多一次 LLM 调用 |
| Multi-Query | 一个问题生成多个视角的查询，合并召回 | 调用与去重成本 |
| HyDE | 先让模型生成「假设答案」，用它去检索 | 假设答案可能带偏 |
| BM25 + 向量混合检索 | 精确术语/编号 + 语义 | 需要融合排序（RRF） |
| 父子 chunk / Small-to-Big | 检索精度 vs 上下文完整 | 存储双层结构 |
| 元数据过滤 | 时间、部门、租户、文档类型 | 依赖高质量元数据 |
| MMR | 去冗余、保证结果多样性 | Top-K 需要放大 |
| Rerank | 用交叉编码器对 Top-N 重排，把最相关的排到前面 | 延迟增加，收益通常最明显 |
| Context Compression | 压缩检索片段，省 token | 可能丢细节 |
| GraphRAG / 多模态 RAG | 实体关系推理、图表混排知识 | 建图/解析成本高 |

::: tip 优化顺序
先**修数据**（解析、切分、元数据）→ 再**修召回**（混合检索、Query 改写）→ 最后**修排序**（Rerank）。
一上来就换 Embedding 模型或加 GraphRAG，往往掩盖了「PDF 表格根本没解析出来」这类根因。
:::

```ts
// 典型的两段式检索
const candidates = await hybridSearch(query, { topK: 30, bm25: 0.3, vector: 0.7 })
const reranked = await reranker.rerank(query, candidates, { topN: 5 })
const context = reranked.map((c) => `[${c.source}] ${c.parentChunk}`).join('\n\n')
```

## 评测：没有指标就没有优化

### 先建 Golden Dataset

每条样本包含：`question`、标准答案要点、`gold_chunk_ids`（相关片段）、可选 `gold_answer`。
覆盖：典型问题、边界问题、无答案问题、需要多片段综合的问题、带权限的问题。
**50～200 条高质量样本**就足以驱动迭代，比几千条随手生成的问题有用。

### 检索侧指标

| 指标 | 含义 |
| --- | --- |
| Hit Rate@K | Top-K 中是否命中至少一个相关片段 |
| Recall@K / Precision@K | 相关片段召回比例 / 结果中相关比例 |
| MRR | 第一个相关结果排名的倒数均值 |
| NDCG@K | 考虑位置与相关性等级的排序质量 |
| Source Accuracy | 最终引用是否真的支持答案 |

### 生成侧指标

| 指标 | 含义 |
| --- | --- |
| Faithfulness | 答案是否完全由检索上下文支撑（防幻觉） |
| Answer Relevance | 答案是否回应了问题本身 |
| Context Relevance | 检索到的上下文是否真的相关 |
| Answer Correctness | 与标准答案的一致性 |

工具：Ragas / TruLens 可算部分指标；开放式正确性常用 **LLM-as-Judge**，
但裁判模型要用固定 Prompt + 固定 seed，并抽样人工复核，避免「模型夸模型」。

## 分层排查：答错到底错在哪

```
答案不对
 ├─ 检索集里根本没有正确片段？
 │    ├─ 是 → 查解析/切分/Embedding/Query 改写  → 修数据层
 │    └─ 否 ↓
 ├─ 正确片段排在第几名？（Top-K 是否够、要不要 Rerank）  → 修排序层
 │    └─ 已在前 3 ↓
 └─ 上下文有、答案仍错 → 查 Prompt 约束、模型能力、引用格式 → 修生成层
```

::: warning 别用「换更强的模型」掩盖检索问题
如果 `Recall@5` 只有 0.4，换 GPT 级别模型也救不回来。
先定位层，再动手，这是 RAG 调试最值钱的一条纪律。
:::

## 上线前检查清单

- [ ] Golden Dataset 有版本号，指标随每次改动跑一遍并记录
- [ ] 无答案问题会正确拒答 / 转人工，而不是编造
- [ ] 每条回答都能溯源，引用与权限过滤一致
- [ ] 文档更新后索引能增量重建，旧版本可回滚
- [ ] 监控：检索得分分布、命中率、拒答率、P95 延迟、token 成本

## 自测

1. 用户反馈「答非所问」，你按什么顺序排查？
2. Rerank 为什么放在召回之后而不是之前？
3. `Hit Rate@5` 很高但 `Faithfulness` 很低，说明什么？
4. 为什么要专门在评测集里放「无答案」样本？

---

[返回 AI 知识地图](../index.md) · 上一篇：[RAG 基础](./rag-fundamentals.md) · 下一篇：[本地 RAG 实验室](./local-rag-lab.md)
