---
title: 前端
description: JavaScript 核心、前端工程化与 Three.js 渲染管线的知识整理。
---

# 前端

前端相关的知识整理，包含语言与运行时、工程化、图形渲染三个方向。

## 内容目录

| 方向 | 内容 | 入口 |
| --- | --- | --- |
| 语言与运行时 | 类型与判等、事件循环、闭包与原型、异步、模块化 | [JavaScript 核心知识](./javascript-basics.md) |
| 工程化 | 构建工具、模块化、包管理、版本控制 | [工程实践](../engineering/index.md) |
| 图形与渲染 | Three.js 渲染管线：场景、材质、光照、相机、动画、生命周期 | [学习地图](./threejs/index.md) |

## 图形与渲染 · Three.js

九个章节按渲染管线顺序组织，对应练习仓库的四个递进 demo。

| 章节 | 主题 |
| --- | --- |
| [01～03](./threejs/index.md) | 三件套与渲染循环、场景图与几何材质、光照与阴影 |
| [04～05](./threejs/index.md) | 相机与控制器、动画数学与帧率无关 |
| [06～07](./threejs/index.md) | 无人机训练场综合实战、React × three 与显存生命周期 |
| [08](./threejs/index.md) | 进阶路线与故障排查表 |

场景图、渲染循环、帧率无关动画与 GPU 资源生命周期，本质上仍是前端熟悉的
「状态 → 渲染 → 生命周期」模型；[01 渲染管线](./threejs/01-render-pipeline.md) 与
[07 React 接缝](./threejs/07-react-integration.md) 是这一对应关系最直接的两章。

## 归档资料

原 `public/notes/` 下的 `3v3.top` 离线镜像（73 个页面、约 12 MB）已移至
`archive/notes-offline/`，不参与站点构建。需要时可在本地打开该目录的 `index.html`，
或运行目录内的本地服务脚本。

---

[返回首页](../index.md) · [AI 知识体系](../ai/index.md) · [工程实践](../engineering/index.md)
