import { defineConfig } from 'vitepress'

// 站点配置：GitHub 项目页（Ka-Houl/blog），站点地址 https://ka-houl.github.io/blog/
// 若以后把仓库名改为 ka-houl.github.io（用户页），把 base 改回 '/' 即可
const description = '小虾米的技术知识库：AI 大模型与 Agent、Three.js 渲染管线、前端与工程实践。'

export default defineConfig({
  base: '/blog/',
  lang: 'zh-CN',
  title: '小虾米的知识库',
  description,
  // 归档目录与项目说明不生成页面
  srcExclude: ['archive/**', 'README.md'],
  // 旧的 public/notes 静态镜像已归档，不再需要关闭死链检测
  ignoreDeadLinks: false,
  // 离线静态页使用 .html 后缀，保持 cleanUrls 关闭
  cleanUrls: false,
  lastUpdated: true,
  head: [
    ['meta', { name: 'theme-color', content: '#0d9488' }],
    ['meta', { property: 'og:title', content: '小虾米的知识库' }],
    ['meta', { property: 'og:description', content: description }],
    ['link', { rel: 'icon', type: 'image/svg+xml', href: '/blog/favicon.svg' }],
  ],
  themeConfig: {
    nav: [
      { text: '首页', link: '/' },
      { text: 'AI 知识体系', link: '/ai/', activeMatch: '^/ai/' },
      { text: '前端', link: '/frontend/', activeMatch: '^/frontend/' },
      { text: '工程实践', link: '/engineering/', activeMatch: '^/engineering/' },
      { text: '随笔', link: '/essays/', activeMatch: '^/essays/' },
    ],
    sidebar: {
      '/ai/': [
        { text: '开始', items: [{ text: 'AI 知识地图', link: '/ai/' }] },
        {
          text: '01 · 基础认知',
          items: [
            { text: '大模型基础', link: '/ai/01-foundation/llm-fundamentals' },
            { text: 'API、流式与多轮对话', link: '/ai/01-foundation/api-and-streaming' },
          ],
        },
        {
          text: '02 · 表达控制',
          items: [{ text: 'Prompt 工程与结构化输出', link: '/ai/02-prompt/prompt-engineering' }],
        },
        {
          text: '03 · 知识增强 RAG',
          items: [
            { text: 'RAG 基础：Embedding 与向量库', link: '/ai/03-rag/rag-fundamentals' },
            { text: '高级检索与 RAG 评测', link: '/ai/03-rag/rag-advanced-eval' },
            { text: '从零搭一套本地 RAG 实验室', link: '/ai/03-rag/local-rag-lab' },
          ],
        },
        {
          text: '04 · 执行与编排 Agent',
          items: [
            { text: 'Function Calling 与工具设计', link: '/ai/04-agent/function-calling' },
            { text: 'LangChain 与 LangGraph', link: '/ai/04-agent/langchain-langgraph' },
            { text: 'LangGraph 一页纸速查', link: '/ai/04-agent/langgraph-cheatsheet' },
            { text: 'Agent、Workflow 与记忆', link: '/ai/04-agent/agent-workflow-memory' },
            { text: 'Multi-Agent：什么时候不该拆', link: '/ai/04-agent/multi-agent' },
            { text: 'MCP：工具生态的标准化层', link: '/ai/04-agent/mcp' },
          ],
        },
        {
          text: '05 · 企业级工程化',
          items: [
            { text: '企业级 Agent 架构', link: '/ai/05-engineering/enterprise-architecture' },
            { text: '部署、成本与稳定性', link: '/ai/05-engineering/deployment-and-cost' },
          ],
        },
        {
          text: '06 · 实战与复盘',
          items: [
            { text: '从 Example 1 到 6：能力阶梯', link: '/ai/06-practice/learning-path-review' },
            { text: 'AI Native R&D Platform 架构方案', link: '/ai/06-practice/ai-native-rd-platform' },
            { text: '前端 UI/UE 走查工具实践', link: '/ai/06-practice/uiue-review-tool' },
          ],
        },
        {
          text: '面试速查',
          items: [{ text: '六板块速查', link: '/ai/interview/cheat-sheet' }],
        },
      ],
      '/frontend/': [
        { text: '前端', items: [{ text: '内容目录', link: '/frontend/' }] },
        {
          text: '语言与运行时',
          items: [{ text: 'JavaScript 核心知识', link: '/frontend/javascript-basics' }],
        },
        {
          text: '图形与渲染 · Three.js',
          items: [
            { text: '学习地图', link: '/frontend/threejs/' },
            { text: '01 三件套与渲染管线', link: '/frontend/threejs/01-render-pipeline' },
            { text: '02 场景图 · 几何体 · 材质', link: '/frontend/threejs/02-scene-geometry-material' },
            { text: '03 光照与阴影', link: '/frontend/threejs/03-lighting-shadow' },
            { text: '04 相机与控制器', link: '/frontend/threejs/04-camera-controls' },
            { text: '05 动画数学与帧率无关', link: '/frontend/threejs/05-animation-math' },
            { text: '06 综合实战：无人机训练场', link: '/frontend/threejs/06-drone-project' },
            { text: '07 React × three 与显存生命周期', link: '/frontend/threejs/07-react-integration' },
            { text: '08 进阶路线与故障排查', link: '/frontend/threejs/08-advanced-troubleshooting' },
          ],
        },
        {
          text: '相关',
          items: [
            { text: '工程实践', link: '/engineering/' },
            { text: 'AI 知识体系', link: '/ai/' },
          ],
        },
      ],
      '/engineering/': [
        { text: '工程实践', items: [{ text: '总览', link: '/engineering/' }] },
        {
          text: '工作方法',
          items: [
            { text: 'Git 场景化速查', link: '/engineering/git-cheatsheet' },
            { text: 'AI 编程工作流', link: '/engineering/ai-coding-workflow' },
          ],
        },
        {
          text: '延伸',
          items: [
            { text: '企业级 Agent 架构', link: '/ai/05-engineering/enterprise-architecture' },
            { text: '部署与成本', link: '/ai/05-engineering/deployment-and-cost' },
          ],
        },
      ],
      '/essays/': [
        { text: '观点与随笔', items: [{ text: '总览', link: '/essays/' }] },
        {
          text: 'AI 编程三视角',
          items: [
            { text: '综述：三个视角一条结论', link: '/essays/ai-coding-views' },
            { text: '01 Gosling 与 AI 泡沫', link: '/essays/01-gosling-ai-is-scam' },
            { text: '02 用了 18 个月后停用', link: '/essays/02-brett-quit-ai' },
            { text: '03 「AI 编程 ≈ 外挂」类比拆解', link: '/essays/03-ai-coding-cheat-analogy' },
          ],
        },
        { text: '延伸', items: [{ text: 'AI 编程工作流', link: '/engineering/ai-coding-workflow' }] },
      ],
    },
    socialLinks: [{ icon: 'github', link: 'https://github.com/Ka-Houl' }],
    search: { provider: 'local' },
    editLink: {
      pattern: 'https://github.com/Ka-Houl/blog/edit/main/:path',
      text: '在 GitHub 上编辑此页',
    },
    footer: {
      message: '基于 VitePress 构建 · 知识体系持续整理中',
      copyright: '© 2026 小虾米',
    },
    docFooter: { prev: '上一篇', next: '下一篇' },
    outline: { label: '本页目录', level: [2, 3] },
    lastUpdated: { text: '最后更新于' },
    returnToTopLabel: '回到顶部',
    sidebarMenuLabel: '菜单',
    darkModeSwitchLabel: '主题',
    lightModeSwitchTitle: '切换到浅色模式',
    darkModeSwitchTitle: '切换到深色模式',
  },
})
