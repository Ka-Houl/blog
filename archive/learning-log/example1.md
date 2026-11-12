# Example 1 · 流式对话界面 — 详细进度

> 状态：✅ 已完成并验证（2026-09-01）
> 目标：前端用 React + Vite 实现，通过 ReadableStream 消费 LLM 流式输出，做打字机效果；后端 server.js 把请求转发给真实 DeepSeek 并原样流式推回。

## 目录结构
```
example1/
├── server/                    # DeepSeek 流式代理（Node 内置 http/https，零第三方依赖）
│   ├── server.js              # 转发 /api/stream，解析 SSE 推回前端
│   ├── .env / .env.example
│   └── test.js                # 自测：node test.js
├── web/                       # 前端 Vite + React
│   └── src/
│       ├── hooks/useChatStream.js   # 流式读取 + 对话状态管理（核心）
│       ├── components/ChatMessage.jsx
│       └── App.jsx / main.jsx / styles.css
├── legacy/                    # 离线静态版（纯前端、零后端，双击 index.html 即跑，fallback）
└── README.md
```

## 关键技术点
1. 前端消费流式：`fetch` + `response.body.getReader()` 循环 `reader.read()`，逐块 `textContent += chunk`
2. 精准更新单条消息：函数式 `setState` 只更新"正在输出的 bot 消息"
3. Vite 代理：`vite.config.js` 把 `/api` → 后端 3001，免跨域
4. 后端 SSE 解析：解析上游 `data:` 帧，提取 `choices[0].delta.content`
5. http vs https：根据 baseURL 协议动态选模块，否则 400

## 验证结果
- `node test.js` 成功返回 DeepSeek 文本："你好，我是DeepSeek，一个免费、乐于助人的AI助手..."
- 前端 5173 监听；浏览器聊天框发消息可见打字机流式输出

## 踩坑
- MOCK_REPLIES 中文引号导致语法错误 → 用「」代替
- baseURL 多写 /v1 → 404/空流（DeepSeek 端点无 /v1）
- 明文请求发到 https 端口(400) → 用 https 模块
- PowerShell curl 续行污染 → 用 node test.js 验证
- 浏览器地址栏打 /api/stream 无响应 → 接口是 POST
- 改 .env 后必须重启 node server.js

## 运行
```powershell
cd example1/server && node server.js
cd example1/web && npm install && npm run dev   # http://localhost:5173
cd example1/server && node test.js              # 后端自测
```
