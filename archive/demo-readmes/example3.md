# Example 3 · RAG 知识库问答

在 Example 2（Tool Calling + ReAct + thinking 开关）基础上，把"假数据工具"换成**真实的知识检索工具** `search_knowledge`：

> 模型自主决定何时检索知识库 → 后端用关键词检索（BM25-lite）取 Top-K → 模型基于检索到的资料回答

前端可直接上传 `.md/.txt` 文档入库，并实时看到「🔧 调用 search_knowledge → 📦 返回资料片段 → 最终回答」的完整链路。

## 它做了什么

- **上传入库**：`/api/ingest` 把文档原文落盘到 `server/uploaded/`，同时切块存入内存知识库
- **检索回答**：用户提问 → 模型判断要不要查 → 调 `search_knowledge` → BM25 打分取 Top-3 → 模型引用资料作答
- **重启不丢**：`uploaded/` 里的文档在启动时自动重新入库
- **自动入库**：启动时自动把根目录 `LEARNING_LOG.md` 也灌进知识库，开箱即可问"我这个项目做到哪了"

## 目录结构

```
example3/
├── server/                  # 后端：默认零第三方依赖（启用语义检索时才需要 transformers）
│   ├── server.js            # 声明工具 + ReAct 循环 + SSE 事件流 + 上传/检索 API
│   ├── rag.js               # RAG 核心：切块(chunkText) + 索引(tf/vec) + 三种检索模式
│   ├── test.js              # 检索自测脚本（不调模型，直接验证 rag.search 命中）
│   ├── probe-embedding.mjs  # 探针：本地 embedding 能否加载 + 中文语义相似度是否靠谱
│   ├── probe-rag-compare.js # 探针：小型对照实验（6 块语料，快速验证思路用）
│   ├── eval/                # ★ 正式评测集：eval-cases.js（用例数据）+ rag-eval.js（跑分）
│   │                        #    输出 Top-1 / MRR / Top-3 召回，随仓库走、任何机器可复现
│   ├── package.json         # 默认零依赖；语义检索需 @xenova/transformers（约 100MB 模型）
│   ├── .env / .env.example  # LLM 配置（+ 可选 RAG_MODE=keyword|semantic|hybrid）
│   └── uploaded/            # 上传文档落盘目录（.gitignore 已忽略，重启自动重载）
├── web/                     # 前端：Vite + React（端口 5173，代理 /api → 3003）
│   └── src/
│       ├── hooks/useToolChat.js    # fetch + ReadableStream 解析 SSE 帧 + 上传文档
│       ├── components/ToolCallCard.jsx
│       └── App.jsx
├── sample-kb.md             # 示例知识库（虚构"星河智能"员工手册，用于演示上传问答）
└── README.md
```

## 运行

```bash
# 终端 A：后端（端口 3003）
cd example3/server
cp .env.example .env      # 编辑 .env 填入 LLM_API_KEY
node server.js

# 终端 B：前端（端口 5173，Vite 已代理 /api → 3003）
cd example3/web
npm install
npm run dev
# 打开 http://localhost:5173
```

健康检查：`curl http://localhost:3003/health` → 返回 `kbSize` 即当前知识库块数（启动后至少含 `LEARNING_LOG`）。

只想验证检索、不想花钱调模型：

```bash
cd example3/server && node test.js
```

## 环境变量

| 变量 | 说明 |
|------|------|
| `LLM_API_KEY` | DeepSeek / OpenAI 兼容的 key |
| `LLM_BASE_URL` | 默认 `https://api.deepseek.com`（**不要**以 `/` 结尾，代码会拼接 `/chat/completions`） |
| `LLM_MODEL` | 默认 `deepseek-v4-flash` |

> 注意：Ex3 是**零依赖**后端，没有装 `dotenv`，`server.js` 里手写了一个 `loadEnv()` 读取同目录 `.env`（Example 4 才改用 `dotenv`）。
> 另外 Ex3 用 `LLM_*` 变量名、Ex4 用 `OPENAI_*`，两边不一致，复制配置时留意别串。

## API

| 方法 | 路径 | 作用 |
|------|------|------|
| `POST` | `/api/chat` | 提问（SSE 流：tool_call / tool_result / reasoning / answer / done） |
| `POST` | `/api/ingest` | 上传文档入库（body: `{ text, name }`），落盘 + 切块 |
| `POST` | `/api/reset` | 清空知识库 |
| `GET` | `/health` | 健康检查 + `kbSize` |

## 关键知识点

- **切块（Chunking）**：`chunkText()` 按空行分段，超过 `maxLen=400` 再按 `overlap=80` 滑动切分；标题与正文会各自成块
- **词频（TF）**：入库时对每个块算 term frequency，检索时用 `1 + log(freq)` 累加得分
- **BM25-lite 打分**：命中词得分 × 查询词覆盖率 × 长度归一化，取 Top-3；只返回 `score > 0` 的块
- **中文分词（踩过坑）**：中文按**单字**切分。早期按"连续汉字"整体切，导致查询"星河智能是什么"（无标点）变成一个超长词，永远匹配不到；同时 `filterTerms` 里 `t.length > 1` 会把单字全过滤掉——两处都已修复
- **工具即能力**：RAG 对模型而言只是一个普通工具 `search_knowledge`，模型自己决定调不调、查什么词
- **持久化**：内存库 `let store = []` 本身重启即丢，靠 `uploaded/` 落盘 + 启动重载来"续命"
- **语义检索 ≠ 关键词检索的替代品**：embedding 擅长"意思相近"，关键词擅长"字面精确"（ID/错误码/专有名词）。
  两者是**互补**关系，不是升级替代关系——所以要按语料实测决定用哪种（`RAG_MODE`）
- **混合检索要用 RRF，不要直接加分数**：两路分数量纲不同（关键词无上界、余弦 0~1），
  归一化相加会让"分高但排错"的一路压过另一路。RRF 按**名次**融合（`Σ 1/(60+rank)`），对量纲免疫
- **ESM-only 包在 CommonJS 里要用动态 `import()`**：`@xenova/transformers` 是 ESM，
  Ex3 是 CommonJS，只能 `await import(...)`，因此 `search()` 变成 async

## 检索模式（关键词 / 语义 / 混合）

> 当初的「方案 A」只做了关键词检索，语义检索（embedding）是留的 TODO —— **现已补上**。
> 用环境变量 `RAG_MODE` 切换，**默认 `keyword`，与升级前行为完全一致**。

| 模式 | 原理 | 优点 | 代价 |
|---|---|---|---|
| `keyword`（默认） | BM25-lite 词频打分 | 零依赖、启动即用、**精确匹配强** | 不懂同义改写 |
| `semantic` | 本地 embedding（`bge-small-zh`，512 维）余弦相似度 | 懂语义，口语化提问也能命中 | 首次加载约 100MB 模型（20~30s） |
| `hybrid` | RRF 倒数排名融合两路 | 兼顾精确匹配与语义泛化 | 同上；小语料下可能不如纯语义 |

```bash
# PowerShell
$env:RAG_MODE="semantic"; npm start
# macOS / Linux
RAG_MODE=semantic npm start
```

> - `search()` 因此变成 `async`。调用方 `server.js` 当初就写了 `await rag.search(...)`，**接口无需改动**
> - embedding **惰性加载**：不启用语义模式就完全不碰模型
> - 对外接口 `ingestDocument / search / formatContext / storeSize` 全部不变

### 实测对比（正式评测集 `eval/rag-eval.js`）

固定语料（`sample-kb.md`，18 块）+ 11 条用例（含字面重叠 / 同义改写 / 产品行为 / **跨语言**），
三种模式各跑一遍。**语料和用例都随仓库走，任何机器都能复现。**

| 模式 | Top-1 | MRR | **Top-3 召回** |
|---|---|---|---|
| keyword | 73% | 0.77 | 82% |
| semantic | 73% | 0.85 | **100%** |
| **hybrid** | 73% | **0.86** | **100%** |

**四个发现（比数字更有价值）：**

1. **Top-1 三者打平，但 Top-3 召回拉开差距（82% vs 100%）**。
   而 RAG 实际喂给模型的是 Top-K 上下文——**Top-3 召回才是真正重要的指标**。
   只看 Top-1 会得出"没差别"的错误结论，**这就是必须建评测集的原因**。
2. **跨语言是关键词的结构性盲区**：英文问中文文档（`how many employees...`）
   keyword 0/1，semantic 1/1。这种情况调参救不了。
3. **hybrid 在 18 块语料下 MRR 最优（0.86）**——修正了 6 块小语料时"hybrid 不行"的结论，
   **RRF 融合在语料变大后开始发挥价值**。所以前面"小语料下的结论"不能直接外推。
4. **关键词检索比想象中抗造**：早期笔记写的"问远程办公搜不到居家办公"并不准确
   （共享「办公」二字，单字切分下照样命中）。它真正的短板是**口语化改写**和**跨语言**。

> 📌 **扩充评测集只改一个文件**：`server/eval/eval-cases.js`（数据与逻辑分离）。
> 加一条 `{ q, mustInclude, type }` 就是一个新用例。
> 以后每次改 prompt、换模型、调切块策略，跑一遍就知道有没有退化。

### 已知限制

- **章节标题孤立**：`## 二、请假与考勤制度` 会单独成块，正文（年假/病假…）另成块；搜"请假流程"时标题块因共享"请/假"二字得分更高，正文块被挤出 Top-3，导致模型拿到标题却拿不到正文。
  **该问题已在 Example 4 修复**（`chunkText` 给正文块附加"最近的章节标题"作检索锚点），如需可回移到 Ex3
- **删除单篇文档**：目前只能 `/api/reset` 全清，不支持按来源删除
- **向量无持久化**：embedding 只存在内存（`item.vec`），重启后重算。生产应落盘或换向量库
- **首次语义检索有延迟**：加载本地模型约 20~30s（之后常驻内存）。默认 `keyword` 模式不受影响
- **Ex3 不再"零依赖"**：启用语义模式需要 `@xenova/transformers` + 约 100MB 模型

## 与 Example 2 的区别

Example 2 的工具是**假数据**（天气/计算器写死返回值），模型调了也拿不到真实信息；
Example 3 把工具换成**真实知识检索**——模型能拿到训练数据里没有的私有文档内容，
这是"能查资料的 Agent"和"会调函数的聊天"的分水岭。

## 下一步

- ✅ ~~把 `rag.js` 的 `search()` 升级为 embedding 语义检索~~ —— 已完成，见上方「检索模式」
- ✅ ~~建正式评测集~~ —— 已完成：`server/eval/rag-eval.js`（Top-1 / MRR / Top-3 召回，数据与逻辑分离）
- 把评测集语料换成你自己的真实知识库（在 `eval/eval-cases.js` 里加用例即可）
- 给评测加"检索不到"类用例（期望返回空/拒答，验证不编造）
- 回移 Ex4 的「章节标题锚点」修复（正文块附加最近章节标题，解决标题块挤掉正文的问题）
- 按来源删除单篇文档（当前只能全清）
- 向量持久化（落盘或换向量库），避免重启重算
- Example 4：多 Agent 协作（Supervisor 拆解任务，派给研究员/写手/审校）
