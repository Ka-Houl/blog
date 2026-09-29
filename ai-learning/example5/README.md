# Example 5 · 用 LangGraph.js 重写多 Agent

用**官方框架**把 Example 4 手搓的多 Agent 编排重写一遍。同样的任务、同样的 Agent 角色、同样的 RAG 检索，
唯一变量是**编排层从手写循环换成 LangGraph 的 StateGraph**。

> 这个 Example 的价值不在"能用"，而在**看清手搓与框架的边界**：
> 哪些是框架替你挡掉的坑，哪些是它替你做的抽象，哪些仍然得你自己操心。

> ## 📌 看代码前，先读这份速查
>
> **[logs/langgraph-cheatsheet.md → 一页纸速查](../logs/langgraph-cheatsheet.md)**
>
> 本 example 的代码里 **80% 是 plumbing**（会话注册表、HTTP 契约、前端状态同步……），
> 只有 **20% 是 LangGraph 本身**。直接读 `server.js` 会很吃力，而且容易被管道带偏。
> 速查里只写那 6 条真正要掌握的框架概念，看完再回来看代码会轻松很多。

## 为什么是 LangGraph 而不是 LangChain

| | 定位 | 能否表达循环 |
|---|---|---|
| LangChain（chain） | 组件库 + 线性编排 | ❌ 有向无环图（DAG） |
| **LangGraph** | 底层编排运行时 | ✅ 支持循环边 |

多 Agent 必须有"写手→审校→写手改→再审"这种**回环**，chain 表达不了。
LangGraph 的 `StateGraph` 天生支持，这也是 LangChain 官方现在推荐用 LangGraph 构建 Agent 的原因。

## 目录结构

```
example5/
├── server/
│   ├── graph.js        # ★ 核心：State + 节点 + 条件边 + 循环边（可注入 checkpointer）
│   ├── session.js      # P0·2：MemorySaver 单例 + 会话元数据注册表 + 并发护栏
│   ├── server.js       # HTTP 后端（3005）：graph.stream() → SSE + 会话管理 API
│   ├── tools.js        # LangChain tool() 定义的 search_knowledge / draft_doc
│   ├── rag.js          # 复用 Ex4 的检索（ESM 版），逻辑未变
│   ├── index.js        # CLI 入口：灌知识库 → 建图 → 跑任务
│   ├── probe.mjs       # API 探针：StateSchema/条件边/model/bindTools
│   ├── probe-checkpoint.mjs  # P0·2 探针：检查点/多轮/断点续跑（不调模型，秒级）
│   ├── probe-role.mjs   # 消息格式探针：实测 BaseMessage 没有 .role（角色要 getType()）
│   ├── probe-structured.mjs  # 结构化输出探针：4 种方式对比 + 真实 prompt 回归验证
│   ├── graph-react.js   # P0·3 对照版：worker 改用 createReactAgent（拓扑复用 graph.js）
│   ├── probe-react-agent.mjs  # P0·3 探针：预置 ReAct 的 API / 内置图 / 护栏 / 流式
│   ├── probe-hitl.mjs    # 补缺 4 探针：interrupt / Command / 跨图实例恢复 / interruptBefore
│   ├── test-hitl.mjs     # 补缺 4 集成测试：写手产出后中断 → 提交「通过」→ 跑出最终答案（约 1~2 分钟）
│   ├── probe-langsmith.mjs   # 补缺 5 探针：LangSmith 配置检查 + 模拟 tracing（不联网）
│   ├── test-session.mjs      # P0·2 端到端自测：自动拉起后端跑 8 项断言
│   ├── package.json    # ESM（"type":"module"）
│   └── .env / .env.example
├── web/                # Vite 前端（5175），含会话管理栏
├── sample-kb.md        # 示例知识库（复制自 Ex3）
└── README.md
```

## 运行

```bash
cd example5/server
npm install
cp .env.example .env     # 填入 DEEPSEEK_API_KEY
node index.js                      # 默认任务（CLI，无检查点）
node index.js "你的自定义任务"       # 自定义
node probe.mjs                     # 只验证 API，不跑完整流程（快）
node probe-checkpoint.mjs          # 验证检查点 API（不调模型，秒级）

cd example5/server
node server.js                     # 启动 SSE 后端（3005）
node test-session.mjs              # 端到端自测：多轮记忆 + 断点续跑（约 3~5 分钟）

cd example5/web
npm install && npm run dev         # 前端 http://localhost:5175
```

默认任务：*"调研一下我们公司的请假制度，写一段 100 字的新人提醒，再检查一下有没有事实错误"*

实测输出链路（委派 6 次，约 160s）：

```
🧭 主管→researcher → 🔧检索×3 → ✅
🧭 主管→writer     → 🔧draft_doc → ✅
🧭 主管→reviewer   → 🔧检索×3 → ✅（发现无法核验文件本身）
🧭 主管→writer     → 🔧修订 → ✅          ← 循环边：反思迭代
🧭 主管→reviewer   → ✅ 通过
🧭 主管→summarizer → 最终答案
```

## 核心：手搓 vs LangGraph 逐行对照

| Ex4 手搓 `supervisorLoop` | Ex5 LangGraph |
|---|---|
| `let context = "用户总目标：" + ...` | `StateSchema`（messages/next/task/steps/final） |
| `for (i = 0; i < MAX_DELEGATES; i++)` | `supervisor` 节点 + 条件边回环 |
| `JSON.parse(extractJson(decision))` | `addConditionalEdges("supervisor", route, {...})` |
| `if (target === "summary") { ... }` | 路由到 `summarizer` 节点 → `END` |
| `MAX_DELEGATES = 6` | 手写护栏 **+** `recursionLimit`（框架原生） |
| 手写 `context += output` 回灌 | `MessagesValue` reducer 自动追加 |
| 手写 `if/else` 分发工具 | `tool()` 抽象 + `TOOL_MAP` + `.invoke()` |
| （无） | `MemorySaver`：会话持久化/断点恢复 |
| （无） | `stream()`：逐步流式输出 |

### 图的结构（graph.js 核心）

```js
new StateGraph(MultiAgentState)
  .addNode("supervisor", ...).addNode("researcher", ...)
  .addNode("writer", ...).addNode("reviewer", ...).addNode("summarizer", ...)
  .addEdge(START, "supervisor")
  // 条件边：主管决定去哪个 worker
  .addConditionalEdges("supervisor", route, {
    researcher: "researcher", writer: "writer",
    reviewer: "reviewer", summarizer: "summarizer",
  })
  // ★ 循环边：worker 完成后回到主管 —— 反思迭代就靠它
  .addEdge("researcher", "supervisor")
  .addEdge("writer", "supervisor")
  .addEdge("reviewer", "supervisor")
  .addEdge("summarizer", END)
  .compile({ recursionLimit: 30 });
```

### State 自定义字段写法（1.x 新 API）

```js
const State = new StateSchema({
  messages: MessagesValue,                              // 预置：消息累积
  next:  new ReducedValue(z.string().default(""), { reducer: (_c, n) => n }),      // 覆盖式
  steps: new ReducedValue(z.number().default(0),  { reducer: (c, n) => c + n }),   // 累加式
});
```

> ⚠️ 注意：LangGraph.js **1.x 的 API 与早期 0.x 不同**——
> 旧写法是 `MessagesAnnotation`，新写法是 `StateSchema` + `MessagesValue` + `ReducedValue`。
> 网上大量教程还是旧版，照抄会报错。

## P0·2 · 检查点（Checkpointer）：会话持久化 / 断点恢复

> 一行 `compile({ checkpointer })` 换来的三种能力。这是"框架替你做的事"里含金量最高的一项。

### 怎么用

```js
// session.js —— ★ 必须是进程级单例
export const checkpointer = new MemorySaver();

// graph.js —— 一行接入
.compile({ recursionLimit: 30, checkpointer });

// server.js —— 用 thread_id 区分会话，State 自动读写
const stream = await graph.stream(
  { messages: [{ role: "user", content: "用户总目标：" + message }] },   // 新消息
  { configurable: { thread_id: threadId }, streamMode: "updates", signal }
);

const stream2 = await graph.stream(null, { configurable: { thread_id } }); // null 输入 = 从断点续跑
```

### 三种能力

| 能力 | 做法 | 价值 |
|---|---|---|
| **会话记忆** | 同 `thread_id` 多次运行，State 自动累积 | 多轮对话不用自己维护 messages 数组 |
| **断点恢复** | 运行被中断后再跑同一 `thread_id`，传 `null` 输入 | 长任务中断不用从头再来 |
| **时间旅行** | `getStateHistory()` 回放任意检查点 | debug 神器（探针已验证 8 个检查点） |

还有两个顺手能用的：`getState()` 查当前快照、`updateState()` 人工改状态（HITL 审批改写的基础）、
`checkpointer.deleteThread(id)` 删会话。

### HTTP 契约（P0·2 新增）

| 方法 | 路径 | 说明 |
|---|---|---|
| POST | `/api/chat` | body `{ message, threadId?, resume? }` → SSE。不传 threadId 则后端签发；`resume:true` 且存在断点时续跑 |
| GET | `/api/sessions` | 会话列表（含 turns / interrupted / running） |
| GET | `/api/session/:id` | 会话快照：messages / final / steps / interrupted / running |
| DELETE | `/api/session/:id` | 删除会话（清检查点 + 元数据） |
| GET | `/health` | 额外返回 `checkpointer` 类型与 `sessions` 数量 |

SSE 事件在 P0·1 基础上新增：`start`（带 `threadId`/`turns`/`resumed`）、`interrupted`（客户端断开）、
以及 HITL 相关：`hitl_wait`（节点内等待人工）、`hitl`（流结束卡在审批节点，推 `{question, draft}` 让前端弹框）、`hitl_done`（提交后）。

### 三个必须知道的坑

1. **saver 必须单例**：在 `buildGraph` 内部 `new MemorySaver()` 等于每次请求换一个空本子，跨请求记忆直接失效
2. **`signal` 要自己透传给模型**：框架只把 signal 放进取节点入参 `config`，不会自动塞进 `model.invoke()`。
   不透传 = 客户端断开后后端还在继续烧 token（实测：断开了仍跑完整轮）。修法见 `graph.js` 里
   `model.invoke(messages, { signal: config.signal })`
3. **`next` 非空 ≠ 有断点**：运行中 `next` 也非空（那是"正在执行"）。
   必须配合 `running` 标志判断，否则会把"正在跑"误判成"可续跑"

> **护栏要按轮计数**：接入检查点后 `steps` 会跨轮累积，若护栏继续看累积值，
> 第 2 轮一开始就已经"用完 6 次"被强制汇总了。所以拆成
> `steps`（累加，统计用）+ `turnSteps`（覆盖，护栏用，汇总节点归零）。

## P0·3 · `createReactAgent` 对照（框架预置 ReAct）

用框架预置的 ReAct agent 替换手写的 worker 工具循环（约 60 行）。
单独放在 `graph-react.js`，**拓扑 / 主管 / 汇总 / 检查点全部复用 `graph.js`**——只换 worker，便于对照。

### 框架内置了什么

```
节点: __start__, agent, tools, __end__
边:   __start__→agent, tools→agent, agent→tools, agent→__end__
                       ↑ 这条回边就是 ReAct 循环
```

和我们手写版 `runWorkerWithTools` 里的 `for (round < MAX_ROUNDS)` 是**同一个东西**——
只是框架把它画成了图里的一条**循环边**。

### 探针实测（`probe-react-agent.mjs`）

| 项 | 结果 |
|---|---|
| 创建 | `createReactAgent({ llm, tools, prompt })` ✅（1.x 用 `prompt`，旧版叫 `stateModifier`） |
| 内置图 | 自带 `agent ↔ tools` 循环边 ✅ |
| 真实任务 | 工具调用生效 ✅ |
| 护栏 | `recursionLimit` 触发 `GraphRecursionError` ✅ |
| 流式 | `.stream()` 可用 ✅ 可直接接 SSE |

### ★ 用了框架的代价（这才是重点）

| | 手写版 | 预置 agent |
|---|---|---|
| 工具次数熔断 | `MAX_TOOL_CALLS=3` **精确**熔断 | ❌ **没有**。`recursionLimit` 数的是【节点步数】，一轮 `agent+tools` 算 2 步 |
| 可观测性 | 工具调用走我们的节点，SSE 直接可见 | ❌ 发生在**子图内部**，外层 `onEvent` 看不到 → 前端时间线会空白 |
| 代码量 | 约 60 行循环 + 分发 + 回灌 | ✅ 框架全包 |

探针实测：同样任务，预置版跑了 **4 次**工具调用 > 手写版限制的 3 次。
**直接替换 = 丢掉成本控制。**

### 我们的处理

1. **护栏**：按"一轮 = 2 步"把 `MAX_TOOL_CALLS` 换算成 `recursionLimit`（`MAX_TOOL_CALLS*2+2`）。
   ⚠️ 只是**近似**，框架没提供"调用次数"级别的护栏。
2. **可观测性**：worker 内部改用 `agent.stream()` 流式跑子图，再把 `tool_call` / `tool_result`
   转发成我们的 SSE 事件（见 `graph-react.js` 的 `runReactWorker`）。
   ——又一次印证：**框架给了能力，但要自己接上**。
3. **context 隔离**：仍是自己做——只把"任务 + 背景"喂给子图，跑完只把结论写回外层 State。

### 跑一下对比

```bash
node graph-react.js "年假有多少天？"   # 对照版（预置 ReAct）
node index.js "年假有多少天？"         # 原版（手写循环）
node probe-react-agent.mjs             # 探针：验证 API + 内置图结构
```

对照版实测输出（17.1s，委派 2 次）：
```
🧭 主管→researcher
   🔧 search_knowledge ×3        ← 子图内部事件已被转发出来
✅ 研究员 完成（预置 ReAct：工具调用 3 次，上限约 3）
🧭 主管→summary
```

## 补缺 4 · HITL 人工审批（`interrupt`）

用 LangGraph 的 `interrupt()` 在「写手产出后」插入一个**人工确认节点**：草稿先给人看，人通过（或写修改意见）后，流程才继续。对应真实场景——AI 生成对外内容前需要人把关。

### 关键决策：默认关闭（`HITL=1` 才开）

启用后流程会在写手后停下等人，**会改变已验收通过的行为**（也影响 `test-session.mjs` / CLI）。所以做成开关：

```bash
HITL=1 npm run serve   # 开启人工审批；不设这个变量则与升级前完全一致
```

`graph.js` 里 `if (isHITL())` 才插入 `human_review` 节点（writer → human_review → supervisor）。

### 探针实测（`probe-hitl.mjs`，全过）

| 项 | 结果 |
|---|---|
| 调用 `interrupt(payload)` 即中断，本节点后续代码**第一次不执行** | ✅ |
| 能读到 `interrupts` 负载（`question` + `draft`） | ✅ 前端据此渲染确认框 |
| `new Command({ resume: 用户输入 })` 恢复，`interrupt()` 返回值 = 输入 | ✅ |
| **跨图实例恢复** | ✅ 靠 checkpointer（换 SqliteSaver 可跨重启） |
| `interruptBefore`（静态中断）可用 `null` 续跑 | ✅ |

### 落地要点（又一次"框架给能力，自己接上"）

1. **恢复输入用 `Command` 而非 `null`**：续跑断点是 `null`，但人工审批回复是 `new Command({ resume })`（server.js 里 `isHumanReply` 分支）。
2. **刷新后确认框还在**：`/api/session/:id` 返回 `interrupts` 负载，前端 `restoreFromState` 时一并恢复 `pendingHitl`。
3. **停在中斷点不要发 `final`**：server.js 检测到 `interrupts.length` 就推 `hitl` 事件并 `return`，人确认后才继续跑出最终答案。
4. **人的意见写回共享白板**：`[人工审批] xxx`，主管下一轮能据此决策（context 隔离仍是自己做）。

### 跑一下

```bash
HITL=1 node test-hitl.mjs      # 集成测试：中断 → 提交「通过」→ 跑出最终答案
HITL=1 npm run serve           # 前端开 http://localhost:5175，发任务后会弹🙋确认框
```

实测（test-hitl.mjs）：`next:["human_review"]` → 取出 134 字草稿 → 提交「通过」后 `next:[]`，最终答案正常产出，前端先后收到 `hitl_wait / hitl_done / final` 三类事件。

## 补缺 5 · LangSmith 可观测性（P2）

> 关键词：**让"运行过程"可见**。debug 不再靠 `console.log` 和一堆探针——直接在 Web 控制台看每个节点 / LLM 调用 / 工具调用的耗时、token、输入输出。

### 为什么"几乎零侵入"

LangChain/LangGraph 的 trace 是**自动埋点**：`@langchain/core` 内置 callback，只要设了环境变量，每次 `LLM.invoke` / `bindTools` / `graph` 节点执行都会自动上报到 LangSmith。**业务代码一行都不用改**。

### 怎么开（`.env` 已为你配好真实 key）

```bash
LANGCHAIN_TRACING_V2=true
LANGCHAIN_API_KEY=lsv2_xxx          # 已在 .env 填入
LANGCHAIN_PROJECT=ai-agent-ex5

npm run serve   # 启动日志会打印 [langsmith] tracing: enabled
```

然后去 https://smith.langchain.com 控制台看 trace。

### 我们额外加的"状态可见"

埋点零侵入，但**有没有真的开成功**肉眼看不出。所以在 `server.js` 加了 `tracingStatus()`：
- 启动日志打印 `[langsmith] tracing: enabled/disabled`（disabled 时给原因）
- `/health` 返回 `tracing` 字段（探针/前端可自查）

### 探针（`probe-langsmith.mjs`，不联网、不需要真 key）

验证环境变量配置逻辑 + 模拟一次 tracing 下的调用，确认埋点生效。跑：`node probe-langsmith.mjs`。

### 认知沉淀

1. **可观测性 ≠ 日志**。日志是你主动 `console.log` 的点；trace 是框架**自动**把每一步结构化记录。前者会漏，后者不会。
2. **LangSmith 只能看到 LangChain 原生调用**（`LLM.invoke` / `graph` 节点）；我们自定义的 `onEvent` SSE 事件（给前端时间线用的）**不会**进 LangSmith——两套是分开的观测面。
3. 这是 **P1（prompt 调优）的必备配套**：没有 trace 看不清"哪一步吃掉最多 token / 哪次模型答非所问"，调优就是盲调。

## 关键知识点

- **循环边是 LangGraph 的核心价值**：worker→supervisor 的回边天然表达"反思迭代"，chain 做不到
- **检查点是"图之外的存储"**：换 `SqliteSaver` / `RedisSaver` 就能跨重启持久化，业务代码零改动
- **State 即共享白板**：各 Agent 产出追加到 `messages`，靠 reducer 自动合并，省去手写字符串拼接
- **reducer 决定字段语义**：覆盖式 `( _c, n) => n` vs 累加式 `(c, n) => c + n`，一个函数区分两种行为
- **护栏双保险**：业务护栏（MAX_DELEGATES）+ 框架护栏（recursionLimit）
- **context 隔离仍需自己做**：框架不会自动隔离——每个 worker 节点内部仍要自己构造独立 messages，
  只把结果写回共享 State。这是**框架没帮你做的事**
- **工具熔断仍需自己做**：`MAX_TOOL_CALLS` 逻辑与 Ex4 一致，框架没自动限制模型调用工具的次数
- **SSE 事件不是给模型看的**：`node_update` 是框架原生（`streamMode:"updates"`），
  `tool_call` / `supervisor_decision` / `agent_start` 等是我在节点里自己埋的 `onEvent` 回调。
  把事件全删掉，图照样跑，只是前端一片黑——**事件是可观测性层，不是协议层**
- **Agent 不是模型**：全程只有一个 `model` 实例，靠「不同 system prompt + 不同工具集 +
  图里的不同节点」扮演研究员/写手/审校；每个 worker 内部新造独立 `messages` 数组 = context 隔离
- **"框架给了能力但不替你接线"是本项目最高频的一类坑**：
  ①`signal` 要手动透传给 `model.invoke()`，否则客户端断开后端还在烧 token；
  ②`MessagesValue` 会把 `{role:"user"}` 隐式转成 `HumanMessage`，而它**没有 `.role` 属性**
  （恒 `undefined`，角色要用 `getType()`）——详见 `logs/example5.md` §8.2 坑 2 / 坑 4

> 事件架构的完整拆解（三类来源 / Agent 是怎么造出来的 / 一条 tool_call 的链路 / 换模型是否通用）
> 见 **[logs/example5.md §9](../../logs/example5.md)**。

### 结构化输出（主管决策场景实测）

主管节点需要模型输出 `{"delegate_to":"...","task":"..."}`。以前靠手写 `extractJson()` 从返回文本里
"抠括号"兜底——**治标**。改造前先用 `probe-structured.mjs` 实测了 4 条路（每路跑 3 次）：

| 方式 | 合法率 | 真相 |
|---|---|---|
| `withStructuredOutput()`（functionCalling） | 0/3 | ❌ **DeepSeek 的 thinking 模式与强制 `tool_choice` 冲突**（400）。真结构化输出在这模型上走不通 |
| `response_format: json_object`，但 prompt **没写字段规范** | 0/3 | ⚠️ 返回的是合法 JSON，但**模型自己发明字段名**（`decision`/`assigned_to`/`step`…） |
| 裸 prompt 写清字段规范（改造前现状） | 3/3 | ✅ |
| **字段规范 prompt + `response_format`**（采纳） | 3/3 | ✅ |

**三条认知纠正**（比改动本身重要）：

1. **`json_object` ≠ schema 约束**。它只保证"输出是合法 JSON"，**不保证符合你的 zod schema**——
   字段规范仍必须写在 prompt 里。这是最容易误解的一点。
2. **"框架的结构化输出"取决于模型能力**。DeepSeek 的 thinking 模式直接把它挡死，不是代码问题。
3. **收益不在合法率**（现状本来就 3/3），而在**消除"模型在 JSON 前后加废话"这个失败模式**——
   也就是当初逼我们写 `extractJson` 去抠括号的根因。

**落地改动**（`graph.js`）：主管 prompt 补小写 `json` 字样（DeepSeek 硬性要求，否则 400：
`Prompt must contain the word 'json'`）+ `model.invoke` 加 `response_format`。
`extractJson` 降级为安全网。探针自带 E 组回归验证（用**真实** `SUPERVISOR_PROMPT` 跑，3/3 才安全）。

## 框架帮你做了什么 / 没帮你做什么

**✅ 框架替你做的**
- 图的拓扑与流转（条件边、循环边、终止条件）
- 状态合并（reducer 自动处理并发/追加）
- 递归深度保护（recursionLimit）
- 工具抽象（`tool()` 自带参数校验与 `.invoke()`）
- 持久化与流式（MemorySaver / stream，本项目暂未接入）

**❌ 仍需你自己操心**
- Prompt 质量（主管决策的 JSON 仍可能不干净，需要 `extractJson` 兜底）
- Context 隔离（框架不会自动隔离各 Agent 的对话历史）
- 成本控制（工具调用次数、委派轮次的熔断逻辑仍要手写）
- 模型输出的解析容错（汇总阶段仍可能返回 JSON，需要 `extractFinalAnswer`）

> **结论**：框架解决的是**编排的结构性问题**（拓扑、状态、流转、持久化），
> 不解决**模型行为的不确定性**（乱输出格式、无限调工具、幻觉）。后者永远要你兜底。

## 环境说明

- **语言**：TypeScript/JavaScript（`@langchain/langgraph`），无需学 Python
  ——API 与 Python 版几乎一致，概念 1:1 可迁移
- **模型**：`@langchain/deepseek` 官方集成包（`ChatDeepSeek`）
- **ESM**：本项目用 `"type": "module"`，与 LangGraph 官方示例一致
- **依赖**：`@langchain/langgraph` / `@langchain/core` / `@langchain/deepseek` / `dotenv` / `zod`

环境变量（`server/.env`）：

```
DEEPSEEK_API_KEY=sk-xxxx
DEEPSEEK_MODEL=deepseek-v4-flash
```

> ⚠️ Ex5 用 `DEEPSEEK_*` 变量名，与 Ex3(`LLM_*`)、Ex4(`OPENAI_*`) 又不一样，别互相复制。

## 已知限制 / TODO

- ~~**无前端**：CLI 版 → ✅ 已接 SSE 前端（example5/web，端口 5175，代理 /api→3005）~~
- ~~**未用 streaming**：`graph.stream()` 已接入，`start/node_update/supervisor_decision/.../final/done` 事件流推送~~
- ~~**未用 MemorySaver**：✅ P0·2 已接入（会话记忆 / 断点恢复 / 时间旅行），见上文专章~~
- **MemorySaver 重启即丢**：进程内内存。要跨重启持久化需换 `SqliteSaver`（业务代码零改动，TODO）
- **上下文会随轮次无限增长**：每轮 worker 都会拿到完整历史。生产要加裁剪/摘要策略（P1 范畴）
- ~~**未用 createReactAgent**~~ → ✅ P0·3 已完成：`graph-react.js` 用预置 ReAct 重写 worker 做对照（详见上文 P0·3 专章）。结论：**暂不替换**手写版——预置 agent 无调用次数熔断，且子图工具事件要自己转发
- ~~**未接 HITL 人工审批**~~ → ✅ 补缺 4 已完成：`HITL=1` 开启，在写手产出后插 `human_review` 节点（详见上文专章）。默认关闭，不破坏已验收流程

## 下一步

- ~~接 `MemorySaver` 实现会话持久化~~ → ✅ 已完成（P0·2）
- ~~**对比 `createReactAgent`**（框架预置 ReAct）与手写工具循环的差异~~ → ✅ 已完成（P0·3），结论见上文专章
- 把 `MemorySaver` 换成 `SqliteSaver`，验证"换存储不改业务代码"（顺带解决重启丢会话）
- 详见文末 **学习计划（P0~P4）**

---

## 学习计划（P0~P4）—— 给自己回家续学的路线图

> 学到位三标准（群友口径）：①能独立用 Agent 解决问题 ②练熟至少一种框架 ③prompt/context 调优有概念会 debug。
> 当前进度：①✅（Ex1~5 都能独立跑）②进行中（LangGraph 刚上手）③待系统练。

### P0 · Ex5 框架深挖（优先级最高，把"框架熟练度"补齐）

| 步骤 | 内容 | 状态 | 落地动作 |
|---|---|---|---|
| P0·1 | `graph.stream()` 流式 + 前端可视化 | ✅ 完成 | 已做：server.js SSE + web/ 前端，端口 5175 |
| P0·2 | `MemorySaver` 会话持久化 / 断点恢复 | ✅ 完成 | 已做：`session.js`(单例 saver) + `graph.js` 注入检查点 + 会话 API + 前端会话栏；端到端 8 项断言全过（`node test-session.mjs`） |
| P0·3 | `createReactAgent` 对照 | ✅ 完成 | `graph-react.js` + `probe-react-agent.mjs`：预置 agent 无调用次数熔断、子图工具事件需转发 → 暂不替换手写版 |

### P1 · Prompt / Context 调优（对应标准③）

- 主管决策的 JSON 脏输出：实测靠 `extractJson` 兜底，但仍要会写 prompt 让模型稳定出 JSON（few-shot / 约束语）
- context 隔离：框架不自动隔离各 Agent 历史，需理解"共享白板 vs 独立 messages"的取舍
- 成本：工具熔断 / 委派轮次对 token 消耗的影响，学会看一次跑完花了多少

### P2 · 可观测性 LangSmith ✅ 已完成（补缺 5）

- 图已接入 LangSmith trace：设 `LANGCHAIN_TRACING_V2` + `LANGCHAIN_API_KEY` 即自动上报每个节点/工具/LLM 调用的耗时与输入输出
- 价值落地：debug 不再靠 `console.log`，标准③"会 debug"有了正式工具；也是 P1（prompt 调优）的必备配套
- 额外加了 `tracingStatus()`：启动日志 + `/health` 可自查是否开启（详见上文「补缺 5」专章）

### P3 · 技术债清理（低优先级但别烂尾）

- 环境变量三套命名（Ex3 `LLM_*` / Ex4 `OPENAI_*` / Ex5 `DEEPSEEK_*`）统一约定
- ESM（Ex5）vs CJS（Ex1~4）混用，写清每个 example 怎么跑
- 把各 example 的 README 关键差异补齐

### P4 · 生产化意识（了解即可）

- 并发（多个用户同时跑图）、错误重试、超时、成本控制
- 这只是"知道有这些事"，不急着实现

### 在家电脑接续步骤

```bash
# 0) 先读速查（重要：Ex5 里 80% 是 plumbing，直接读代码会很吃力）
#    logs/langgraph-cheatsheet.md

# 1) 拉最新代码
git pull origin master        # 或重新 clone

# 2) 复制 .env（Ex5 用 DEEPSEEK_*，与 Ex3/Ex4 不同）
cd example5/server
cp .env.example .env           # 填入 DEEPSEEK_API_KEY / DEEPSEEK_MODEL
#   注意：Ex5 是 DEEPSEEK_*，别把 Ex3/Ex4 的 .env 直接抄来

# 3) 先跑纯净探针，把检查点概念过一遍（不调模型、秒级、免费）
node probe-checkpoint.mjs

# 4) 后端 —— ⚠️ 注意不是 npm start！
npm install
npm start                      # = node index.js，是【CLI】，跑完退出、不监听端口
npm run serve                  # ★ 起 HTTP+SSE 后端（端口 3005），保持运行

# 5) 前端（另开一个终端）
cd example5/web
npm install
npm run dev                    # http://localhost:5175
```

> 两个服务必须**同时**开着：`npm run serve`（3005）+ `npm run dev`（5175）。
> ⚠️ **重启后端会清空所有会话**（MemorySaver 是进程内内存）——预期行为，不是 bug。

#### 🎯 回家第一件事：验收 P0·2 的 3 个 bug 修复

功能代码已完整（`test-session.mjs` 8 项断言全过），但下面 3 个修复**还没人工验收**：

| # | 操作 | 期望 |
|---|---|---|
| 1 | 发任务 → 跑起来 → 点 ⏹ 停止 | 「⏵ 续跑断点」**稳定显示**（不再闪现后消失） |
| 2 | 点「⏵ 续跑断点」 | 从中断处继续，时间线出现「续跑（从 xxx 继续）」 |
| 3 | **F5 刷新** | **你发的消息 + AI 的回答都要在**（修的就是"用户消息丢失"） |
| 4 | ✨ 新会话 → 再发一轮 → F5 | 两条用户消息都该显示 |

> 改 hook 文件（`useMultiAgent.js`）后 Vite HMR 会重置 React state，**记得 F5**，
> 否则会看到"消息不见了"的假象。

#### 续学顺序

P0·2 **验收** → P0·3（`createReactAgent` 对照，比 P0·2 简单，代码量净减少）→ P1/P2。
每次做完一个 P0 步骤，回头更新本表状态 + `LEARNING_LOG.md` 进度。


