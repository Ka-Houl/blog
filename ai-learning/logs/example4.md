# Example 4 学习笔记：多 Agent 协作（Multi-Agent）

> 规划阶段（先不写代码）。目标：在 Example 3（单 Agent + 工具 + RAG）基础上，理解"多个 Agent 如何分工协作完成一个复杂任务"。

---

## 1. 这个 Example 要解决什么问题

Example 2/3 都是**单个 Agent**：一个大脑（LLM）+ 一套工具 + ReAct 循环，自己从头干到尾。
但真实复杂任务往往超出单 Agent 的能力边界：

- 任务太长，单轮 context 装不下（如"调研竞品并产出 30 页报告"）
- 任务需要**不同专长**（如"查资料" vs "写文案" vs "校验事实"），一个提示词很难兼顾
- 想**并行**提速（多个子任务互不依赖，可同时跑）

→ 引入"多 Agent"：一个主管（Supervisor/Orchestrator）把任务拆解，派给多个专职 Agent 并行/串行执行。

---

## 2. 核心概念

### 2.1 角色划分
- **主管 Agent（Supervisor / Orchestrator）**：不自己干活，只负责
  - 理解总目标
  - 拆成子任务
  - 决定派给谁、顺序/并行
  - 汇总各 Agent 结果 → 最终交付
- **执行 Agent（Worker / Sub-Agent）**：每个有**专属人设 + 专属工具集**
  - 研究员（Researcher）：带 `search_knowledge` + `web_search`
  - 写手（Writer）：带 `draft_doc`
  - 审校（Reviewer）：带 `fact_check` / `critique`

### 2.2 协作模式
- **顺序（Pipeline）**：研究员 → 写手 → 审校，前者输出是后者输入
- **并行（Fan-out）**：多个子任务无依赖，主管同时派发，全部完成再汇总（Fan-in）
- **反思迭代（Reflection）**：写手产出 → 审校挑刺 → 写手改 → 直到通过

### 2.3 与单 Agent 的本质区别
| 维度 | 单 Agent（Ex2/3） | 多 Agent（Ex4） |
|------|------------------|----------------|
| 决策 | LLM 自己决定调哪个工具 | 主管决定派给哪个 Agent |
| 工具集 | 全局共享一套 | 每个 Agent 私有专属一套 |
| Context | 一会话装全部 | 各 Agent 独立 context，互不污染 |
| 结果汇总 | 直接回答 | 主管聚合多个 Agent 产出 |

---

## 3. 技术栈 / 实现方式（候选）

### 方案 X：手搓编排（推荐，零依赖，最能学到原理）
- 复用 Example 3 的 `callModel` / ReAct 循环骨架
- 新增 `agents.js`：定义每个 Agent 的 `{ name, systemPrompt, tools }`
- 主管用一个"路由提示词"让 LLM 输出 `{"delegate_to":"researcher","task":"..."}` 结构化指令
- 后端按指令调用对应 Agent 的 `chatWithTools`，把结果回灌给主管继续决策
- SSE 事件新增：`agent_start` / `agent_end` / `delegate`，前端可视化"谁在干活"

### 方案 Y：框架（如 LangGraph / AutoGen）
- 用现成图编排（节点=Agent，边=流转）
- 学得快但黑盒，不利于理解底层
- **决定**：先用方案 X 手搓，理解透后再说要不要上框架

---

## 4. 与已有代码的映射（复用清单）

| 复用 | 来源 | 在 Ex4 的角色 |
|------|------|--------------|
| `callModel(payload, onEvent)` | ex3/server/server.js | 各 Agent 调模型统一入口 |
| `chatWithTools(...)` ReAct 循环 | ex3 | 每个执行 Agent 的"干活力" |
| `rag.js`（search_knowledge） | ex3 | 研究员 Agent 的知识工具 |
| `TOOLS` 定义 + `executeTool` | ex3 | 拆成各 Agent 私有工具集 |
| SSE 事件协议（tool_call/tool_result/answer/reasoning） | ex2/ex3 | 扩展 `agent_start`/`agent_end`/`delegate` |
| thinking 开关 | ex2/ex3 | 各 Agent 可选开启 |
| 前端 useToolChat + ToolCallCard | ex3/web | 扩展渲染多 Agent 时间线 |
| 端口约定 | — | Ex4 用 **3004** |

---

## 5. 关键坑（提前标注）

1. **成本/延迟**：多 Agent = 多次 LLM 调用，比单 Agent 慢且贵。demo 要控制 MAX_ROUNDS + 子任务数量。
2. **主管失控**：主管可能无限派活或派错人 → 需要"最大委派次数"护栏（类似 Ex2 的 MAX_ROUNDS）。
3. **结果聚合幻觉**：主管可能把 Worker 的产出"脑补"成错的 → 要求主管**原样引用** Worker 输出，不二次创作。
4. **Context 隔离**：每个 Worker 用独立 messages 数组，别共用同一个会话（否则互相污染、爆 token）。
5. **错误传播**：某 Worker 失败，主管要能捕获并决定重试/换人/降级，而不是直接崩。

---

## 6. 验证方式

- 前端输入一个复合任务，如："调研一下我们公司的请假制度，写一段 100 字的新人提醒，再检查一下有没有事实错误"
  → 应看到：主管委派 Researcher → Researcher 调 search_knowledge → 委派 Writer → 委派 Reviewer → 主管汇总
- 开 thinking 看主管的"拆解推理"和每个 Worker 的推理
- 观察 SSE 时间线：`agent_start(researcher)` → `tool_call` → `agent_end` → `agent_start(writer)` → ...

---

## 7. 已落地（2026-09-02，全部用默认值）

- Agent 角色：主管(Supervisor) + 研究员(Researcher) + 写手(Writer) + 审校(Reviewer) = 4 个 ✅
- 协作模式：顺序 Pipeline + 主管汇聚 ✅（研究员→写手→审校，可反思迭代）
- 并行 Fan-out：未做，留 TODO
- web_search：未接，研究员只用本地 search_knowledge ✅

### 7.1 文件清单
- `example4/server/rag.js`：关键词检索（复制自 Ex3，含单字分词修复）
- `example4/server/agents.js`：4 个 Agent 定义 + 工具 + 执行器
- `example4/server/server.js`：主管编排循环 supervisorLoop（MAX_DELEGATES=6 护栏）+ 复用 callModel/chatWithTools + SSE(agent_start/agent_end/tool_call/tool_result/reasoning/answer)
- `example4/server/package.json`：依赖 dotenv
- `example4/server/.env`：DeepSeek 配置（变量名 OPENAI_API_KEY/BASE_URL/MODEL，与 Ex3 一致）
- `example4/web/`：Vite+React，端口 5174，代理 3004；useMultiAgent hook + AgentTimeline 组件 + App
- 端口：后端 **3004** / 前端 **5174**

### 7.2 验证结果（真实跑通）
复合任务："调研请假制度 → 写100字新人提醒 → 检查事实错误"
链路：`agent_start(研究员)`→多次 search_knowledge(#5等)→`agent_end`
→`agent_start(写手)`→draft_doc→`agent_end`
→`agent_start(审校)`→核查→`agent_end`
→`agent_start(写手)`(压缩到100字)→`agent_start(审校)`(最终通过)→主管汇总 answer
→ **演示了"反思迭代"**：写手→审校→写手改→审校再核。

### 7.3 已知观察 / 待优化
- **研究员 search_knowledge 被反复调用十几次**：ReAct 循环里模型爱多查，单次任务成本高。可优化：worker 限定最多查 1-2 次，或主管一次性给定检索词。
- **主管决策 JSON 偶有不干净**：已用 extractJson 兜底，极端情况回退 summary。
- **TODO**：并行 Fan-out、web_search、删除单篇文档、会话记忆持久化。

---

## 8. 二次修复（2026-09-02 晚）："最终答案下边没内容"三连击

现象：前端时间线跑到 supervisor 汇总后，最终答案气泡为空/未显示。

### 8.1 三个根因
1. **summary 把答案包成 JSON**（如 `{"delegate_to":"summary","task":"..."}`）
   → 主管在汇总阶段被"严格输出 JSON"风格带偏，最终文本是 JSON 而非纯文本。
   → 修：`server.js` summary 分支 systemPrompt 强制"只输出纯文本、严禁 JSON"；新增 `extractFinalAnswer()` 兜底解析残留 JSON；前端 `useMultiAgent.js` 加 `parseAnswer()` 防御。
2. **研究员无限检索致超时无产出**
   → `chatWithTools` 的 MAX_ROUNDS=6 ReAct 循环里模型每轮多次调 search_knowledge，跑满仍不出文本，`chatWithTools` 返回兜底串"未产出"，supervisor 拿到空。
   → 修：`chatWithTools` 加 `maxToolCalls=3` 参数 + 熔断：达到上限后注入"禁止再调工具，直接总结"并强制无工具重请求，逼模型收尾。
3. **根因——BM25 分块把章节标题孤立**
   → `rag.js chunkText` 按空行分段，`## 二、请假与考勤制度` 单独成块，正文（年假/病假…）另成块。搜"请假流程"时标题块因共享"请/假"二字得分更高，正文块只共享"假"字被挤出 topK=3 → 研究员拿到标题却拿不到正文，误判"资料不足"。
   → 修：`chunkText` 分块时给每个正文块附加"最近的章节标题"作检索锚点（`【章节：xxx】\n正文`），检索"请假"时正文块也能命中。

### 8.2 验证（sse_dump5.txt）
复合任务完整跑通：研究员(57行完成)→写手(65行)→审校(85行挑出"请假走OA"推测写成事实)→写手改(93行)→supervisor汇总(97行 answer 纯文本含调研/成稿/核查三段)。
kbSize 仍 40，health 正常。后端已用新代码重启（3004）。

