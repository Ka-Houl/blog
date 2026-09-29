# AGENTS.md — AI Agent 学习项目协作规则

> 本文件供 AI 编码助手（Claude / CodeBuddy 等）自动识别并遵循。
> 任何对接本仓库的 agent 应在每次会话开始时读取本文件，并在对话结束前完成"进度记录"动作。

## 项目性质
这是一个**前端工程师学习 AI Agent** 的实战仓库，按 Example 1~N 由浅入深推进。
每个 example 是独立可运行的小项目（前端 React + 后端 Node 代理真实大模型）。

## 目录约定
```
ai-agent-study/
├── AGENTS.md              # 本规则文件
├── LEARNING_LOG.md        # 总览：学习计划表 + 进度速览 + 环境配置 + 踩坑索引
├── logs/
│   ├── example1.md        # Example 1 详细进度
│   ├── example2.md        # Example 2 详细进度
│   └── exampleN.md        # 每个 example 一个文件，开始时创建
└── exampleN/...            # 各 example 代码
```

## 强制规则（每次对话必须遵守）
1. **对话结束前必须更新进度记录**：
   - 若本次涉及某个 example，更新对应的 `logs/exampleN.md`（新增技术点 / 验证结果 / 踩坑 / 运行状态变化）。
   - 更新 `LEARNING_LOG.md` 顶部的"进度速览表"与"变更日志"区（追加一行：日期 + 本次改动摘要）。
2. **新开一个 example 时**：在 `logs/` 下新建 `exampleN.md`，并在 `LEARNING_LOG.md` 计划表追加一行。
3. **不提交密钥**：`.env` 含 DeepSeek key，已被 `.gitignore` 忽略；任何记录中只写配置项名，不写真实 key 值。
4. **环境一致性**：DeepSeek 接入配置写 `LLM_BASE_URL=https://api.deepseek.com`（无 /v1）。
5. **验证优先**：声称某 example 完成前，必须实际运行 `node test.js` 或前端页面验证；未验证的标注为"代码完成，待验证"。

## 通信约定
- 用户是前端背景，解释偏重：前端流式渲染 / SSE / 状态管理 / 工程化。
- 拒绝在命令行 curl 上耗费时间，优先用 `node test.js` 或页面验证（PowerShell 引号/续行坑）。
