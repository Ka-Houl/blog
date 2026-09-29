# LangGraph 一页纸速查（剔掉 plumbing，只留框架本身）

> **这份文档的定位**：Ex5 的代码里，大约 **80% 是 plumbing（管道工程）**，只有 **20% 是 LangGraph 本身**。
> 看 Ex5 觉得吃力，是因为管道把框架盖住了。这里只写那 20%。
>
> 配套：完整踩坑见 `example5.md` §8.2，事件架构见 `example5.md` §9，Ex4/Ex5 对照见 `example5.md` §5。

---

## 一、必须掌握的：只有 6 条

### 1. State 怎么声明 —— `StateSchema` + `MessagesValue` + `ReducedValue`

```js
const S = new StateSchema({
  messages: MessagesValue,                                        // 预置：消息自动累积
  next:  new ReducedValue(z.string().default(""), { reducer: (_c, n) => n }),    // 覆盖式
  steps: new ReducedValue(z.number().default(0),  { reducer: (c, n) => c + n }), // 累加式
});
```

**一句话**：State 就是"共享白板"。**reducer 决定字段语义**——覆盖式 `( _c,n)=>n` vs 累加式 `(c,n)=>c+n`，
一个函数区分两种行为，不用手写 `context +=`。

> ⚠️ 1.x 新 API。旧教程的 `MessagesAnnotation` 已废弃，照抄会报错。

### 2. 拓扑怎么画 —— `StateGraph`

```js
new StateGraph(S)
  .addNode("supervisor", supervisor)          // 节点 = 一个 async (state) => 增量
  .addEdge(START, "supervisor")               // 普通边
  .addConditionalEdges("supervisor", route, { // 条件边：按 State 决定去哪
    researcher: "researcher", summarizer: "summarizer",
  })
  .addEdge("researcher", "supervisor")        // ★ 循环边：反思迭代就靠它
  .compile({ recursionLimit: 30, checkpointer });
```

**一句话**：节点是纯函数（入 State、出增量）；**循环边是 LangGraph 相对 LangChain chain 的核心价值**
——chain 是有向无环图（DAG），表达不了"写手→审校→写手改"这种回环。

### 3. 存储怎么挂 —— `compile({ checkpointer })`

```js
export const checkpointer = new MemorySaver();   // ★ 必须进程级单例！
const graph = buildGraph(onEvent, { checkpointer });
```

**一句话**：检查点是**图之外的存储**。`MemorySaver`（内存，重启即丢）换成
`SqliteSaver` / `RedisSaver`，**业务代码零改动**——这就是"存储抽象"的价值，也是本条唯一要记住的考点。

> 在 `buildGraph()` 内部 `new MemorySaver()` 是错的：每次请求换一个空本子，跨请求记忆全丢。

### 4. 怎么跑、跑哪个会话 —— `invoke/stream` + `thread_id`

```js
await graph.invoke({ messages: [{ role: "user", content: "..." }] },
                   { configurable: { thread_id: "t-1" } });   // 指定会话
await graph.invoke(null, { configurable: { thread_id: "t-1" } }); // null = 从断点续跑
const stream = await graph.stream(input, { streamMode: "updates", signal }); // 流式
```

| 输入 | 语义 |
|---|---|
| 带 `messages` | 正常跑一轮（从 START） |
| `null` | **从最后一个检查点续跑**（断点恢复） |

> ⚠️ `graph.stream()` 返回的是 **Promise**，要先 `await` 再 `for await`。

### 5. 状态怎么读/改/回放 —— `getState` 四件套

```js
await graph.getState(cfg)                  // 当前快照（含 next：待执行节点）
for await (const h of graph.getStateHistory(cfg)) { }  // 历史检查点（时间旅行）
await graph.updateState(cfg, { steps: 0 }) // 人工改状态（HITL 审批的基础）
await checkpointer.deleteThread(threadId)  // 删会话
```

> ⚠️ `next` 非空 **不等于**"有断点"：运行中 `next` 也非空（那是"正在执行的节点"）。
> 判定必须是 `interrupted = !running && next.length > 0`。

### 6. 工具怎么给模型 —— `tool()` + `bindTools`

```js
export const searchKnowledge = tool(
  async ({ query }) => JSON.stringify(rag.search(query, 3)),
  { name: "search_knowledge", description: "...", schema: z.object({ query: z.string() }) }
);

const bound = model.bindTools(tools);     // 把 schema 转成 API 的 tools 参数
const msg = await bound.invoke(messages); // msg.tool_calls 就是模型想调的工具
await TOOL_MAP[name].invoke(args);        // 框架自带 .invoke()，不用手写 if/else 分发
```

**一句话**：对比 Ex4 手写 JSON Schema + 手写 if/else 分发，`tool()` 帮你做了
**参数校验**和**执行入口**两件事。

---

## 二、不用现在学的：Ex5 里的 plumbing

这些**不是 LangGraph 知识**，是为"能在浏览器里点着玩"付出的工程代价。看不懂可以先跳过：

| 你看到的东西 | 实际是什么 |
|---|---|
| `session.js`（会话注册表 + 并发 Set） | **我自己加的**，框架完全不要求（LangGraph 只存 State，不存"标题/创建时间"这类花边） |
| `/api/sessions`、`GET/DELETE /api/session/:id` | Web 化带来的 HTTP 契约 |
| 前端 `threadId` 存 localStorage、SSE 解析、HMR 丢状态、React 竞态 | **纯前端工程** |
| `turnSteps` / `steps` 拆分 | 接了 checkpointer 才**派生的业务问题**（不拆则第 2 轮一上来就触发护栏） |
| `signal` 手动透传、`BaseMessage` 无 `.role` | **踩坑经验**，不是必须掌握的概念 |

> **判断标准**：LangGraph 官方文档里没有的东西 = plumbing。

---

## 三、已踩的坑（归类：框架不替你接线 / 隐式转换）

完整版见 `example5.md` §8.2，这里只留结论：

| # | 坑 | 一句话 |
|---|---|---|
| 1 | saver 必须单例 | 在 `buildGraph` 里 `new` 会丢记忆 |
| 2 | `signal` 要手动透传给 `model.invoke()` | 不透传 = 客户端断开后后端继续烧 token |
| 3 | `next` 非空 ≠ 有断点 | 要配合 `running` 标志判断 |
| 4 | `BaseMessage` **没有 `.role`**（恒 `undefined`） | 角色要用 `getType()`；`MessagesValue` 会把 `{role:"user"}` 隐式转成 `HumanMessage` |

**方法论（已从 P0·1 沿用并升级）**：
> 遇到"框架行为不符合预期"，**先写最小探针打印真实对象，别猜**。
> 坑 4 若非 `probe-role.mjs` 实测，靠读代码永远发现不了 `.role` 是 undefined。

---

## 四、学习路径（推荐顺序）

```
① node server/probe-checkpoint.mjs   ← 215 行，无 HTTP/无前端/不调模型，秒级跑完
   把检查点全部概念跑一遍（P1~P8 每项都有可见输出）
        ↓
② 验收 Web 版现象（重启后端 + F5 + 点几下）  ← 验证"现象"，不用读懂代码
        ↓
③ P0·3：createReactAgent 对照          ← 反而更简单：把 worker 手写的工具循环
                                         （约 60 行）换成一个框架函数调用
        ↓
④ 回头再读 server.js / session.js / useMultiAgent.js  ← 框架熟了会轻松很多
```

**探针清单**（都在 `example5/server/`，不调模型 = 不花钱）：

| 探针 | 验证什么 |
|---|---|
| `probe.mjs` | StateSchema / 条件边 / ChatDeepSeek / bindTools |
| `probe-checkpoint.mjs` | 检查点全套（P1~P8） |
| `probe-role.mjs` | 消息对象的真实结构（role 是 undefined！） |
| `probe-stream.mjs` | stream 各模式 |
| `test-session.mjs` | 端到端 8 项断言（会真调模型，约 3~5 分钟） |

---

## 五、自测：这 6 问能答上来，框架这块就过了

1. reducer 怎么写能区分"覆盖"和"累加"？
2. 为什么多 Agent 必须用 LangGraph 而不是 LangChain 的 chain？
3. 把 `MemorySaver` 换成 `SqliteSaver`，业务代码要改几行？（答：0 行）
4. `invoke(null, cfg)` 和 `invoke({messages}, cfg)` 的区别？
5. `getState().next` 非空能直接判定"有断点"吗？为什么？
6. `tool()` 相比手写 JSON Schema，替你多做了哪两件事？

> 第 3 题的答案是 **0 行**——答上来，说明"框架把存储抽象掉"这个核心价值你已经吃到了。
