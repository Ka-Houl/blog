# 小虾米的博客

基于 **VitePress** 的个人博客，部署到 GitHub Pages。

## 目录结构

```
.
├── .github/workflows/deploy.yml   # 推送到 main 自动部署
├── .vitepress/config.ts           # 站点配置（导航/侧边栏/主题）
├── public/                        # 静态资源（图片/favicon）
├── index.md                       # 首页
├── about.md                       # 关于
├── blog/                          # 博客随笔
├── ai-learning/                   # AI 学习项目（你的工作代码）
├── git-commands/                  # Git 命令项目
└── frontend-notes/                # 前端知识
```

## 本地开发

```bash
npm install      # 安装依赖
npm run docs:dev # 本地预览 http://localhost:5173
```

## 新增内容

在对应栏目目录下新建 `.md` 文件，侧边栏会自动生成，无需改配置。

## 部署

- 远程仓库：`Ka-Houl/blog`（项目页）
- 站点地址：`https://ka-houl.github.io/blog/`
- `.vitepress/config.ts` 中 `base` 已设为 `/blog/`

1. 将本项目推送到 `main` 分支
2. 仓库 Settings → Pages → Source 选择 **GitHub Actions**
3. 之后每次 push 到 main 即自动发布

> 若以后把仓库改名为 `ka-houl.github.io`（用户页），需把 `base` 改回 `/`。
