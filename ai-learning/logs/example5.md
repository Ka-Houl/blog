# Example 5 学习笔记：用 LangGraph.js 重写多 Agent

> 目标：把 Example 4 手搓的多 Agent 编排，用**官方框架 LangGraph.js** 重写一遍。
> 重点不在"能用"，而在**看清手搓与框架的边界**——框架解决什么、不解决什么。

---

## 1. 为什么要做这个 Example

Ex1~4 全部手搓，原理是通的，但暴露一个问题：**没有用过任何主流框架**。

群里一位同行的判断很准，记在这里作为本阶段的校准标准：

> "学到位"的三条标准：
> 1. 能独立用 Agent 解决一个过去的问题（不限 RAG、skill、MCP）
> 2. **至少练熟一种框架**（LangChain / LlamaIndex 等）
> 3. 对 prompt、context 调优有概念，知道如何 debug

按这个标准，Ex4 结束时第 1 条已达标、第 3 条部分达标、**第 2 条完全空白**。
Ex5 就是来补第 2 条的。

> 反直觉的现实：原理到位 ≠ 找工作达标。生产环境 99% 不会让你从零写 supervisor loop，
> 框架熟练度是招聘方评估的硬指标。

---

## 2. 关键选型：LangGraph 而不是 LangChain

**最初的错误倾向**：我一开始建议"用 LangChain 重写 Ex4"，查证后发现这是错的。

| | 定位 | 能否表达循环 |
|---|---|---|
| LangChain（chain） | 组件库 + 线性编排 | ❌ 有向无环图（DAG） |
| **LangGraph** | 底层编排运行时 | ✅ 支持循环边 |

**决定性理由**：Ex4 的核心流程是"写手→审校→写手改→再审"这种**回环**，
而 LangChain 的 chain 是有向无环图，根本表达不了循环。
LangGraph 的 `StateGraph` 天生支持，这也是 LangChain 官方现在推荐用 LangGraph 构建 Agent 的原因。

两者实际是**配合**关系，不是二选一：
- **LangChain** 提供组件（模型封装、tool 抽象、retriever）
- **LangGraph** 提供编排（StateGraph、循环、状态、持久化）

本项目：`tool()` 用 LangChain 的，`StateGraph` 用 LangGraph 的。

---

## 3. 语言选型：JS 而不是 Python

LangChain 起源于 Python，但**官方同时维护 JS/TS 版本**，且 API 与 Python 版几乎一致。

| | Python 版 | JS/TS 版 |
|---|---|---|
| 成熟度 | 更成熟、集成更多、新特性通常先上 | 稍滞后但官方一等公民 |
| 周下载量 | 数百万级 | `@langchain/core` 约 120 万（2025 数据） |
| API | — | 与 Python 版 1:1 对应 |

**决定：用 TypeScript/JavaScript。** 理由：
- 前端背景，TS 类型系统 + 已有 Node 环境，上手零摩擦
- 概念与 Python 版完全一致，将来迁移成本极低（1~2 周适应语法）
- 能直接复用已有前端技术栈

---

## 4. 踩坑：LangGraph.js 1.x 的 API 已变（最重要的一条）

**网上大量教程是旧版，照抄会报错。**

| | 旧版（0.x） | 新版（1.x，本项目用） |
|---|---|---|
| State 定义 | `MessagesAnnotation` | `StateSchema` + `MessagesValue` |
| 自定义字段 | `Annotation<T>({reducer, default})` | `new ReducedValue(zodSchema, { reducer })` |

正确写法（已在 `probe.mjs` 验证）：

```js
import { StateGraph, StateSchema, MessagesValue, ReducedValue, START, END } from "@langchain/langgraph";

const State = new StateSchema({
  messages: MessagesValue,                                          // 预置：消息累积
  next:  new ReducedValue(z.string().default(""), { reducer: (_c, n) => n }),     // 覆盖式
  steps: new ReducedValue(z.number().default(0),  { reducer: (c, n) => c + n }),  // 累加式
});

const graph = new StateGraph(State)
  .addNode("a", nodeA)
  .addEdge(START, "a")
  .addConditionalEdges("a", route, { b: "b", end: END })
  .compile({ recursionLimit: 30 });
```

**方法论沉淀**：面对快速迭代的框架，**先写最小探针验证 API，再写业务代码**。
本项目先写了 `probe.mjs` 验证 4 个关键 API（StateSchema / 条件边 / ChatDeepSeek / bindTools）
全部通过后才动手，避免了一次性堆几百行再 debug。

---

## 5. 手搓 vs 框架 逐行对照

| Ex4 手搓 `supervisorLoop` | Ex5 LangGraph |
|---|---|
| `let context = "用户总目标：" + ...` | `StateSchema`（messages/next/task/steps/final） |
| `for (i = 0; i < MAX_DELEGATES; i++)` | `supervisor` 节点 + 条件边回环 |
| `JSON.parse(extractJson(decision))` | `addConditionalEdges("supervisor", route, {...})` |
| `if (target === "summary") { ... }` | 路由到 `summarizer` 节点 → `END` |
| `MAX_DELEGATES = 6` | 手写护栏 **+** `recursionLimit`（框架原生） |
| 手写 `context += output` 回灌 | `MessagesValue` reducer 自动追加 |
| 手写 if/else 分发工具 | `tool()` 抽象 + `TOOL_MAP` + `.invoke()` |
| （无） | `MemorySaver`：会话持久化/断点恢复 |
| （无） | `stream()`：逐步流式输出 |

### 5.1 有意保持不变的（对照组设计）

4 个角色的人设 prompt（几乎逐字相同）、`rag.js` 检索逻辑、护栏数值
（`MAX_DELEGATES=6` / `MAX_TOOL_CALLS=3`）、`extractJson` / `extractFinalAnswer` 防御性解析、
每个 worker 内部新造独立 `messages` 数组（context 隔离）、前端结构（Vite + React + 时间线）。

> **保持这些不变，才能确保观测到的差异只来自编排层**——这是本 Example 的设计精髓。

### 5.2 其他维度差异

| 维度 | Ex4 手搓 | Ex5 LangGraph |
|---|---|---|
| 模块系统 | **CommonJS**（`require`） | **ESM**（`import`） |
| 依赖 | **只有 `dotenv`**（零框架） | langgraph + core + deepseek + zod |
| 调模型 | 裸 `fetch` 打 `/chat/completions`，自己拼 header、自己解析 | `ChatDeepSeek` 官方集成包 |
| 工具定义 | 手写 JSON Schema 对象 | `tool()` + zod，自带参数校验 |
| 工具分发 | `executeToolSync` 手写 if/else | `TOOL_MAP[name].invoke()` |
| **多轮记忆** | **无**（每请求新建 `context`，请求间零记忆） | thread_id + 检查点 |
| 环境变量 | `OPENAI_*`（baseURL 带 `/v1`） | `DEEPSEEK_*`（集成包内置） |
| 端口 | 3004 / 5174 | 3005 / 5175 |
| `npm start` | = 起 **HTTP 服务** | = 跑 **CLI**；起服务要 `npm run serve` ⚠️ |
| 工程化 | 只有 `server.js` | 多出 CLI 入口、4 个探针、端到端测试 |

### 5.3 三个容易误解的点

**① 两者都不是 token 级流式，都是「事件级」**
Ex4 调模型是 `stream: false`；Ex5 也是 `bound.invoke()`（非流式）。
真正的 token 流式只有 **Ex1** 做过。这里的"流式"= 把 Agent 干活过程**分事件**推给前端。

**② `draft_doc` 在 Ex4 是假的，Ex5 才真落盘**
```js
// example4/server/agents.js:48-53
function executeToolSync(name, args) {
  if (name === "draft_doc") {
    // demo 里简单回显，真实可落盘；这里返回确认即可
    return JSON.stringify({ ok: true, title: args.title, saved: true });
```
Ex4 只回一句"保存成功"，**一个字节都没写**——所以 Ex4 没有 `drafts/` 目录。
Ex5 用 `tool()` 重写时才真写成文件（→ `server/drafts/`，已被 .gitignore 忽略）。

**③ Ex4 没有多轮记忆，Ex5 才有**
Ex4 每次 `/api/chat` 都 `let context = "用户总目标：" + userInput`，请求结束即弃。
追问"那病假呢？"在 Ex4 里是全新一轮，完全不知道上一轮聊了什么。

---

## 6. 框架帮你做了什么 / 没帮你做什么（核心认知）

**✅ 框架替你做的**
- 图的拓扑与流转（条件边、循环边、终止条件）
- 状态合并（reducer 自动处理追加/累加，省去手写字符串拼接）
- 递归深度保护（`recursionLimit`，防止图跑飞）
- 工具抽象（`tool()` 自带参数校验与 `.invoke()`）
- ~~持久化与流式（MemorySaver / stream，本项目暂未接入）~~ → ✅ P0·1/P0·2 已接入：
  一个 `compile({ checkpointer })` 参数就拿到会话记忆、断点恢复、时间旅行

**❌ 仍需你自己操心**
- **Prompt 质量**：主管决策的 JSON 仍可能不干净，仍需 `extractJson` 兜底
- **Context 隔离**：框架不会自动隔离！每个 worker 节点内部仍要自己构造独立 messages，
  只把结果写回共享 State
- **成本控制**：工具调用次数、委派轮次的熔断逻辑仍要手写（`MAX_TOOL_CALLS` / `MAX_DELEGATES`）
- **输出解析容错**：汇总阶段仍可能返回 JSON，仍需 `extractFinalAnswer`
- **中断信号的接线**：框架把 `signal` 放进节点入参 `config`，但**不会自动透传给 `model.invoke()`**
  （P0·2 坑 2：不透传 = 客户端断开后后端继续烧 token）
- **会话的花边信息**：框架只存 State，标题/创建时间/轮次要自己维护注册表
- **接入持久化后的连锁改动**：护栏计数器要按轮重置、prompt 要标注"哪条是本轮任务"
  ——这类 bug 手写编排时根本不存在

> **一句话结论**：框架解决的是**编排的结构性问题**（拓扑、状态、流转、持久化），
> 不解决**模型行为的不确定性**（乱输出格式、无限调工具、幻觉）。后者永远要你兜底。
>
> 这也解释了为什么 Ex4 踩的三个坑（summary 包 JSON / 研究员无限检索 / 分块标题孤立）
> 在 Ex5 里前两个依旧存在、依旧要手写防御——**换框架不会让模型变乖**。
>
> P0·2 补充了第三条：**框架给了能力，不代表替你接好线**。检查点很香，
> 但 saver 要自己做成单例、signal 要自己往下传、护栏计数要自己按轮改。

---

## 7. 验证结果（2026-09-02，真实跑通）

环境：Node v22.14.0 / `@langchain/langgraph@1.4.13` / `@langchain/core@1.2.9` / `@langchain/deepseek@1.1.11`

**探针（probe.mjs）4 项全通过**：StateSchema 自定义字段、条件边+自定义 reducer、
ChatDeepSeek 真实调用（1.1s）、bindTools 返回 tool_calls。

**完整链路（index.js）**，默认任务"调研请假制度→写 100 字新人提醒→检查事实错误"：

```
知识库 54 块
🧭 主管→researcher → 🔧检索×3 → ✅（熔断生效）
🧭 主管→writer     → 🔧draft_doc → ✅
🧭 主管→reviewer   → 🔧检索×3 → ✅（发现无法核验文件本身）
🧭 主管→writer     → 🔧修订 → ✅              ← 循环边：反思迭代
🧭 主管→reviewer   → ✅ 通过
🧭 主管→summarizer → 最终答案（纯文本完整）
统计：委派 6 次（触发 MAX_DELEGATES 护栏）| 耗时 160.6s
```

验证通过的要点：
- ✅ 条件边路由正确（4 个目标节点）
- ✅ **循环边生效**（worker→supervisor 回环 = 反思迭代）
- ✅ 工具熔断生效（研究员/审校均只调 3 次）
- ✅ 章节锚点修复生效（检索命中带【章节：二、请假与考勤制度】的正文块）
- ✅ 护栏生效（6 次委派后强制汇总）
- ✅ 最终答案为纯文本

**SSE 流式（P0·1，`server.js` + `example5/web`）**：后端 `graph.stream({streamMode:"updates"})`，
合并 `onEvent` 回调细粒度事件，经 SSE 向 `/api/chat` 推送。实测健康检查 `/health` 返回
`{"ok":true,"kbSize":57,"framework":"langgraph"}`；前端 `npm run build` 通过（33 模块无错误）。
事件契约：`start → node_update → supervisor_decision → agent_start → tool_call → tool_result →
agent_end → (agent_output) → final → done`，错误走 `error`。

**会话持久化 / 断点恢复（P0·2，2026-09-03，端到端跑通）**
`node test-session.mjs`（自动拉起临时后端 3105）8 项断言全过：

```
T1 健康检查：checkpointer=MemorySaver（进程内内存，重启即丢）  ✅
T2 第 1 轮：threadId=t-20260902-0imbzx，4 次节点事件，拿到答案  ✅
T3 会话快照：messages=3 steps=2，State 已落盘              ✅
T4 第 2 轮（同 threadId）：messages 3 → 6，steps 2 → 4，turnSteps=0  ✅
   → 多轮会话记忆成立；护栏按轮独立计数
T5 会话列表：turns=2，标题取首条提问                        ✅
T6 中途断开：0.5s 内停止，interrupted=true，next=["supervisor"]  ✅
T7 续跑（resume）：跑完，interrupted=false                   ✅
   答案里同时出现第1轮年假 + 第2轮病假 + 弹性打卡/远程办公 → 跨轮上下文真的被用上了
T8 删除会话：checkpoint + 元数据一起清掉，再查 404            ✅
```

前端 `npm run build` 通过（33 模块无错误）；端口 3005 实测 `/health`、`/api/sessions` 正常返回。

---

## 8. P0·2 · 检查点（Checkpointer）：会话持久化 / 断点恢复

> 一句话：`compile({ checkpointer })` 一行参数，换来"会话记忆 / 断点恢复 / 时间旅行"三种能力。
> 这是目前为止**框架含金量最高**的一项抽象——手写编排时这三件事都得自己搭。

### 8.1 先探针后开发（沿用 P0·1 的方法论）

新写了 `probe-checkpoint.mjs`，**不调模型**、用两个慢节点（200ms / 3000ms）秒级验证 8 件事：

| 项 | 验证内容 | 结果 |
|---|---|---|
| P1 | `MemorySaver` 能否注入 `compile({ checkpointer })` | ✅ |
| P2 | 同 `thread_id` 多次运行，State 是否累积 | ✅ 第2轮 messages 3→6 |
| P3 | 不同 `thread_id` 是否隔离 | ✅ |
| P4 | `getState` / `getStateHistory` / `updateState` / `deleteThread` | ✅ 历史 8 个检查点 |
| P5 | 运行被 `AbortSignal` 中断后检查点是否保留 | ✅ `log=["A"] next=["b"]` |
| P6 | `null` 输入重跑同 `thread_id` 能否续跑 | ✅ B 补上，A 没重复执行 |
| P7 | `deleteThread` 清空会话 | ✅ |
| P8 | 中断后直接送新输入会怎样 | ✅ 从 START 整轮重跑，不报错 |

P8 是特意加的——它决定了 server 端要不要做特殊分支。结论：**不用**，
新消息天然表示"放弃断点重开一轮"，只有显式 `resume` 才续跑。

### 8.2 四个真踩到的坑（比官方教程有价值的 part）

**坑 1：saver 必须是进程级单例**
第一反应是在 `buildGraph()` 里 `new MemorySaver()`。错：每次请求新建图 = 换一个空本子，
跨请求记忆直接失效。所以单独抽出 `session.js` 持有单例，由 `server.js` 注入。

**坑 2：框架给了 `signal`，但要自己接上（最隐蔽的一个）**
端到端测试第一次跑失败：客户端断开后后端还在继续跑，T7 续跑被并发护栏拦下
（"会话正在运行中"）。查下来是——框架只把 `signal` 放进取节点入参 `config`，
**不会自动透传给 `model.invoke()`**。我们节点里写的是 `model.invoke(messages)`，
于是 abort 信号停在节点边界，HTTP 请求还在飞，token 继续烧。
修法：`model.invoke(messages, { signal: config.signal })`，并把 signal 一路传进
`runWorkerWithTools`。**修复后中断生效时间：挂起 → 0.5s**（测试 T6 实测）。

> 归类：这是"框架给了能力但不替你接线"——和 Ex4/Ex5 里"context 隔离""工具熔断"
> 是同一类问题。**框架替你解决结构性问题，接线和兜底永远是你的活**。

**坑 3：`next` 非空 ≠ 有断点**
运行中 `getState().next` 也非空（那是"正在执行那个节点"）。
第一版把二者混为一谈，导致"正在跑"被判成"可续跑"。
修法：`interrupted = !running && next.length > 0`，`running` 由 server 侧的并发 Set 维护。

**坑 4：`BaseMessage` 没有 `.role` 属性（框架隐式转换，最坑的一个）**
现象：刷新页面做历史回放时，**用户消息整条消失，只剩 AI 的回答**。
一度误判成"HMR 热更新丢了 state"，直到写 `probe-role.mjs` 探针实测才定位：

```
content : "用户总目标：调研一下我们公司的请假制度"
m.role  : undefined          ← ！！！不是 "user"，也不是 "human"
getType : human              ← 角色在这
class   : HumanMessage
```

原因：`MessagesValue` 会把 `{role:"user"}` **隐式转成 `HumanMessage` 实例**，
而 LangChain 的消息对象**根本没有 `.role` 属性**，角色要用 `getType()` 拿
（`human` / `ai` / `system` / `tool`）。于是 `/api/session` 里写的
`role: m?.role ?? "unknown"` 把**所有消息**（用户和 AI）一律映射成 `"unknown"`。

为什么 AI 的还能显示？——**纯属侥幸**：助手气泡是靠**内容前缀**识别的
（`[主管汇总]` / `[研究员 产出]`），不依赖 role；而用户消息只能靠 role 识别，于是被静默丢弃。

修法（后端按 `getType()` 派生并转 OpenAI 命名，前端同时接受 `user`/`human` 双保险）：
```js
const t = typeof m?.getType === "function" ? m.getType() : undefined;
role: t === "human" ? "user" : t === "ai" ? "assistant" : t ?? "unknown",
```

> 归类：**框架的隐式转换**——你写进去的和它存的不一样（这次是 `role:"user"` → `HumanMessage`）。
> 和坑 2 同属"框架不替你接线"的亲戚，但更难查，因为**错误路径恰好看起来正常**（AI 消息正常显示）。
> 方法论升级：遇到"某个字段取不到/不符合预期"，**先写探针打印真实对象，别猜**
> （本次若非 `probe-role.mjs`，靠读代码永远发现不了 `.role` 是 undefined）。

### 8.3 护栏要按"轮"计数（不改就会静默失效）

接入检查点后 `steps` 跨轮累积：第 1 轮用完 6 次 → 第 2 轮开局就"已达上限"被强制汇总，
多轮直接废掉。而累加式 reducer（`(c,n)=>c+n`）没法归零（只能 +0）。

解法：拆成两个字段
- `steps`（累加式）：累计委派次数，统计展示用
- `turnSteps`（**覆盖式**）：本轮委派次数，护栏看这个；汇总节点 `return { turnSteps: 0 }` 归零

> 这条属于"**接入持久化后，所有一次性护栏/计数器都要重新审视**"——
> 手写编排时没有跨轮状态，这类 bug 根本不存在。

### 8.4 多轮 prompt 也要跟着改

State 累积后，主管和汇总的上下文里混着历史轮次。实测会拿上一轮的任务继续委派/答非所问。
补了两条约束：
- 主管：进度回顾仅供参考，**最新一条【用户需求】才是本轮任务**；历史能用就别重复委派
- 汇总：以最新需求为准，历史产出仅作背景

（顺手命中学习计划 P1"prompt/context 调优"的内容。）

### 8.5 落地清单

| 文件 | 改动 |
|---|---|
| `server/session.js` | 新增：MemorySaver 单例 + 会话元数据注册表 + 并发护栏 Set |
| `server/graph.js` | `buildGraph(onEvent, { checkpointer })`；`turnSteps` 字段；signal 透传；多轮 prompt |
| `server/server.js` | 新增 `/api/sessions`、`GET|DELETE /api/session/:id`；`/api/chat` 支持 threadId/resume；客户端断开→abort |
| `server/test-session.mjs` | 新增：自动拉起后端跑 8 项端到端断言 |
| `web/src/hooks/useMultiAgent.js` | threadId（localStorage 持久化）、stop/resume/newSession、刷新后回放历史 |
| `web/src/App.jsx` | 会话栏：会话 ID / 新会话 / 停止 / 续跑断点 / 清空界面 |

## 9. 事件架构：SSE 事件从哪来（模型其实不知道事件的存在）

> **一句话结论**：`start / node_update / supervisor_decision / agent_start / tool_call /
> tool_result / agent_end / guardrail / supervisor_raw / agent_output / final / done / interrupted / error`
> 这一整套事件，**大模型一个都不知道，也不参与**。
> 它们是**可观测性层**（给我和前端看的），不是**协议层**（给模型看的）。
> 把全部事件删掉，图照样跑，只是前端一片黑。

### 9.1 事件的三个来源

**A. 框架原生（LangGraph 白送的）——只有 `node_update` 一个**

`graph.stream({streamMode:"updates"})` 每跑完一个节点吐一次 `{节点名: 增量}`：

```js
// server.js:276-283
send({ type: "node_update", node: nodeName, keys: Object.keys(update ?? {}) });
```

**B. 我在业务代码里埋的点（`onEvent` 回调）——其余大部分**

| 事件 | 位置 | 触发时机 |
|---|---|---|
| `tool_call` | graph.js:185 | 模型返回 tool_calls，我准备执行前 |
| `tool_result` | graph.js:195 | 工具执行完，结果出来 |
| `supervisor_raw` | graph.js:268 | 主管吐的 JSON 解析失败，把原文抛出来 |
| `guardrail` | graph.js:273 | 我拦下它（本轮委派超上限） |
| `supervisor_decision` | graph.js:278 | 我解析完主管的 JSON 决策 |
| `agent_start` | graph.js:293 / 332 | worker 或汇总节点开始 |
| `agent_end` | graph.js:304 | worker 干完活 |
| `final`（内部） | graph.js:355 | 汇总出答案（server.js 里改名 `agent_output` 避免与权威 final 撞车） |

**C. server.js 传输层自己加的**：`start` / `final`（权威，流结束时发）/ `done` / `interrupted` / `error`。

> 📌 **这就是 P0·1 的核心结论**：框架只给你**节点级**事件（哪个节点跑完了）。
> **节点内部**发生了什么（调了什么工具、主管怎么决策）框架不管，**得自己埋点**——
> `onEvent` 回调存在的唯一意义就是这个。又一次印证"框架给了能力，但要自己接上"。

### 9.2 那"每个 Agent 怎么知道该干什么"？——它不知道

**根本没有"研究员"这个模型。全程只有一个 `model` 实例**，被不同节点用不同的 system prompt 反复调用：

```js
// graph.js:149-152 —— 每个 worker 节点内部新造一个独立 messages 数组
const messages = [
  { role: "system", content: systemPrompt },   // ← 人设与职责
  { role: "user", content: userTask },          // ← 主管给的任务
];
```

| 节点 | system prompt | 工具集 | 扮演 |
|---|---|---|---|
| researcher | `AGENT_PROMPTS.researcher` | `[searchKnowledge]` | 研究员 |
| writer | `AGENT_PROMPTS.writer` | `[draftDoc]` | 写手 |
| reviewer | `AGENT_PROMPTS.reviewer` | `[searchKnowledge]` | 审校 |
| supervisor | `SUPERVISOR_PROMPT` | 无 | 主管 |

> **Agent = 提示词 + 工具集 + 在图里的位置。**
> 不是独立模型、不是独立进程、不是独立 API key。
>
> 上面那 4 行"新造 messages 数组"就是 **context 隔离**——对应 §6 写的
> "框架没帮你做的事"之一：框架不会自动隔离各 Agent 的历史。

### 9.3 模型只知道三件事，只会输出两种东西

**输入（它知道的全部）：**
1. **system prompt** —— 我写的人设与约束
2. **可用工具的 schema** —— `model.bindTools(tools)`（graph.js:161）把 `tool()` 转成 API 的 `tools` 参数
3. **messages 历史**

**输出（它能做的全部）：**
1. **纯文本**
2. **`tool_calls`**（结构化，由 bindTools 约定）

### 9.4 一条 `tool_call` 事件的完整链路

```
① 模型返回 msg.tool_calls = [{name:"search_knowledge", args:{query:"请假"}}]
      ↓  —— 模型的工作到此为止，后面全是我的代码
② 我的代码读到 → onEvent({type:"tool_call", name, args})     graph.js:185
③ 我执行工具   → onEvent({type:"tool_result", name, result})  graph.js:195
④ server.js 的 onEvent 回调 → send() 写进 SSE
⑤ 前端 useMultiAgent.js 的 switch 收到 → push 进 stepsRef → 渲染 🔧 调用 search_knowledge
```

**模型全程只参与第 ① 步。**

### 9.5 换个模型还通用吗？——完全通用

事件层跟模型**毫无关系**。换模型只需要：
- 换集成包（`ChatDeepSeek` → `ChatOpenAI` / `ChatAnthropic`）
- 确认它支持 `bindTools`（不支持 tool calling 的模型跑不了这套）

**不会变的**：SSE 事件、图拓扑、检查点、前端渲染——**一行不用改**。

> 分层的价值：模型是可替换的"推理引擎"，事件是稳定的"观测契约"。

### 9.6 记忆锚点

- **模型负责"想"，我的代码负责"做"和"说"**；`onEvent` 是我替它向外面转播的喇叭，它自己不知道有喇叭。
- 拿掉事件 = 图能跑但不可观测 → **可观测性不是可选装饰，是 debug 的唯一抓手**（P2 LangSmith 会进一步系统化这件事）。

---

## 10. 补缺 4 · HITL 人工审批（`interrupt`）

> 关键词：**让图在关键节点停下来等人**。这是 LangGraph 最有辨识度的能力，也是"全自动 Agent"
> 和"可干预 Agent"的分界线。补缺 4 完成。

### 10.1 为什么要做

之前的图只有"全自动"一条路径：主管派活 → worker 干 → 汇总。但真实业务里，
**写手产出草稿后、审校前**往往要人确认一下（法务/品牌风险）。框架提供了 `interrupt()`，
不用自己实现"暂停-持久化-恢复"。

### 10.2 探针实测（`probe-hitl.mjs`，不调模型）

| 验证项 | 结果 |
|---|---|
| 动态中断：`interrupt(payload)` 一调用即停，本节点后续代码不执行 | ✅ |
| 能读到中断负载：`getState().tasks[].interrupts[].value`（前端据此弹框） | ✅ |
| 恢复：`new Command({ resume: 用户输入 })`，`interrupt()` 返回值 = resume 值 | ✅ |
| **跨图实例恢复**：新 `buildGraph` + 同一个 `thread_id` 仍能续上 | ✅（靠 checkpointer，换 SqliteSaver 即可跨重启） |
| 静态中断：`compile({ interruptBefore:["x"] })` 可用 `null` 续跑 | ✅ |

> 关键认知：`interrupt` 的"持久化"不是框架施魔法——它依赖**同一个 checkpointer**。
> 所以 P0·2 接的 MemorySaver 在这里直接复用，HITL 几乎是"免费"的。

### 10.3 落地（`graph.js` + `server.js` + 前端）

**默认关闭，用 `HITL=1` 开关**——因为启用后流程会在"写手产出后"停下等人，会改变已验收的行为。
不想破坏现有流程，所以做成开关（`isHITL()` 判断环境变量）。

| 层 | 改动 |
|---|---|
| `graph.js` | 导出 `isHITL()`、`makeHumanReviewNode()`；建图时若 HITL 开启，`writer → human_review → supervisor` 插一个节点；关闭时 `writer → supervisor` 直连（与升级前一致） |
| `graph.js` | 节点内 `const answer = interrupt({ question, draft })`；把人的意见写回共享白板 `[人工审批] xxx` |
| `server.js` | `readInterrupts()` 读 `getState().tasks[].interrupts`；请求带 `humanAnswer` 时构造 `new Command({ resume: humanAnswer })`；流结束若仍卡在审批节点，推 `hitl` 事件（含 `{question, draft}`） |
| `server.js` | `/api/session/:id` 额外返回 `interrupts`，**刷新后确认框还在** |
| 前端 | `pendingHitl` 状态 + `answerHuman()`；App.jsx 渲染 📋 确认框（含草稿折叠、快捷"通过"按钮） |

### 10.4 集成测试（`test-hitl.mjs`，约 1~2 分钟）

实测输出：第一次跑 `next: ["human_review"]`（准确停在审批节点）、`draft 长度: 134 字`（拿到给人看的草稿）；
提交「通过」后 `next: []`（跑完）、最终答案正常、事件流含 `hitl_wait → hitl_done → final`。✅

### 10.5 认知沉淀

- **HITL = interrupt + checkpointer + Command**。三者缺一不可：没有 checkpointer 就"停了再也回不来"。
- **中断节点"第一次调用不执行后续"**——这是最容易写错的地方（在节点里 `interrupt` 之后还想做事，不会发生）。
- **默认关闭是工程纪律**：新能力必须能一键回退，否则重构后会破坏已验收的功能。

---

## 11. 文件清单

- `example5/server/graph.js`：★ 核心——State + 5 个节点 + 条件边 + 循环边（可注入 checkpointer）
- `example5/server/session.js`：P0·2——MemorySaver 单例 + 会话元数据 + 并发护栏
- `example5/server/probe-checkpoint.mjs`：P0·2 探针（不调模型，秒级验证 8 项）
- `example5/server/test-session.mjs`：P0·2 端到端自测（自动拉起后端，8 项断言）
- `example5/server/tools.js`：LangChain `tool()` 定义 search_knowledge / draft_doc
- `example5/server/rag.js`：复用 Ex4 检索（ESM 版，逻辑未变）
- `example5/server/index.js`：CLI 入口（灌知识库 → 建图 → 跑任务）
- `example5/server/probe.mjs`：API 探针（先验证后开发的方法论产物）
- `example5/server/probe-role.mjs`：消息格式探针——实测 `BaseMessage` 没有 `.role`（恒 undefined），角色要用 `getType()`（详见 §8.2 坑④）
- `example5/server/package.json`：ESM（`"type": "module"`）
- `example5/server/server.js`：HTTP 后端（端口 3005），`graph.stream()` → SSE + 会话管理
- `example5/web/`：Vite 前端（端口 5175，proxy /api→3005）可视化节点/工具/决策事件 + 会话栏
- `example5/README.md`：含手搓 vs 框架完整对照表 + **学习计划（P0~P4）**
- `example5/server/graph-react.js`：P0·3 对照版——worker 改用 `createReactAgent`（拓扑复用 graph.js）
- `example5/server/probe-react-agent.mjs`：P0·3 探针——预置 ReAct 的 API / 内置图 / 护栏 / 流式
- `example5/server/probe-hitl.mjs`：补缺 4 探针——`interrupt` / `Command` / 跨图实例恢复 / `interruptBefore`
- `example5/server/test-hitl.mjs`：补缺 4 集成测试——写手产出后中断 → 提交「通过」→ 跑出最终答案（约 1~2 分钟）
- `example5/server/probe-langsmith.mjs`：补缺 5 探针——LangSmith 配置检查 + 模拟 tracing（不联网、不需要真 key）

---

## 12. 已知限制 / TODO

- ~~**无前端 / 未用 streaming**：✅ 已做（P0·1）~~
- ~~**未用 MemorySaver**：✅ 已做（P0·2）——会话记忆 / 断点恢复 / 时间旅行全部接上~~
- **MemorySaver 重启即丢**：进程内内存，要跨重启得换 `SqliteSaver`（业务代码零改动，TODO）
- **上下文随轮次无限增长**：每轮 worker 都拿完整历史，生产要加裁剪/摘要（P1 范畴）
- ~~**未用 createReactAgent**~~ → ✅ **P0·3 已完成**：`graph-react.js` 用预置 ReAct 重写 worker 做对照，
  `probe-react-agent.mjs` 探针验证。核心发现：预置 agent **无"工具调用次数"熔断**（`recursionLimit` 数的是节点步数，
  同任务跑 4 次 > 手写版 3 次），且工具事件发生在**子图内部**需自己 stream 转发。
  → 结论：**暂不替换**手写版。详见 `example5/README.md` 的「P0·3」专章
- ~~**未做 HITL 人工审批**~~ → ✅ **补缺 4 已完成**：`HITL=1` 开启，写手产出后插 `human_review` 节点（默认关闭不破坏已验收流程）。
  探针（`probe-hitl.mjs`，含跨图实例恢复）+ 集成测试（`test-hitl.mjs`）双验证通过。详见上文 §10。
  → 核心认知：**HITL = interrupt + checkpointer + Command**，三者缺一不可
- **环境变量命名**：Ex5 用 `DEEPSEEK_*`，与 Ex3(`LLM_*`)、Ex4(`OPENAI_*`) 又不一致

---

## 13. 下一步

按群里那三条标准，第 2 条（框架）的 P0·1 / P0·2 已完成，剩下：

1. **P0·3 对比 `createReactAgent`**（框架预置 ReAct）：与手写工具循环对照，
   重点看熔断与可解释性的得失——最能体会"框架价值边界"的一步
2. **补第 3 条（prompt/context 调优）**：做专项对比实验
   ——同任务跑 3 版 prompt（朴素 / 加 CoT / 加 few-shot），记录准确率与格式遵从度差异
   （P0·2 里已经顺手碰到一次：多轮 prompt 不改就会复述上一轮）
3. **补 Ex3 语义检索**：当初方案 A 明确留的 TODO，把 `search()` 换成 embedding

---

## 14. 补缺 5 · LangSmith 可观测性（P2，2026-09-08）

> 把"运行过程"变得可见，替代 `console.log` 式 debug。补缺 5 完成。

### 14.1 实现方式：几乎零侵入

LangChain/LangGraph 的 trace 是**自动埋点**——`@langchain/core` 内置 callback，设了环境变量后，每次 `LLM.invoke` / `bindTools` / `graph` 节点执行都会自动上报。**业务代码一行没改**（`graph.js` / `tools.js` 无 LangSmith 相关代码）。

### 14.2 配置（`.env` 已配真实 key）

```bash
LANGCHAIN_TRACING_V2=true
LANGCHAIN_API_KEY=lsv2_xxx          # 用户提供的 key，已写入 .env（被 gitignore，不入库）
LANGCHAIN_PROJECT=ai-agent-ex5
```

### 14.3 额外加的"状态可见"（server.js）

虽然埋点零侵入，但"有没有真的开成功"肉眼看不出。加了 `tracingStatus()`：
- 启动日志打印 `[langsmith] tracing: enabled/disabled`（disabled 时给原因，如"LANGCHAIN_API_KEY 未设置"）
- `/health` 返回 `tracing` 字段（含 `enabled` / `reason` / `project`）

### 14.4 探针（`probe-langsmith.mjs`）

不联网、不需要真 key：验证环境变量检查逻辑 + 模拟一次 tracing 下的调用，确认埋点生效。

### 14.5 认知沉淀

1. **可观测性 ≠ 日志**。日志是主动 `console.log` 的点，会漏；trace 是框架**自动**结构化记录每一步，不会漏。
2. **LangSmith 只能看到 LangChain 原生调用**（`LLM.invoke` / graph 节点）；自定义的 `onEvent` SSE 事件（给前端时间线用的）**不会**进 LangSmith——两套是分开的观测面。
3. 是 **P1（prompt 调优）的必备配套**：没有 trace 看不清"哪一步吃掉最多 token / 哪次模型答非所问"，调优就是盲调。
4. 这是 **SaaS**，必须联网 + 有效 key 才真上报；无 key 时 LangChain 静默忽略，不影响业务。
