# 小虾米的知识库

基于 **VitePress** 的系统化技术知识库，部署到 GitHub Pages。

## 目录结构

```
.
├── .vitepress/
│   ├── config.ts             站点配置：导航 / 侧边栏 / 搜索 / 页脚
│   └── theme/
│       ├── index.ts          主题入口
│       └── custom.css        品牌色、首页与阅读样式
├── index.md                  首页（hero + 知识地图）
├── about.md                  关于本站
├── ai/                       AI 大模型与 Agent（核心知识体系）
│   ├── index.md              知识地图
│   ├── 01-foundation/        基础认知
│   ├── 02-prompt/            表达控制
│   ├── 03-rag/               知识增强
│   ├── 04-agent/             执行与编排
│   ├── 05-engineering/       企业级工程化
│   ├── 06-practice/          实战与复盘
│   └── interview/            面试速查
├── frontend/                 前端：语言基础与图形渲染
│   └── threejs/              Three.js 渲染管线九章
├── engineering/              Git、AI 编程工作流
├── essays/                   观点与随笔
├── archive/                  归档（srcExclude，不参与构建）
│   ├── learning-log/         逐日 demo 进度
│   ├── demo-readmes/         实验项目 README
│   ├── drafts/               空壳示例与旧索引
│   ├── collaboration/        旧协作约定
│   └── notes-offline/        外部站点离线镜像（约 12 MB）
└── public/                   静态资源
```

## 本地开发

```bash
npm install
npm run docs:dev       # http://localhost:5173/blog/
npm run docs:build     # 产物 .vitepress/dist
npm run docs:preview   # 预览构建结果
```

> `base` 设为 `/blog/`，本地访问路径也是 `/blog/`。

## 写作约定

1. 每篇加 `title` / `description` frontmatter。
2. **内部链接使用相对路径 + `.md` 后缀**，例如 `./rag-advanced-eval.md`；
   不要用 `/notes/...` 这类站点绝对路径，否则在 `base` 下会失效。
3. 结构统一：核心概念 → 判据表 / 速查表 → 最小代码或实操清单 → 自测 → 系列导航。
4. 新增文章后，在 `.vitepress/config.ts` 对应 sidebar 分组追加 `link`。
5. 逐日进度、实验现场记录、外部资料副本放 `archive/`，不要堆进知识体系。

## 归档说明

`archive/` 由 `srcExclude: ['archive/**']` 排除，不会生成页面、不进搜索索引、不进构建产物。
被归档的内容**没有删除**，恢复方式见 `archive/README.md`。

## 部署

- 远程仓库：`Ka-Houl/blog`（项目页），站点地址 `https://ka-houl.github.io/blog/`
- `.github/workflows/deploy.yml`：推送 `main` 自动构建发布
- 仓库 Settings → Pages → Source 选择 **GitHub Actions**
- 若以后仓库改名为 `ka-houl.github.io`（用户页），把 `config.ts` 的 `base` 改回 `/`
