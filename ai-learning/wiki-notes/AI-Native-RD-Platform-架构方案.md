# AI Native R&D Platform 完整架构方案 — 内容汇总

> 来源：飞书知识库文章 `ASzcws1xTiDzDPkp7uiciwpBnyb`
> 原标题：**AI Native R&D Platform 完整架构方案**
> 版本：当前讨论冻结版（基于 M5 阶段 A～E 五层讨论整理）

---

## 0. 文档定位

本文不是单纯设计一个 Agent Runtime，而是建立一套 **Case 驱动、Waker 执行、组织基础设施能力化** 的 AI Native R&D Platform。

平台需要支持：
- 人或系统提出需求、问题、技术目标；
- 将 Intent 转化为明确的 Goal 与 Acceptance；
- 形成一个持续演进的 Case；
- 由 Orchestrator 负责 Case 级推进与决策；
- 通过 Waker / Task / Attempt 完成实际工作；
- Waker 通过 Context、Memory、Workspace、Tool、Execution 使用组织已有研发基础设施；
- 通过 Result、Evidence、Artifact 形成可验证的工作结果；
- 通过 Evaluation 与 Human Acceptance 判断最终完成；
- 将有长期复用价值的经验沉淀为 Memory；
- **不替换** Git、Jenkins、部署平台、文档平台、监控平台等已有系统，而是把它们的能力以标准化方式接入平台。

---

## 1. 全局视角

### 1.1 一句话架构
Intent 驱动 Case → Case 驱动 Orchestrator → Orchestrator 通过 Task 委派给 Waker → Waker Runtime 基于 Working Context 使用 Memory、Tool、Workspace、Execution 调用组织已有基础设施 → 形成 Result / Evidence / Artifact → 通过 Evaluation + Human Acceptance 完成 Case。

### 1.2 五层之间的关系
```
M5-A  Product Capability      （用户最终想让系统完成什么）
  ↓
M5-B  Business Process        （系统围绕 Case 如何持续推进）
  ↓
M5-C  Business/Logical Model  （有哪些稳定的业务对象及关系）
  ↓
M5-D  System Architecture     （这些业务对象由哪些系统组件负责运行）
  ↓
M5-E  Technology Architecture （这些组件如何部署、通信、持久化、执行及接入现有基建）
```

---

## 2. 核心设计原则

1. **Case 是业务工作的连续容器**：不等价于一次用户消息，也不等价于一个 Outcome。可动态经历 Research→Diagnose→Build→Validate→Resolve。
2. **Goal 与 Acceptance 是 Case 的业务判断基准**：Strategy 只是当前路径和判断，不等于 Goal。
3. **State > Runtime**：Case State Store 是业务 Source of Truth，Runtime 可故障/退出/迁移/重建。
4. **Attempt 是执行边界**：Retry 不创建新 Task，而是创建新 Attempt。
5. **Waker 是工作主体，Orchestrator 是 Case 推进者**：Orchestrator 负责 Case 级观察/决策/委派/策略修订；Waker 执行具体 Task；Runtime 承载 Waker 运行。
6. **Context 与 Memory 分离**：Case State（业务事实）/ Memory（长期复用认知）/ Working Context（当前 Task 动态组装工作集）。
7. **组织基建保持自己的 Source of Truth**：AI Platform 只保存必要的 Reference、Case State、Evidence、Artifact、Memory，不复制外部系统 Master Data。
8. **先薄后厚（MVP 原则）**：避免引入过多 Agent、独立服务、复杂事件模型、独立 Vector/Graph DB、Tool Gateway、Provider Manager、复杂 Scheduler、Event Sourcing。

---

## 3. M5-A：Product Capability（产品能力）

回答：**用户最终希望 AI R&D Platform 完成什么？**

产品能力树：
```
AI R&D Platform
├── Interaction / Engagement       （交互与参与）
├── Intent & Goal                 （意图与目标）
└── Outcome Capabilities
    ├── Ask / Answer              （知识解答 / 答疑）
    ├── Research / Explore        （未知技术探究 / 调研报告）
    ├── Diagnose / Analyze        （故障定位 / 性能分析 / 归因）
    ├── Build / Change            （特性实现 / 架构配置变更 / 测试）
    └── Resolve / Improve         （缺陷修复 / 重构优化 / 技术债治理）
横向能力：Autonomy（Interactive / Autonomous / Hybrid）
```

**关键语义边界**：
- Ask/Answer：获得答案或解释。
- Research/Explore：围绕未知问题探索、汇总、形成报告（不暴露 Quick/Deep/Report 产品模式）。
- Diagnose/Analyze：分析现状、定位原因（独立 Outcome，不等于 Resolve 子能力）。
- Build/Change：把对象从当前态改变为目标态（代码/配置/文档/测试/UI）。
- Resolve/Improve：针对已存在问题完成解决/修复/优化。

**M5-A 不承担**：Context、Memory、Workspace、Execution、Tool、Evidence、Evaluation（下沉到 M5-C～E 实现）。

---

## 4. M5-B：Business Process / Case Loop（业务流程）

回答：**平台如何持续把一个目标推进到完成？**

### 统一 Case Loop
```
Intent → Goal + Acceptance → Confirmation/Policy → Case
→ Orchestrator Waker → Initial Strategy → Task Batch
→ Delegate Wakers → Task / Attempt → Result + Evidence
→ Batch All Terminal → Orchestrator Wake → Observe/Decide
→ {Continue / Retry / New Task / Strategy Revision / Human Intervention / Wait}
→ Goal Reached? → Evaluation Task → Evaluator Waker → PASS
→ Human Acceptance → Case Archived
```

关键概念：
- **Intent Waker**：澄清、理解、形成 Goal/Acceptance、决定是否进入 Case；生命周期结束即退出 Case 推进。
- **Orchestrator**：Case 层唯一推进者（观察/决策/委派/修订策略/请求评估或人工介入），不是 Scheduler/Tool Executor/Sandbox Manager。
- **Batch**：仅协调概念，非业务实体；MVP 不创建 Batch Entity/State/Workflow。
- **Task**：正式委派（含 Task Goal、Minimum Expected Outcome、dependency、assigned Waker Instance），与 Waker 绑定后不改变。
- **Attempt**：Retry = 同 Task 新 Attempt；Human Takeover = Human Attempt。状态：Pending/Running/Succeeded/Failed/Interrupted/Cancelled。
- **Dependency/Condition**：MVP 仅支持 Task 依赖前序 Task 的 Result。
- **Pause/Resume**：Pause 不再委派新 Task，运行中 Task 自然完成后进入 Paused；Resume 唤醒 Orchestrator 重新观察。
- **Evaluation**：普通 Task，PASS 后必须经 Human Acceptance 才归档。

---

## 5. M5-C：Business / Logical Model（业务/逻辑模型）

回答：**哪些业务对象是真正稳定、需跨运行长期存在的？**

核心实体（类图关系）：
- **Intent** → 转化为 **Case**
- **Case**（1对1 包含 Orchestrator WakerInstance；0..* 拥有按需懒加载 WakerInstance）
- **WakerDefinition**（1对多 → WakerInstance 实例化自）
- **Case**（1对多 → Task 拆解驱动）
- **WakerInstance**（1对多 → Task 绑定执行）
- **Task**（1对多 → Attempt 执行历程）
- **Attempt**（1对1 → Result 产出）
- **Result**（1对多 → Artifact / Evidence）
- **ResourceReference**：关联 Case/Task/Workspace/Evidence/Artifact（仅保存引用，不复制外部 Master Data）

要点：
- **WakerDefinition**：平台管理对象，含 identity/capabilities/allowed_tools/memory，支持逻辑删除/禁用。
- **WakerInstance**：Case-scoped 工作实体；一个 Case 仅一个 Orchestrator Instance；同 Waker Type 在一个 Case 最多一个 Instance；生命周期跟随 Case；多 Task/Attempt 复用。
- **Workspace / Runtime 不属于业务模型**（属 M5-D/E）。
- **Audit/Timeline**：查询/审计模型，非完整业务实体，不采用 Event Sourcing。
- **非一级业务实体**：Batch、Decision、Human Intervention、Queue、Runtime Session、Generic Delivery、Event。

---

## 6. M5-D：System Architecture（系统架构）

回答：**哪些系统组件负责承载业务能力？系统边界在哪里？**

- **Case State Store**：唯一业务事实源（Case/Goal/Acceptance/Strategy/Waker/Task/Attempt/Result/Evidence metadata/Workspace ref/Runtime ref）。Runtime、Broker、Cache 都不能成为业务 SOT。
- **Wake Coordinator**：只负责 start/wake/resume/release，不做业务决策（由 Orchestrator 完成）。
- **Runtime Execution**：技术执行实例（identity/Attempt ref/status/workspace ref/checkpoint/runtime metadata）。状态：Starting/Running/Suspended/Completed/Failed/Terminated。
- **并发模型**：不同 Waker Instance 可并行；同一 Waker Instance 默认串行 Task；一个 Task/Attempt 默认一个 Primary Sandbox。
- **可靠性/恢复**：Runtime Crash → Attempt 状态保留 → 新 Runtime Execution 继续；Sandbox Crash → Workspace 保留 → 新 Sandbox 挂载继续；Tool Failure 不等价于 Attempt 立即 Failed（可 retry/fallback）。
- **Side Effect**：所有外部副作用可追踪到 Tenant→Case→Task→Attempt→Runtime；Tool 自负责操作级幂等。
- **Observability**：Case Timeline（业务视图）/ Runtime Trace（Agent 执行视图）/ System Metrics（基础设施视图），统一关联 tenant_id/case_id/task_id/attempt_id/runtime_execution_id/sandbox_id。

### 安全边界（M5-D Security）
```
Human/System Identity → Case Authorization → Waker Capability
→ Resource Authorization → Credential
```
原则：Waker != Identity；Capability != Resource Authorization；Credential 不进 Prompt/Context/Memory；Runtime 最小权限；Autonomous != 无限权限；Sandbox 必须硬隔离（非 Prompt-based）。租户隔离：Tenant→Case→Workspace/Runtime/Credential 默认不共享；Memory 跨 Case 须基于 Scope 与 Authorization。Sandbox 安全至少需 process/filesystem/network/resource/credential/lifecycle 隔离与 interrupt/cancel。

---

## 7. M5-E：Technology Architecture（技术架构）

回答：**系统如何真正部署、执行、持久化、扩缩容，并与现有基建协同？**

### 7.1 三部署平面
```
Access → Control Plane (Go Backend × N, 无状态, LB 横向扩展)
       → Message Broker
       → Agent Runtime Plane (Waker Runtime × N, 弹性扩缩)
       → Execution Plane (Sandbox / Browser / Test / Device)
```
- **Control Plane**：长生命周期，Go Backend，初期逻辑模块化不强制微服务化，节点无状态。
- **Agent Runtime Plane**：随工作量弹性扩缩，Runtime 可创建/暂停/销毁/重建，不保存唯一业务状态。
- **Execution Plane**：Sandbox/Browser/Test/Device 等资源池化（Pool/Warm Pool/On-demand），与 Runtime 生命周期解耦。

### 7.2 物理基础设施（MVP）
- **PostgreSQL HA Cluster**：Case State Store（SOT）、Memory Store（pgvector）、Transactional Outbox。
- **Redis Cluster**：仅分布式锁与临时缓存，不承载核心业务状态。
- **S3-Compatible Object Store**：Artifacts（Patches/Binaries）、Evidences（Video/Trace/Logs）。
- **Message Broker（Kafka/RabbitMQ/NATS）**：Topic `platform.wake` / `platform.runtime` / `platform.external`。核心原则：at-least-once、幂等处理、SOT 仍是 State Store、Broker 不直接做 Sandbox Scheduler。
- **Model Gateway（Envoy/LiteLLM Proxy）**：provider adapter/routing/streaming/retry-fallback/auth/rate-limit/usage-cost；不负责 Waker Context 组织与 Case 决策。
- **Workspace Shared Storage（CephFS/EBS/PV）**：工作目录挂载，跨容器持久化。

### 7.3 Runtime / Sandbox / Workspace
- **Waker Runtime** = Agent Loop
- **Workspace** = Durable Working State
- **Sandbox** = Disposable / Isolated Compute Environment
- 默认：Task → Attempt → Primary Sandbox；Sandbox 可替换，Workspace 保留。

### 7.4 Execution Profile
固定运行环境（不把配置散落到 Task）：如 `coding-v1`/`ui-agent-v1`/`qa-v1`/`research-v1`，含 runtime requirements、sandbox image、tool availability、network policy、resource limits。版本升级用新 Profile 滚动切换（v1→v2，新 Task 用 v2，旧 Runtime 自然结束）。

### 7.5 Tool / MCP / Provider（最小模型）
```
WakerDefinition.allowed_tools[]
  → Tool Registry → Tool → Provider → MCP / API / CLI / Native
```
- Waker Definition 绑定整个 Tool，不拆 operation（如 `playwright` 而非 `playwright.click`）。
- **Tool Registry MVP** 只做：Registration / Definition / Discovery；不做 Tool Gateway / Provider Manager / Operation-level Permission。
- **边界**：Tool ≠ MCP；MCP Server ≠ Tool Registry；MCP 只是 Provider/连接方式之一。
- **UI Sandbox**：Code/Shell/Dev Server/Browser/Playwright/MCP/screenshots/video/traces。
- **Coding Sandbox**：Git/Shell/Compiler/Test/Build。一个 Task 尽量在一个 Primary Sandbox 内闭环。

### 7.6 Credential / Secret
```
Waker Runtime → Tool → Resource Access → Authorization → Credential → Resource
```
最小模型：`Credential{id, name, type, secret_reference}`，Secret 实际存 Secret Store，DB 只存引用。Secret 不进入 Prompt/Context/Memory/Result/Evidence/Artifact；Sandbox/Provider 真正执行访问时获取凭证。

### 7.7 Context / Memory
三个概念：
- **Case State**：业务事实与状态（SOT）。
- **Memory**：Waker 长期工作过程中沉淀、可跨 Task/Case 复用的工作认知。
- **Working Context**：Runtime 针对当前 Task/Attempt 动态组装的工作集（不是永久存储，也不是 RAG 库）。

Memory 设计：
- 统一 **Memory Store**（不拆多 Store），MVP 支持 remember/recall/get/update/forget。
- Scope：Waker Definition / Case / Repo / Project / Team-Org / Global。
- **Waker Definition Memory**：Waker 自身长期工作认知（如 Coding Waker 习惯先判断包管理器）。
- **Memory Manager**：职责 Recall/Remember/Consolidate/Update/Invalidate/Scope Governance；逻辑存在，MVP 不必部署成独立 Agent。
- **形成路径**：Waker 主动 `remember(candidate)` + 后台从 Task/Attempt/Result/Evidence 提炼。
- **检索**：轻量混合（Scope/Metadata Filter + Keyword/Full Text + Semantic Search → Ranking → Budget-aware Packing），不强制独立 Vector/Graph DB。

### 7.8 Storage / Persistence（逻辑分类）
- Case State Store（业务真相）
- Memory Store（可复用认知）
- Object Store（持久化输出）
- Workspace Storage（工作状态）
- Observability Store（运行记录）
逻辑分离，物理尽量复用基础设施。

### 7.9 Deployment / Operations
- **核心原则**：Control Stateless / Runtime Disposable / Sandbox Disposable / State Authoritative / Independent Scaling / Event-driven Wake / Profile-based Execution / Trace Everything。
- **扩缩容**：Control 按 QPS/Latency/Broker Lag/DB Load；Runtime 按 Active Attempts/Runtime Count/Model Workload/Broker Backlog；Execution 按 Sandbox Utilization/Warm Pool/Startup Latency。
- **Runtime Waiting**：等待外部事件时持久化状态、释放算力、待 Wake 重建继续。
- **Upgrade**：Control Rolling Update；Runtime 新执行用新版本；Execution 用新 Profile，旧 Sandbox 自然释放。

---

## 8. 组织基建集成（Organization Infrastructure Integration）

**核心原则**：AI Platform 不替换组织已有研发基础设施，已有系统通过能力化方式接入：
```
Organization System
├── Tool Capability      （做事情）
├── Context Capability  （获取信息）
├── Event Capability    （感知变化）
└── Resource Reference  （被操作/被引用的外部对象）
```
- 一个系统可同时提供多种能力（Git：Tool+Context+Event；Jenkins：Tool+Context+Event；Deployment：Tool+Context+Event）。
- "一个系统是不是 Tool" 是错误问题；正确问题是"它向平台暴露哪些 Capability，面向哪些 Resource"。
- 同一组织系统在 M5 五层表达不同：M5-A 用户要做什么 / M5-B 作为 Task 执行链能力 / M5-C 外部 Resource/Reference/Evidence / M5-D Tool/Context/Event 接口 / M5-E Provider/Adapter/Credential/Network 技术落地。

集成示例：
- **Git**：Repository 是外部 Resource；Waker→Git Tool→Git Provider→Organization Git；同时作为 Context Source（Source/History/PR）与 Event Source（Push/PR/Branch）。
- **Jenkins**：Tool（trigger-build/cancel）+ Context（build status/log/test result）+ Event（build failed/succeeded）。
- **Deployment Platform**：Tool Client 可运行在 Sandbox 内，经 Credential + Network Policy 访问。
- **Docs**：通常先作为 Context Source，主动创建/修改时才提供 Tool。
- **Monitoring**：Context（Metrics/Logs/Traces）+ Tool（Ack/Silence/Restart）+ Event（Alert/Incident）。
- **Issue/Ticket**：可同时是 Intent Source / Context Source / Tool Provider / Event Source。

**Resource Reference**（最小概念）：`{resource_type, external_id, provider, metadata}`，仅掌握必要引用，外部系统保留 Master Data。

---

## 9. M5 统一能力闭环

与组织世界的三种基本互动：
```
Organization
├── Information → Context
├── Capability → Tool
└── Event      → Intent
```
再通过 `Resource / Authorization / Credential` 建立可控访问，最终：
```
Information + Capability + Event → AI Platform → Case → Waker Work
→ Result / Evidence / Artifact → Memory
```

---

## 10. M5 五层最终总表

| 层次 | 核心问题 | 核心对象/能力 | 当前结论 |
|---|---|---|---|
| M5-A Product Capability | 用户要 AI 做什么 | Outcome Capability | Ask/Research/Diagnose/Build/Resolve |
| M5-B Business Process | 工作如何持续推进 | Intent/Case/Orchestrator/Task/Attempt/Evaluation | Unified Case Loop |
| M5-C Logical Model | 哪些稳定业务对象 | Case/WakerDefinition/WakerInstance/Task/Attempt/Result | 业务模型保持少实体 |
| M5-D System Architecture | 哪些组件负责运行 | State Store/Wake Coordinator/Runtime/Context/Memory/Tool | State 与 Runtime 解耦 |
| M5-E Technology Architecture | 如何部署运行 | Control/Runtime/Execution/Broker/Gateway/Sandbox/Storage/Integration | 三 Plane + 轻量基础设施 |

---

## 11. 已冻结的关键决策

- **产品层**：一个 Case 可组合多个 Outcome；Research 不暴露多种产品模式；Validate/Deliver 不是 Outcome；Human Acceptance 是最终完成点。
- **Case 层**：Case 是连续容器；Orchestrator 是唯一推进者；Task 是正式 Delegation；Retry=新 Attempt；Human Takeover=Human Attempt；Batch 仅协调概念；Evaluation 是普通 Task；Pause 不立即杀运行中任务。
- **Waker 层**：Waker Definition 是平台管理对象；Waker Instance 是 Case-scoped；Orchestrator 是特殊 Waker；其他 Waker lazy create；同 Waker Type 单 Case 最多一 Instance；Definition 绑定整个 Tool；Definition 保存自身长期 Memory。
- **Runtime 层**：Runtime 不拥有业务 SOT；Attempt 是业务执行边界；Runtime 可重建；Sandbox 可替换；Workspace 持久。
- **Tool 层**：Tool Registry 保持薄；Admin 与 Provider 都可注册；不拆 Operation Binding；MCP 是 Provider 方式之一；不引入 Tool Gateway/Provider Manager 为 MVP 核心。
- **Context/Memory 层**：Case State ≠ Memory；Memory ≠ Knowledge Base；Working Context ≠ Persistent Store；Platform 提供 Context Access；Waker 提供 Memory Need；Memory Manager 统一管理（可内部用 LLM，但不是独立业务 Agent）；Memory Store 初期可与 PostgreSQL 同体系；轻量混合检索。
- **组织基建层**：Organization System 非新 M5 顶层；作为 M5-E 外部技术依赖；统一 Tool/Context/Event/Resource Reference；一个系统可暴露多种能力；保留各自 Master Data SOT；不做大型 External Systems Gateway。

---

## 12. 最小 MVP 核心

压缩后的最小闭环：
```
Intent → Case → Orchestrator → Task → Waker → Runtime
  ├── Context
  ├── Memory
  ├── Tool
  ├── Workspace
  └── Execution
  → Result（Evidence / Artifact）→ Evaluation → Human Acceptance
```
底层平台基础设施：State Store / Message Broker / Model Gateway / Tool Registry / Memory Manager / Object Store / Workspace Storage / Observability / Credential & Authorization / Sandbox；与组织已有基建通过 Tool/Context/Event/Resource Reference 连接。

---

## 13. 后续可演进（不阻塞 MVP）方向

更先进的 progressive Tool Discovery、Tool operation-level Permission、多 Provider 自动选择、Memory Agent/advanced Reasoning、gbrain-like Context Pack/Delta、Temporal Knowledge Graph、多 Sandbox 协同、更复杂的 Dependency/Condition、更早的 Case Wake、更丰富的 Resource Catalog、多 Execution Provider、更复杂的 Workspace Snapshot/Migration。

**原则**：先让核心工作流成立，再沉淀复杂能力为可插拔 Provider/Capability，而非一开始把它们变成平台核心。

---

## 14. 结论

M5 已形成完整五层架构（A→B→C→D→E），核心不是"拥有更多 Agent"，而是建立一套统一的 **AI Work Operating Model**：
- **Case** 管理工作
- **Orchestrator** 管理推进
- **Waker** 完成工作
- **Runtime** 提供执行
- **Context** 提供当前所需信息
- **Memory** 沉淀长期认知
- **Tool** 把组织已有能力暴露给 AI
- **Workspace** 承载持续工作状态
- **Execution** 提供隔离运行环境

最终，组织现有的 Git、Jenkins、部署平台、文档、监控、测试、设备等不被替换，而是成为这个 AI Work Operating Model 的可调用能力与信息来源。
