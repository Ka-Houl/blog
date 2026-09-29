# 3v3.top 离线站点

对 https://www.3v3.top 的完整离线镜像（VitePress 1.0.0-rc.44 静态站），共 **73 个页面 + 144 个静态资源**，约 12 MB。

## 怎么打开

**方式一：直接双击（file://）**
双击 `index.html` 即可。所有路径已改为本地相对路径，离线可读。
> 注意：浏览器安全策略会拦截 `file://` 下的 ES Module，因此这种模式下 **正文、样式、图片正常，但 mermaid 流程图、侧边栏折叠、深色模式切换等交互不生效**。

**方式二：本地小服务（推荐，功能完整）**
双击 `启动本地服务.bat`，会自动打开 http://127.0.0.1:8899 。这种方式下站点功能与原站一致。

**入口导航**：`全部页面.html` 列出了全部 73 个页面的目录，可当书签页用。

## 关于访问量统计（PV）

原站的访问统计是**前端 JS 统计**（LeanCloud，服务端地址 `https://leancloud.3v3.top`，还会调用 `https://api.ipify.cn` 记录访客 IP）。它只在浏览器里执行 JS 时才会触发。

- 抓取过程只下载了 HTML / CSS / JS / 图片，**从未执行过任何 JS**，因此本次镜像**没有给原站增加任何 PV**。
- 本地副本已做三层处理，确保以后浏览也不会上报：
  1. 禁用 `theme` 分包里访问统计组件的 `onMounted`（读统计、自增计数、取 IP 全部不再执行）；
  2. 统计服务地址改为无效地址，IP 接口改为 `about:blank`；
  3. 每个页面注入拦截脚本，阻断任何指向 `3v3.top` / `leancloud` / `ipify` / `qiniup` 的 `fetch` / `XMLHttpRequest` / `sendBeacon`。
- 页面底部的"总访问量"模块因无数据来源已隐藏。

## 目录结构

```
3v3-offline/
├── index.html              首页
├── 全部页面.html            离线导航（全部页面清单）
├── 启动本地服务.bat          一键起本地服务
├── aboutme.html            关于作者
├── jichu/      基础（HTML / CSS / JS / TS / 浏览器 / 网络 / Web安全）
├── jinjie/     进阶（React / Vue / Webpack / Vite / Rollup / Babel / SSR / 小程序）
├── jingyan/    经验（性能优化 / monorepo / 小程序 / 全链路监控）
├── suanfa/     算法与手写（writeApi / writeFunction / writeScenario / leetcode …）
├── ai/         AI（agent / mcp / skills）
├── demoHtml/   5 个独立的 HTML/CSS 小 Demo
└── assets/     样式、脚本、字体、图片（144 个文件）
```

## 已知差异（与原站一致或无法获得的部分）

- 原站侧边栏的「react performance」是**作者自己的拼写错误**，线上即为 404；本副本已重定向到实际存在的 `jinjie/react/performmance.html`。
- 原站导航栏 logo 指向的 `assets/svgs/favicon.svg` 线上也不存在；本副本已改为根目录真实的 `favicon.svg`。
- `suanfa/leetcode/leetcode` 索引页线上返回 404（未发布），但其 37 个题解 `.js` 文件均已下载。
- 正文中示例代码里出现的 `/1.1`、`/users` 等是文章里的 URL 示例，线上同样无效，保持原样。

## 复现方式

工作脚本保留在上一级目录的 `site3v3/`：`crawl.py`（抓取）、`rewrite.py`（路径改写）、`repair.py` / `fix2.py` / `fix3.py`（修复）、`harden.py`（停用统计）、`validate.py`（校验）。
