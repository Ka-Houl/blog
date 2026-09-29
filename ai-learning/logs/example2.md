# Example 2 · Tool Calling（工具调用） — 详细进度

> 状态：✅ 已完成并验证（2026-09-02 初版截图确认；当日增强多轮记忆 + ReAct 循环）
> 目标：模型自主决定调用函数（天气/计算器/时间），后端本地执行后回喂结果，前端用 SSE 展示调用过程。这是"聊天机器人"与"Agent"的分水岭。

## 目录结构
```
example2/
├── server/
│   ├── server.js     # 声明 3 工具 + 本地执行 + SSE 推事件
│   ├── .env / .env.example
│   └── test.js       # 自测：node test.js 解析并打印 SSE 事件
└── web/              # React + Vite 前端
    └── src/
        ├── hooks/useToolChat.js        # fetch+ReadableStream 解析 SSE 帧
        ├── components/ToolCallCard.jsx  # 工具调用卡片
        └── App.jsx
```

## 工具列表（后端声明）
- `get_weather(city)` 查天气（模拟数据）
- `calculator(expression)` 计算器（仅允许数字+运算符，防代码注入）
- `get_current_time()` 当前时间

## 关键技术点
1. Function Calling 协议：`tools` 声明函数签名，`tool_choice: "auto"` 让模型自决
2. 两轮对话：第一轮拿 tool_calls → 后端 executeTool() 本地执行 → 以 `role: tool` 消息放回上下文 → 第二轮生成自然语言
3. 后端本地执行是 Agent 真正"行动"处（真实场景请求外部 API）
4. SSE 事件流：推 4 类事件 `tool_call / tool_result / answer / error`，前端逐帧渲染
5. POST 接口不能用 EventSource → 用 fetch+ReadableStream 按 `\n\n` 切帧解析

## 验证结果
- 前端页面（截图）：输入"帮我算 (12+8)*3" → 显示 calculator 卡片（参数 + 结果 60）→ 模型回答整合结果
- 工具调用链路（声明→模型决策→执行→回喂→回答）全通

## 增强（2026-09-02）：多轮记忆 + ReAct 循环
初版是"单轮工具调用"。增强为：
1. **多轮记忆**：模块级 `conversation` 数组跨请求保存历史（user/assistant/tool 全保留），模型能记得上文
2. **ReAct 循环**：`chatWithTools` 改为 `while` 循环，只要模型返回 `tool_calls` 就执行并继续请求，直到不再调工具才输出 `answer`（支持连续多次工具调用，上限 6 轮防死循环）
3. **清空会话**：新增 `POST /api/reset`，前端"清空会话"按钮调用，重置记忆

### 验证多轮记忆
`node test.js` 三段式：
- 第 1 轮：带工具问题 → 出现 tool_call/tool_result/answer
- 第 2 轮：追问"刚才那个结果再加 10" → 模型应基于记忆直接回答 70（无需重调工具或能引用）
- 重置后第 3 轮："刚才算的什么" → 模型不记得，重新调工具

## 踩坑
- Tool Calling 需 `stream:false` 才能稳定拿 tool_calls（Example 1 纯文本才用 stream:true）
- 若 deepseek-v4-flash 不支持 tool_calling，模型可能直接回答不调工具 → 改 deepseek-v4-pro 或关 thinking
- SSE 为 POST 时 EventSource 不可用 → 手动 fetch 解析
- ReAct 循环须设 MAX_ROUNDS 上限，避免模型异常时无限请求

## 增强（2026-09-02）：ReAct 对比实验 · thinking 开关可视化
为直观理解 ReAct 的"推理+行动"机制，新增前后端开关，对比开启/关闭推理过程：
1. **后端**：`callModel` 受模块级 `THINKING_ON` 控制是否带 `thinking`/`reasoning_effort` 参数；前端每次请求在 body 传 `thinking: bool` 动态切换；模型返回的 `reasoning_content` 通过新的 SSE 事件 `reasoning` 推送给前端
2. **前端**：header 加 🧠「推理过程 ON/OFF」切换按钮；开启时 bot 消息下以 `<details>` 折叠块展示 ReAct 思维链（推理过程），关闭时只给最终答案
3. **SSE 事件新增**：`reasoning { text }`（仅在 thinking 开启时由后端推送）

### 对比实验怎么玩
- 保持同一句多步问题（如"北京天气如果高于 20 度，给我算 20 块打 8 折多少钱"）
- 开 ON：能看到模型"先想→调 get_weather→再想→调 calculator→再想→回答"的完整链条
- 开 OFF：模型跳过可见推理，直接出工具调用 + 最终答案（更快但不可解释）
- 直观验证：开启时 UI 多一个"💭 推理过程"折叠块，关闭时该块消失

### 结论（待亲自验证）
- 开启 thinking：可解释性强、适合学习 ReAct 原理；但多一次推理开销、响应更慢
- 关闭 thinking：响应更快、适合生产；但看不到模型"为什么调这个工具"

### 关键认知：模型推理链能力差异需接入方自行抹平
`thinking` 是 DeepSeek(V4) 接口自带的配置参数；前端开关 → 后端决定是否在请求里带该参数、并决定是否把返回的推理内容吐给前端。但这套能力**各厂商不统一**，接入时需自己抹平：

- **请求侧（参数名/是否可选）**：DeepSeek V4 用 `thinking`+`reasoning_effort`；OpenAI o 系列原生带 CoT 且不可关；Claude 用 `thinking` 开关；普通 GPT-4o 无此能力。
- **响应侧（字段名）**：DeepSeek=`reasoning_content`、OpenAI=`reasoning`、Claude=`thinking` 块。后端 `msg.reasoning_content` 写死只适配 DeepSeek，换模型要改映射。
- **实测坑**：`deepseek-v4-flash` 即使不传 `thinking` 参数也会**默认返回** reasoning_content → 故 OFF 模式必须在后端主动丢弃该字段，否则开关失效。
- **抹平层级**：①请求参数拼装 ②响应字段映射 ③对前端暴露稳定契约（本项目统一成 `reasoning` SSE 事件）。这就是手写的迷你"模型适配层"，也是 Example 4（接多模型）要复用的能力。


## 运行
```powershell
cd example2/server && node server.js        # 端口 3002
cd example2/web && npm install && npm run dev   # http://localhost:5173（代理 /api → 3002）
cd example2/server && node test.js          # 多轮记忆 + 工具调用验证
```
