# AI Agent 学习总览 (Learning Log)

> 用途：学习计划、进度速览、环境配置、踩坑索引。详细进度见 `logs/exampleN.md`。
> 协作规则见根目录 `AGENTS.md`（每次对话后自动更新本文件与对应日志）。
> 最后更新：2026-09-15（Ex1~5 完成并验收；补缺 1~5 完成；**补缺 6 · MCP 工具集成完成并验证（Ex6）**）

---

## 一、学习计划与进度速览

| 阶段 | 主题 | 状态 | 详细日志 |
|------|------|------|----------|
| Example 1 | 流式对话界面（前端消费 LLM 流式输出） | ✅ 已完成并验证 | [logs/example1.md](logs/example1.md) |
| Example 2 | Tool Calling（模型自主调函数） | ✅ 已完成并验证 | [logs/example2.md](logs/example2.md) |
| Example 3 | RAG 知识库问答 | ✅ 已完成并验证 | [logs/example3.md](logs/example3.md) |
| Example 3 升级 | **语义检索（本地 embedding）** — `RAG_MODE=keyword\|semantic\|hybrid` | ✅ 已完成并验证（semantic 5/5 > keyword 4/5） | [README 检索模式](example3/README.md) |
| Example 4 | 多 Agent 协作（手搓 Supervisor 编排） | ✅ 已完成并验证 | [logs/example4.md](logs/example4.md) |
| Example 5 | 用 LangGraph.js 重写多 Agent（框架化） | ✅ 已完成并验证 | [logs/example5.md](logs/example5.md) |
| Example 5 · P0·2 | 检查点：会话持久化 / 断点恢复（MemorySaver） | ✅ 已完成并验收（2026-09-08） | [logs/example5.md §8](logs/example5.md) |
| Example 5 · P0·3 | `createReactAgent` 对照（框架预置 ReAct） | ✅ 已完成并验证 | [README P0·3](example5/README.md) |
| 补缺 · 1 | **结构化输出**（主管决策 JSON） | ✅ 已完成（探针实测 + 已落地） | [example5/README](example5/README.md) |
| 补缺 · 2 | **语义检索 / embedding** | ✅ 已完成（见上） | [example3/README](example3/README.md) |
| 补缺 · 3 | **Eval 评测集** | ✅ 已完成并验证（`example3/server/eval/`，Top-1/MRR/Top-3 召回） | [example3/README](example3/README.md) |
| 补缺 · 4 | **HITL 人工审批**（`interrupt` + checkpointer + `Command`） | ✅ 已完成并验证 | [example5/README HITL 章](example5/README.md) / [logs §10](logs/example5.md) |
| 补缺 · 5 | **LangSmith 可观测性** | ✅ 已完成并验证 | [example5/README 补缺5 章](example5/README.md) / [logs §14](logs/example5.md) |
| 补缺 · 6 | **MCP 工具集成**（Ex6：`search_knowledge` 改走独立进程 mcp-server） | ✅ 完成并验证（2026-09-15，web E2E 触发 3 次 `tool_call`） | [example6/README 补缺6 章](example6/README.md) / [mcp-server/index.mjs](example6/server/mcp-server/index.mjs) |
| — | 低代码搭建（Dify/Coze） | ❌ 决定不做（属"平台使用"，非原理进阶） | — |
| 📄 速查 | **LangGraph 一页纸速查**（只留框架本身，剔掉 plumbing） | 📌 看 Ex5 前先读这个 | [logs/langgraph-cheatsheet.md](logs/langgraph-cheatsheet.md) |

> ✅ **P0·2 验收记录（2026-09-08）**：3 个修复经人工验收通过——
> ①停止后「续跑断点」按钮稳定显示（不再闪失）②断点续跑正常 ③**刷新后用户消息 + AI 回答都在**
> （角色映射 bug 的直接证据）。多轮场景（验收项 4）同代码路径，未单独测，风险低。

推荐顺序：1 → 2 →（3 或 5）→ 4
实际路径：1 → 2 → 3 → 4 → 5（LangGraph 框架化）

### 阶段划分
- **原理阶段（Ex1~4，已完成）**：流式交互 → 工具调用 → 知识增强 → 多 Agent 编排，
  四层能力栈全部手搓，理解 Agent 的底层工作方式。
- **框架阶段（Ex5，已完成）**：用 LangGraph.js 重写 Ex4，补齐"至少练熟一种框架"这一环。
- **低代码（原 Ex5，决定不做）**：Dify/Coze 属"平台使用"，不引入新的底层原理，跳过。

### 为什么补了框架这一环
校准标准（群友建议，认可）：①能独立用 Agent 解决一个过去的问题 ②至少练熟一种框架
③对 prompt/context 调优有概念、知道如何 debug。
Ex4 结束时 ①已达标、③部分达标、②完全空白。Ex5 即补 ②。
核心认知：**原理到位 ≠ 工作达标**——生产环境不会让你从零写 supervisor loop。

---

## 二、变更日志（每次对话追加一行）

- 2026-09-01：完成 Example 1（React + DeepSeek 真实流式）；修复 baseURL/https 等坑
- 2026-09-01：完成 Example 2（Tool Calling）；后端执行工具 + SSE 展示调用过程
- 2026-09-02：拆分 LEARNING_LOG 为总览 + logs/；新增 AGENTS.md 约定自动更新规则
- 2026-09-02：Example 2 增强——多轮记忆(conversation 数组) + ReAct 工具调用循环 + /api/reset 清空会话；前端加"清空会话"按钮
- 2026-09-02：Example 2 加 ReAct 对比实验——thinking 开关可视化（前端 🧠 ON/OFF 按钮 + 后端 `THINKING_ON` 控制 + 新增 `reasoning` SSE 事件展示思维链）
- 2026-09-02：为 Example 2 核心代码补充 review 注释；记录"模型推理链差异需接入方抹平（请求参数/响应字段/前端契约三层）"认知 → 见 logs/example2.md
- 2026-09-02：完成 Example 3 概念笔记 logs/example3.md（RAG 要学什么/技术栈/与 Example 2 知识映射/待确认项），尚未动手写代码
- 2026-09-02：完成 Example 3 动手实现——rag.js（切块 + BM25-lite 关键词检索）+ search_knowledge 工具 + /api/ingest 上传；采用【方案 A 关键词检索】，embedding 语义检索留 TODO
- 2026-09-02：修复 Ex3 中文分词 bug——连续汉字整体切导致无标点查询成超长词匹配不到；改中文单字切 + 放宽 filterTerms（原 t.length>1 滤掉单字）
- 2026-09-02：Ex3 新增 uploaded/ 落盘持久化 + 启动自动重载（重启不丢）；启动时自动入库根目录 LEARNING_LOG.md
- 2026-09-02：完成 Example 4 多 Agent——手搓 Supervisor 编排（主管+研究员+写手+审校），MAX_DELEGATES=6 护栏；跑通反思迭代链路（写手→审校→写手改→审校再核→主管汇总）
- 2026-09-02：修复 Ex4"最终答案不显示"三连坑——①summary 把答案包成 JSON（加 extractFinalAnswer + 前端 parseAnswer 双重兜底）②研究员无限检索不总结（加 maxToolCalls=3 熔断）③BM25 分块把章节标题孤立致正文检索不到（chunkText 给正文块附加最近章节标题锚点）
- 2026-09-02：为 example3 / example4 补齐 README.md（对齐 Ex1/Ex2 风格：目录结构/运行/环境变量/API/关键知识点/与上一例区别/下一步）
- 2026-09-02：决定**不做**低代码（Dify/Coze）——属"平台使用"非"原理进阶"；改为补框架环节
- 2026-09-02：完成 Example 5——用 **LangGraph.js** 重写 Ex4 多 Agent（StateGraph + 条件边 + **循环边**表达反思迭代）。选型纠正：多 Agent 必须用 LangGraph（支持循环），LangChain 的 chain 是有向无环图，表达不了"写手→审校→写手改"回环
- 2026-09-02：踩坑记录——LangGraph.js **1.x API 已变**（旧 `MessagesAnnotation` → 新 `StateSchema` + `MessagesValue` + `ReducedValue`），网上教程多为旧版；沉淀方法论"先写最小探针验证 API 再写业务"（`example5/server/probe.mjs`）
- 2026-09-02：Ex5 验证通过——探针 4 项（StateSchema/条件边/ChatDeepSeek/bindTools）全过；完整链路跑通反思迭代（委派 6 次触发护栏，160.6s），循环边、工具熔断、章节锚点修复均生效
- 2026-09-02：Ex5 P0·1 完成——`server.js` 用 `graph.stream()` 经 SSE 推送（事件：start/node_update/supervisor_decision/agent_start/tool_call/tool_result/agent_end/agent_output/final/done）；`example5/web` 前端适配 Ex5 事件契约（端口 5175，proxy /api→3005），`npm run build` 通过，健康检查 `/health` 返回 kbSize 57。学习路线 P0~P4 写入 `example5/README.md`
- 2026-09-03：Ex5 **P0·2 完成**——接入 `MemorySaver` 检查点：新增 `session.js`（进程级单例 saver + 会话元数据 + 并发护栏）、`graph.js` 支持注入 checkpointer 并新增 `turnSteps` 按轮计数、`server.js` 新增 `/api/sessions` 与 `GET|DELETE /api/session/:id`、`/api/chat` 支持 threadId 多轮与 resume 续跑；前端加会话栏（会话 ID/新会话/停止/续跑断点/刷新回放历史）。`test-session.mjs` 端到端 8 项断言全过（多轮记忆 messages 3→6；中断 0.5s 生效；续跑答案复用前两轮上下文）
- 2026-09-03：Ex5 P0·2 踩坑三则（详见 logs/example5.md §8.2）——①saver 必须单例，在 buildGraph 内 new 会丢记忆 ②**框架不会把 `signal` 自动透传给 `model.invoke()`**，不透传则客户端断开后后端继续烧 token（修复后中断 0.5s 生效）③`getState().next` 非空不等于"有断点"，运行中同样非空，必须配合 running 标志判断
- 2026-09-03：修复 Ex5"刷新回放丢用户消息"根因——**LangChain 的 BaseMessage 没有 `.role` 属性**（`probe-role.mjs` 实测恒为 undefined，角色在 `getType()`：human/ai）；此前 `/api/session` 用 `m?.role` 映射导致所有消息 role="unknown"，前端只能按 role 识别的用户气泡被整条丢弃（AI 气泡靠内容前缀匹配所以幸存）。修复：后端按 `getType()` 映射为 OpenAI 风格 role（human→user / ai→assistant）。同轮另修两处：①停止后前端 `refreshSession` 竞态（后端收尾中 running 未清，interrupted 被误判 false → 续跑按钮闪失），改为 running 时等待重试；②中断轮次无 `[主管汇总]`，其 worker 产出在回放中永不渲染，现补"未跑完即被中断"气泡
- 2026-09-08：Ex5 补「**结构化输出**」——先写 `probe-structured.mjs` 实测 4 条路：①`withStructuredOutput(functionCalling)` 被 DeepSeek **thinking 模式**挡死（400 `tool_choice`）②`response_format:json_object` **只保证合法 JSON、不保证符合 zod schema**（模型会自己发明字段名），字段规范仍须写在 prompt 里③现状裸 prompt 3/3④**字段规范 prompt + response_format = 3/3（采纳）**。落地：`graph.js` 主管 prompt 补小写 `json`（DeepSeek 硬性要求，否则 400）+ 加 `response_format`，`extractJson` 降级为安全网；探针内置 E 组用真实 prompt 做回归验证
- 2026-09-08：Ex3 补「**语义检索**」（当初方案 A 留的最大技术债）——`rag.js` 新增本地 embedding（`bge-small-zh`，512 维），`RAG_MODE=keyword\|semantic\|hybrid` 三模式可切换，**默认 keyword 行为不变**；`search()` 变 async 但 server.js 早已 await，调用方零改动。新增 `probe-embedding.mjs` + `probe-rag-compare.js`（★ 本项目第一份 eval）
- 2026-09-08：**P0·3 完成**——`createReactAgent` 对照。新增 `graph-react.js`（worker 改用预置 ReAct，拓扑/主管/汇总/检查点全部复用 `graph.js`）+ `probe-react-agent.mjs`。探针实测：内置图自带 `agent↔tools` 循环边（`__start__→agent→tools→agent→__end__`），等价于我们手写的 `for(round<MAX_ROUNDS)`；`.stream()` 可用；`recursionLimit` 触发 `GraphRecursionError`。**代价（决定是否替换的关键）**：①预置 agent **没有"工具调用次数"熔断**，`recursionLimit` 数的是【节点步数】（一轮 agent+tools = 2 步），同任务实测跑 4 次 > 手写版 3 次 ②工具调用发生在**子图内部**，外层 `onEvent` 看不到 → SSE 时间线会空白。我们的处理：按"一轮=2步"把 `MAX_TOOL_CALLS` 换算成 `recursionLimit`（近似，非精确熔断）+ worker 内部 `agent.stream()` 转发 `tool_call`/`tool_result`。实跑 17.1s / 委派 2 次 / 工具 3 次，事件转发成功。**结论：暂不替换手写版**（会丢成本控制）
- 2026-09-08：**补缺 3 · 正式评测集落地**（`example3/server/eval/`）——`eval-cases.js`（11 条用例数据，字面/改写/产品行为/跨语言）+ `rag-eval.js`（跑分：Top-1 / **MRR** / Top-3 召回），语料固定为 sample-kb.md（18 块）随仓库走、任何机器可复现。实测：Top-1 三模式均 73%，但 **Top-3 召回 82% vs 100%** 拉开差距（RAG 喂给模型的是 Top-K 上下文，**这才是关键指标**）；跨语言查询 keyword 0/1 vs semantic 1/1（结构性盲区）；**hybrid MRR 0.86 最优**——修正了 6 块小语料时"hybrid 不行"的结论，RRF 的价值在语料变大后才显现。核心认知：**eval 不是可选项**，没有它所有优化都无法证明有效——①"远程办公搜不到居家办公"是**错的**（共享「办公」二字，中文单字切分下关键词照样命中），关键词真正的短板是**口语化改写**②**hybrid 不一定最好**：6 块小语料下关键词一路净是噪声，"分数归一化相加"和"RRF 融合"都只有 4/5，而纯语义 5/5；关键词的真正价值是**精确匹配**（ID/错误码/专有名词），`RAG_MODE` 要用真实语料实测再定
- 2026-09-08：**补缺 4 · HITL 人工审批（`interrupt`）落地**。新增 `probe-hitl.mjs`（5 项全过：动态中断 / 读 interrupts 负载 / `Command({resume})` 恢复 / **跨图实例恢复** / `interruptBefore`）+ `test-hitl.mjs`（集成测试：写手产出后中断 → 取出 134 字草稿 → 提交「通过」后跑出最终答案，事件 `hitl_wait→hitl_done→final`）。落地：`graph.js` 新增 `isHITL()` + `makeHumanReviewNode()`，`HITL=1` 才在 `writer→human_review→supervisor` 插节点（默认关闭，不破坏已验收流程）；`server.js` 用 `new Command({resume})` 恢复、`/api/session/:id` 返 `interrupts`（刷新后确认框还在）；前端 `pendingHitl` + 📋 确认框（含草稿折叠、快捷通过）。核心认知：**HITL = interrupt + checkpointer + Command，三者缺一不可**；中断节点"第一次调用不执行后续代码"
- 2026-09-08：**补缺 5 · LangSmith 可观测性落地**。LangChain/LangGraph trace 是**自动埋点**——`@langchain/core` 内置 callback，设环境变量后 `LLM.invoke`/`bindTools`/`graph` 节点执行自动上报，**业务代码零侵入**（`graph.js`/`tools.js` 无 LangSmith 代码）。用户提供了真实 key，已写入 `.env`（被 gitignore，不入库）；`.env.example` 加了中文配置段与获取步骤。额外加了"状态可见"：`server.js` 的 `tracingStatus()`（启动日志打印 `[langsmith] tracing: enabled/disabled` + 原因、`/health` 返回 `tracing` 字段）；`probe-langsmith.mjs` 验证配置逻辑（不联网、不需真 key）。核心认知：**可观测性≠日志**（日志主动会漏，trace 自动不漏）；**LangSmith 只看 LangChain 原生调用**，自研 `onEvent` SSE 事件不进 LangSmith；它是 **P1 prompt 调优的必备配套**——没有 trace 就看不清哪步吃最多 token
- 2026-09-08：**补缺 6 · MCP 工具集成落地（Ex6）**。`example6` 从 `example5` 复制为纯净基线（commit 1）后叠加 MCP（commit 2），便于 `git diff` 直观对比。核心改动：**`search_knowledge` 从"本进程函数"变成"跨进程 MCP 调用"**——新增 `server/mcp-server/index.mjs`（独立进程，自带 sample-kb.md 检索，日志走 stderr 不污染 JSON-RPC）、`server/mcpClient.js`（StdioClientTransport 拉起子进程 + listTools + JSON Schema→zod 转 LangChain `tool()`）、`server/probe-mcp.mjs`（链路探针，不依赖模型）。`tools.js` 改函数式 `TOOL_MAP`/`getSearchTool()`（MCP 工具异步初始化，延迟解析），`graph.js` 的 `AGENT_TOOLS` 同步改函数式，`server.js` 在 `buildGraph` 前 `await initTools()`；**MCP 不可用自动降级本地 `rag.js`** 保证不崩。`package.json` 加 `@modelcontextprotocol/sdk`。验证：探针列工具+跨进程调用全过，`node server.js` 启动日志含「`[tools] search_knowledge 已通过 MCP 接入`」、`/health` 返回 `kbSize:93`。核心认知：**MCP 的真正价值是工具实现与 Agent 运行时解耦**；stdio 模式 stdout 是协议通道必须写 stderr；MCP 工具异步，需"顶层值→运行时函数"再挂图
- 2026-09-08（续）：Ex6 **web 端到端触发 `tool_call` 待回家验证**。现象：server 启动后 `[tools] search_knowledge 已通过 MCP 接入` 正常，但 web 发任务时 EventStream 看不到 `tool_call/tool_result`，后端也无 `[mcpClient]▶`。排查：强制 `tool_choice` 会报 `400 Thinking mode does not support this tool_choice`（**DeepSeek thinking 模式与强制 tool_choice 冲突**），不能用 bindTools 硬绑。已加两层兜底：① 研究员 prompt 强制"必须先用 search_knowledge 查资料，不能凭记忆回答"；② `graph.js` 的 `runWorkerWithTools` 在 researcher 首轮若模型没主动调工具，自动代调一次 search_knowledge 并把结果回灌对话。当前状态：**协议层（probe）/启动接入均 ✅，web 触发链路待用户在浏览器实跑确认**。已为排查在 graph.js / mcpClient.js / mcp-server/index.mjs / tools.js 加了带 `[worker]`/`[mcpClient]`/`[mcp-server]`/`[tools]` 前缀的调试日志（保留，便于后续分析）。
- 2026-09-15：**Ex6 MCP web 端到端验证通过**。干净启动 `node server.js` + `node probe-chat.mjs` 发年假问题，researcher 节点真实穿透 MCP 子进程触发 3 次 `search_knowledge`（年假天数/司龄增假/远程办公天数均取自知识库），最终答案引用《员工手册与产品 FAQ（样例知识库）》。**根因修复**：早期 `makeWorkerNode` 误写成 `async` 工厂，`buildGraph` 拿到 Promise 后 `addNode` 注册成 Promise 而非节点函数，worker 被 LangGraph 静默跳过（web 永远看不到 tool_call）——对照 Ex5 的同步工厂改回后链路跑通。补缺 6 状态由 ⚠️ 待验证 改为 ✅ 已验证；四类调试日志（`[worker]`/`[mcpClient]`/`[mcp-server]`/`[tools]`）保留。`probe-chat.mjs` 作为 web E2E 探针保留，`scratch-test.mjs`/`test-worker-path.mjs`/`server-run.log` 等临时排查文件已清理。

---

## 三、环境配置要点（全局通用）

### DeepSeek 接入（每个 example 的 server/.env）
```
LLM_API_KEY=sk-xxxx                      # 你的 key（不入库）
LLM_BASE_URL=https://api.deepseek.com    # 末尾【无】/v1
LLM_MODEL=deepseek-v4-flash              # 不支持 tool_calling 时改 deepseek-v4-pro
```
- 端点：`https://api.deepseek.com/chat/completions`（无 /v1）
- 已加 V4 思维链：`thinking: {type:"enabled"}`、`reasoning_effort:"high"`

### 端口约定
- example1 后端 3001 / 前端 5173
- example2 后端 3002 / 前端 5173
- example3 后端 3003 / 前端 5173
- example4 后端 3004 / 前端 5174
- example5 后端 3005 / 前端 5175
- example6 后端 3006 / 前端 5175（前端 proxy `/api`、`/health` 已指向 3006）
- 前端均用 Vite proxy 把 `/api` 转发到对应后端，免跨域

### ⚠️ 环境变量命名差异（各 example 不一致，别互相复制）
| | example1~3 | example4 | example5 |
|---|---|---|---|
| 变量前缀 | `LLM_API_KEY` / `LLM_BASE_URL` / `LLM_MODEL` | `OPENAI_API_KEY` / `OPENAI_BASE_URL` / `OPENAI_MODEL` | `DEEPSEEK_API_KEY` / `DEEPSEEK_MODEL` |
| BASE_URL | `https://api.deepseek.com`（**无** /v1） | `https://api.deepseek.com/v1`（**带** /v1） | 不需要（`@langchain/deepseek` 内置） |
| 读 .env | 手写 `loadEnv()`（保持零依赖） | `dotenv` 依赖 | `dotenv` 依赖 |
| 运行方式 | CommonJS | CommonJS | **ESM**（`"type":"module"`） |

DeepSeek 对带/不带 `/v1` 两种写法均兼容，但各 example 的拼接方式不同，按上表填才不会 404。
Ex5 用官方 `@langchain/deepseek` 集成包（`ChatDeepSeek`），无需自己拼 baseURL。
Ex5 是 **ESM**，与 Ex1~4 的 CommonJS 不同——写 `require()` 会报错，必须用 `import`。

### 通用运行模式
```powershell
cd exampleN/server && node server.js     # 后端
cd exampleN/web && npm install && npm run dev   # 前端
cd exampleN/server && node test.js       # 后端链路自测（绕过 PowerShell 引号坑）
```

---

## 四、踩坑索引（详细见各日志 / AGENTS.md）

1. baseURL 多写 `/v1` → 404/空流
2. 明文请求发到 https 端口(400) → 用 `https` 模块非 `http`
3. PowerShell curl 续行污染 → 用 `node test.js` 验证
4. 浏览器地址栏打接口无响应 → 接口是 POST，应在页面发消息
5. Tool Calling 需 `stream:false` 解析 tool_calls
6. SSE 为 POST 时不能用 EventSource → 用 fetch+ReadableStream 手动解析
7. 嵌套 git 仓库陷阱 → 提交前删子目录 `.git`
8. **LangGraph checkpointer 的 saver 必须进程级单例** → 在 `buildGraph` 内 `new MemorySaver()` 会丢记忆
9. **框架不自动透传 `signal`** → 节点里要手写 `model.invoke(m, { signal: config.signal })`，
   否则客户端断开后后端继续跑（白烧 token）
10. **`getState().next` 非空 ≠ 有断点** → 运行中同样非空，判断要加 `running` 标志
11. **接入持久化后护栏要按轮计数** → 累加式 reducer 跨轮累积，第二轮开局就"已达上限"（改覆盖式字段归零）
12. **LangChain 的 `BaseMessage` 没有 `.role` 属性**（恒 `undefined`）→ 角色要用 `getType()`；
    `MessagesValue` 会把 `{role:"user"}` **隐式转成** `HumanMessage`，你写进去的和它存的不一样
13. **Vite HMR 会重置 React 自定义 hook 的 state** → 改 `useMultiAgent.js` 后必须 F5，
    否则出现"我发的消息不见了"的假象（曾误判为后端 bug，浪费一轮排查）
14. **DeepSeek 的 `json_object` 模式要求 prompt 里出现 "json" 字样**（小写）→ 否则 400
    `Prompt must contain the word 'json'`。加了 `response_format` 却忘了这点会**全线报错**
15. **DeepSeek 的 thinking 模式与强制 `tool_choice` 冲突** → `withStructuredOutput()` 直接 400，
    真结构化输出在该模型上不可用，只能退而用 `response_format`（且它**不保证符合 zod schema**，
    字段规范仍要写在 prompt 里）

---

## 五、在另一台电脑接续

### 通用步骤
1. 拉仓库（`.env`、`node_modules`、`drafts/` 已被忽略，不入库）
2. 各 example 的 `server/` 复制 `.env.example` 为 `.env` 填 key
3. `cd exampleN/web && npm install` → `npm run dev` → 浏览器验证
4. 换模型/平台只改 `.env` 三值，server.js 通用（OpenAI 兼容协议）

### ⚠️ Ex5 特别注意（和其他 example 都不一样）

**① `npm start` 不是起服务！** Ex5 的 `start` = CLI（`index.js`，跑完退出、不监听端口）。
起 HTTP 服务要 `npm run serve`（`server.js`，端口 3005）。前端在 `example5/web`，`npm run dev` → 5175。
**两个必须同时开着。**

**② 环境变量是 `DEEPSEEK_*`**，与 Ex3(`LLM_*`)、Ex4(`OPENAI_*`) 都不同，别互相复制。

**③ 进门先读速查**：[logs/langgraph-cheatsheet.md](logs/langgraph-cheatsheet.md)
（Ex5 代码里 80% 是 plumbing，直接读 server.js 会很吃力）。

### 🎯 回家第一件事：验收 P0·2 的 3 个修复

```powershell
cd example5\server
npm install                      # 若 node_modules 没带过来

# 1) 先跑纯净探针，把概念过一遍（不调模型、秒级、免费）
node probe-checkpoint.mjs

# 2) 起后端（★必须重启，server.js 改过，node 没有热更新）
npm run serve

# 3) 另开终端起前端
cd ..\web
npm install
npm run dev

# 4) 浏览器开 http://localhost:5175
```

⚠️ **重启后端会清空所有会话**（MemorySaver 是进程内内存）——这是预期行为，不是 bug。

**验收清单**（3 个 bug 的修复效果）：

| # | 操作 | 期望 |
|---|---|---|
| 1 | 发任务 → 等它跑起来 → 点 ⏹ 停止 | 「⏵ 续跑断点」**稳定显示**，不再闪现后消失 |
| 2 | 点「⏵ 续跑断点」 | 从中断处继续跑（时间线出现"续跑（从 xxx 继续）"），不是重跑 |
| 3 | **F5 刷新** | **你发的消息 + AI 的回答都要在**（修的就是"用户消息丢失"） |
| 4 | 点 ✨ 新会话 → 再发一轮 → F5 | 两条用户消息都该显示 |

验完回来更新本文件进度表，把 P0·2 标成 `✅ 已验证并验收`，然后进 P0·3（`createReactAgent`）。

---

## 六、剩余技术债（Ex3/Ex4 遗留 TODO）

即使不做 Example 5，以下代码里明确留了口子，按性价比排序：

### 还债（工作量小、直接提升效果）
1. ~~**Ex3 升级 embedding 语义检索**~~ — ✅ **已还（2026-09-08）**。
   `rag.js` 支持 `RAG_MODE=keyword|semantic|hybrid`，本地 `bge-small-zh`（512 维），默认 keyword 行为不变。
   实测：semantic 5/5 > keyword 4/5 = hybrid 4/5（详见 example3/README「检索模式」）。
   遗留：向量未持久化（重启重算）、首次加载模型 20~30s
2. **把 Ex4 的章节标题锚点修复回移到 Ex3** — Ex4 的 `chunkText` 已修（正文块附加最近章节标题），Ex3 仍是旧版，
   存在"检索到标题却拿不到正文"的同类问题
3. **统一环境变量命名** — Ex3 的 `LLM_*` 与 Ex4 的 `OPENAI_*` 不一致，容易复制错（已在上文列表标注）

### 增强（属于 Ex4 的功能扩展）
4. Ex4 **并行 Fan-out**：多个无依赖子任务同时派发（当前仅顺序 Pipeline）
5. Ex4 **web_search**：研究员只查本地库，未接外网
6. Ex4 **删除单篇文档** / **会话持久化**：当前只能全清，且刷新页面结果丢失
   （**会话持久化已在 Ex5 P0·2 用 LangGraph MemorySaver 实现**，可作为 Ex4 的回填参考）

### 生产化（Ex1~4 均未覆盖，是"demo 能跑"到"生产能用"的差距）
7. **成本控制**：token 计费统计、缓存、流式体验优化
8. **可靠性**：错误处理、重试、降级、模型输出解析容错（如 JSON 不合法的兜底，Ex4 已做了一部分）
9. **可观测**：日志、链路追踪、效果评估（eval）

> 结论：若目标是"学懂 Agent 原理"，Ex1~4 已构成完整闭环，可结业；
> 若目标是"具备落地能力"，建议至少补第 1、2 项，再按需看 7~9。
