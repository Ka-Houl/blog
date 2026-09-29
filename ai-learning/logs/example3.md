# Example 3 · RAG 知识库问答（学习笔记）

> 状态：⏳ 规划中（仅概念笔记，未动手写代码）
> 目标：让 Agent 基于"真实外部文档"回答，而不是靠模型参数里的记忆（幻觉高风险）

---

## 0. 一句话理解 RAG

**RAG = Retrieval-Augmented Generation（检索增强生成）**

> 用户提问 → 先去"知识库"里检索最相关的几段资料 → 把资料和原问题一起塞进 prompt → 模型基于"检索到的资料"生成答案

核心价值：**让模型回答它训练数据里没有的、或会过时的内容**（公司文档、产品手册、私域知识），且能**溯源**（答案来自哪段资料）。

---

## 1. 为什么 Example 3 是 Example 2 的自然延伸

你 Example 2 已经实现：
- 模型自主调工具（Tool Calling）
- ReAct 循环（想→调→再想→答）
- 多轮记忆
- thinking 开关可视化

Example 3 的本质：**给 Agent 新增一个"知识检索"工具**，把 Example 2 的 `get_weather`（假数据）换成 `search_knowledge`（真实检索）。

```
Example 2 的 Agent：
  用户 → 模型 → 调 get_weather(假) / calculator(本地) → 答

Example 3 的 Agent（复用同一套骨架）：
  用户 → 模型 → 调 search_knowledge(真实检索) → 基于资料答
```

所以 **90% 的前后端代码可复用**：ReAct 循环、SSE 推送、`reasoning` 事件、thinking 开关，全都不用动，只新增一个工具 + 检索管线。这正是 RAG 作为"下一步"学习曲线平滑的原因。

---

## 2. 要学什么（核心概念）

### 2.1 文档切块（Chunking）
- 为什么切：向量模型有长度上限（如 8k token），且检索越细越准
- 常见策略：
  - 固定长度切（如 500 字 / 块，带 overlap 重叠避免切断语义）
  - 按标题/段落/Markdown 结构切（保留语义边界，推荐）
  - 按句子切（适合 QA 场景）
- 你需理解：**块大小直接影响检索质量**（太大→噪声多；太小→上下文缺失）

### 2.2 向量化（Embedding）
- 一句话：把"文本"变成"一串数字（向量）"，语义相近的文本向量距离近
- 模型：DeepSeek 兼容 OpenAI embedding 协议（如 `text-embedding-3-small` 或 DeepSeek 自有 embedding 端点）
- 关键点：**检索时用的 embedding 模型，必须和入库时一致**

### 2.3 向量库（Vector Store）
- 作用：存大量"文本块 → 向量"的映射，支持"给定一个查询向量，快速找最相似的 K 个块"（近似最近邻 ANN 搜索）
- 选项（按复杂度递增）：
  - **零依赖入门**：内存数组 + 暴力余弦相似度（适合几十~几百条 demo，不需要装任何库）
  - 轻量文件库：`sqlite-vec` / `hnswlib`（单文件，免服务）
  - 生产级：`Chroma` / `Qdrant` / `Milvus` / `pgvector`（PostgreSQL 扩展）
- 建议：Example 3 先用**内存暴力检索**跑通全流程，再可选升级到 Chroma

### 2.4 检索 + 拼装 Prompt（Retrieval → Augment）
- 取 Top-K 相关块 → 拼成 context → 构造系统提示：
  ```
  你是基于以下【资料】回答问题的助手。只使用资料内容，
  如资料中没有答案，明确说"资料中没有相关信息"。
  【资料】
  {chunk1}
  {chunk2}
  ...
  【问题】{user_question}
  ```
- 这一步就是普通的 prompt 工程，不涉及新协议

### 2.5 可选的"重排"（ReRank）——进阶
- 先用 embedding 召回 Top-20，再用一个 rerank 模型精排 Top-3，提升精度
- 入门 demo 可跳过，知道存在即可

---

## 3. 技术栈清单（Example 3 会用到）

| 能力 | 技术 | 备注 |
|------|------|------|
| 切块 | 自己写 JS 函数 | 无需库 |
| 向量化 | DeepSeek/OpenAI embedding API | 走你已有的 https 代理模式 |
| 向量库 | 先用内存数组（余弦相似度） | 零依赖；后续可选 Chroma |
| 检索工具 | `search_knowledge(query)` | 加进 Example 2 的 TOOLS 声明 |
| 对话/生成 | 复用 Example 2 的 `chatWithTools` | 完全复用 |
| 前端 | 复用 Example 2 的 React + thinking 开关 | 完全复用 |
| 知识源 | 一份示例文档（如产品 FAQ / 你自己的学习笔记） | 放 `example3/data/` |

---

## 4. 与你已有知识的映射（降低认知负担）

| 你已掌握的 | 在 Example 3 如何复用 |
|------------|----------------------|
| `callModel()` 拼 payload 转发 DeepSeek | 检索工具也用同一套 https 代理调用 embedding 端点 |
| `TOOLS` + `tool_choice:"auto"` | 新增 `search_knowledge` 工具声明，模型自己决定何时检索 |
| ReAct `for` 循环 | 不变——模型"想查资料→调 search_knowledge→看结果→答" |
| SSE `tool_call`/`tool_result`/`answer` 事件 | 不变——检索过程也能像天气工具一样可视化 |
| thinking 开关 + `reasoning` 事件 | **最佳验证场景**：开 thinking 能看到模型"我该检索哪段、为什么用这段" |
| `.env` 管理 API Key | 复用，embedding 端点用同一个 key |
| `test.js` 命令行验证 | 复用思路，写 `example3/server/test.js` 验证检索+回答 |

**新增的唯一"陌生"概念**：embedding 向量 + 余弦相似度。这部分是 RAG 的灵魂，其余都是你已会的东西。

---

## 5. 预期 demo 形态

- 用户问："你们的退款政策是怎样的？"（资料里有，但模型训练数据没有）
- 开 thinking 时前端显示：
  1. 💭 推理："用户问退款政策，我应该先检索知识库"
  2. 🔧 `search_knowledge("退款政策")` → 返回 Top-3 资料块
  3. 💭 推理："资料第 2 块明确写了 7 天无理由，据此回答"
  4. ✅ 最终答案（附带"依据资料第 2 块"）
- 关 thinking 时：只有工具卡片 + 最终答案

—— 和 Example 2 的天气 demo **交互完全一致**，只是工具从"假天气"变成"真检索"。

---

## 6. 可能的坑（提前预警）

1. **embedding 维度不匹配**：入库和查询必须用同一模型，否则向量长度不同无法算相似度
2. **块太大导致检索不准**：demo 先用小文档 + 适中块大小（如 300~500 字）
3. **中文分词**：通用 embedding 模型对中文支持已较好，一般不用额外分词；但块边界尽量按标点/段落切
4. **CORS**：前端仍走 Vite 代理 `/api` → 后端，免跨域（沿用 Example 2）
5. **thinking + 检索的 token 成本**：开 thinking 时检索到的资料也被纳入推理，响应更慢更贵——正好用开关对比体验

---

## 7. 动手前的待确认项（你读完决定）

- [ ] 知识源用什么？建议先用一份你自己的 Markdown（如把 LEARNING_LOG 当语料）
- [ ] 向量库：零依赖内存版（推荐先跑通）还是直接上 Chroma？
- [ ] embedding 模型：用 DeepSeek 自有端点还是 OpenAI 兼容 `text-embedding-3-small`？
- [ ] 是否顺带实现 `/api/ingest`（上传文档→切块→向量化入库）让 demo 可动态更新知识？

> 下一步：你确认以上选项后，我再动手写 `example3/` 代码（后端检索管线 + 复用前端）。

---

## 8. 已落地 · 方案 A（关键词检索先跑通）

**决策（2026-09-02）**：embedding 暂不做，加 TODO 后续推进。先走"关键词检索"跑通 RAG 范式。

### 8.1 改动要点
- **检索方式**：用 BM25-lite 式关键词打分（`rag.js` 的 `search()`）替代向量 embedding。
  - 切块后给每块建"词频索引"（中文按连续汉字、英文按单词分词，带停用词过滤）
  - 查询时按"命中词数 + 词频 + 块长归一"综合打分，取 Top-K
- **依赖**：移除 `@xenova/transformers`，`package.json` 依赖置空（零依赖、启动即用，不再下载 130MB 模型）。
- **接口不变**：`ingestDocument / search / formatContext` 签名不变，后续升级 embedding 只改 `search()` 内部实现。
- **自动入库**：启动仍自动读 `LEARNING_LOG.md` 建关键词索引，开箱即用。

### 8.2 embedding 升级 —— ✅ 已完成（2026-09-08，采用候选 A）

当初留的 TODO 已还。选**候选 A（本地 `@xenova/transformers` + `bge-small-zh`）**：
离线、零 key、不用换端点（DeepSeek 这代确实没有 embeddings API，候选 B 需要另一个 key）。

**改动**：`rag.js` 支持 `RAG_MODE` 三模式，`search()` 变 async（server.js 当初就 await 了，
调用方零改动）；embedding 惰性加载，默认 keyword 时完全不碰模型。

| 模式 | 原理 | 命中（实测 6 块语料 / 5 查询） |
|---|---|---|
| `keyword`（默认） | BM25-lite 词频 | 4/5 |
| `semantic` | 本地 embedding 余弦（512 维） | **5/5** |
| `hybrid` | RRF 倒数排名融合 | 4/5 |

**两个反直觉结论（重点）**：

1. **"问远程办公搜不到居家办公"这个说法是错的**——我在 §8.2 原文里写的例子不成立。
   两者共享「办公」二字，中文单字切分下关键词**照样命中**（第一版测试用例就被这点骗了，跑出 4/4 平局）。
   **关键词真正的短板是口语化改写，不是同义词。**
2. **hybrid 未必优于纯语义**。本语料下关键词一路贡献的净是噪声：
   「分数归一化相加」4/5，改「RRF 融合」仍是 4/5，纯语义 5/5。
   → **关键词的价值是精确匹配**（ID、错误码、专有名词），语义模型不擅长；
   两者是**互补**而非升级替代关系，`RAG_MODE` 要拿真实语料实测再定。

**踩到的坑**：
- `@xenova/transformers` 是 **ESM-only**，Ex3 是 CommonJS → 只能 `await import()`，
  `search()` 因此变 async
- 首次加载模型约 100MB / 20~30s，之后常驻内存；向量无持久化，重启重算

**产出**：`probe-embedding.mjs`（验证模型可用性）、`probe-rag-compare.js`（★ 本项目第一份 eval）。

### 8.3 验证
- `cd example3/server && node server.js` → 看"已自动入库 LEARNING_LOG.md（关键词索引）"
- `node test.js` → 问一个只在 LEARNING_LOG 里的问题，观察 `🔧 search_knowledge` + 答案
- 前端 `cd example3/web && npm run dev`，开 thinking 看检索推理链

### 8.4 正式评测集（补缺 3 · Eval，2026-09-08）

`probe-rag-compare.js` 只是临时对照实验；正式版在 `server/eval/`：

- `eval-cases.js` —— **用例数据**（11 条：字面重叠 / 同义改写 / 产品行为 / 跨语言），
  数据与逻辑分离，扩充评测只改这一个文件
- `rag-eval.js` —— **跑分逻辑**：固定语料（sample-kb.md，18 块）+ 三种模式各跑一遍，
  输出 Top-1 / **MRR** / Top-3 召回。语料用例都随仓库走，任何机器可复现

**实测结果：**

| 模式 | Top-1 | MRR | Top-3 召回 |
|---|---|---|---|
| keyword | 73% | 0.77 | 82% |
| semantic | 73% | 0.85 | 100% |
| **hybrid** | 73% | **0.86** | **100%** |

**三个认知升级（为什么必须建评测集）：**

1. **只看 Top-1 会得出"没差别"的错误结论**——Top-1 三者都是 73%，
   但 Top-3 召回 82% vs 100%。而 RAG 喂给模型的是 Top-K 上下文，**Top-3 召回才是关键指标**。
2. **跨语言是关键词的结构性盲区**（英文问中文文档：keyword 0/1，semantic 1/1），调参救不了。
3. **小语料的结论不能外推**：6 块语料时 hybrid 最差，18 块语料下 hybrid MRR 反超（0.86）——
   RRF 融合的价值在语料变大后才显现。

> 核心认知：**eval 不是可选项**。没有它，"我优化了检索"只是一句感觉；
> 有了它，每次改 prompt / 换模型 / 调切块，跑一遍就知道是进步还是退化。

---

## 9. 知识库生命周期 + 上传文档持久化

**原始设计（初版）**：知识库是 `rag.js` 里的纯内存数组 `let store = []`，无持久化。
- 刷新前端页面 / 重启前端：❌ 不失效（数据在后端内存）
- 重启后端 / 杀进程：✅ 失效（内存清空，重启只自动回 LEARNING_LOG.md）

### 9.1 已加：上传文档落盘持久化
- `/api/ingest` 收到文本后，先把原文 `fs.writeFileSync` 到 `example3/server/uploaded/<name>.md`
- 后端启动时：先 `readdir(uploaded/)` 把所有 `.md/.txt` 重新 ingest，再加载内置 LEARNING_LOG.md
- 效果：**重启后端也不丢上传的文档**（验证：ingest sample-kb → 重启 → health kbSize 仍 40）
- `uploaded/` 已加进 `.gitignore`（不污染仓库）

### 9.2 当前生命周期结论（最终版）
| 操作 | 影响 |
|------|------|
| 刷新前端页面 / 重启前端 | 不失效 |
| 重启后端 | ✅ 自动恢复 LEARNING_LOG + uploaded/ 全部文档，不丢 |
| 删除 uploaded/ 目录文件 | 对应文档下次重启后消失 |
| 清空 uploaded/ + 重启 | 只剩 LEARNING_LOG.md |

> 说明：这是 demo 级"文件持久化"，够学习用。生产级应换真正的向量数据库（如 Chroma / pgvector），并支持删除单篇、增量更新。

### 9.3 中文分词 bug 修复（方案 A 局限）
- 现象：`星河智能是什么`（无标点）检索不到，`星河智能 是什么`（有空格）能检索
- 根因：原 `tokenize` 把连续中文当整词，查询无标点形成"超长词"匹配不到文档短词
- 修复：`tokenize` 改中文单字切 + 英文/数字按词切；`filterTerms` 放宽（中文单字保留、英文词仍≥2、停用字剔除）
- 本质局限：关键词匹配对同义改写不敏感，仍需 embedding 语义检索（见 8.2 TODO）
