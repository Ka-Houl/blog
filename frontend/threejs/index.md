---
title: Three.js 学习地图
description: 从渲染管线到最小 3D 游戏：把四个递进 demo 拆成一条可复用的图形学知识主线。
---

# Three.js 学习地图

> 本专题把「阶段一 · 渲染管线入门」的四个练习拆成九个知识点模块，按渲染管线顺序组织。
> 目标：学完之后，遇到任何 three.js 场景，你都能判断「问题出在数据、光、相机、循环，还是生命周期」。

## 一句话心智模型

```
Scene（有什么）  +  Camera（从哪看）  ──renderer.render()──▶  一帧画面
        ▲                                                        │
        └──────── 每帧用 delta 更新数据，再重新「拍」一张 ──────────┘
```

three.js 不会自动重绘。你改的是**对象属性**，只有 `renderer.render(scene, camera)` 才把当前状态变成像素。
所有「画面没变 / 变太快 / 变黑 / 缺阴影」的问题，都能从这张图里定位。

## 技术栈与资料来源

| 项 | 说明 |
| --- | --- |
| 核心库 | 原生 `three`（命令式 API），版本 0.186.x，非 React Three Fiber |
| UI 外壳 | React 19 + TypeScript（严格模式）+ Vite，只负责 tab、HUD、参数面板 |
| 类型 | `@types/three` 与 `three` 版本对齐 |
| 来源 | 归纳自个人练习仓库 `threejs-study`：`docs/README.md` 学习指南 + `App.tsx` 知识点面板 + 4 个 demo 源码 |

::: tip 为什么坚持原生 API
练习仓库刻意不用 R3F：框架会把 `Scene`、`Camera`、`render()` 藏进 `<Canvas>`，
入门阶段反而看不清渲染管线。等这九章吃透，再迁移到 R3F 只是换一层声明式外壳。
:::

## 学习路线（严格按顺序）

| 顺序 | 练习 | 建立的心智模型 | 对应章节 |
| --- | --- | --- | --- |
| ① | 旋转立方体 | 三件套、渲染循环、场景图、Mesh | [渲染管线](./01-render-pipeline.md) · [场景与材质](./02-scene-geometry-material.md) |
| ② | 光源与阴影 | 明暗是算出来的；阴影是第二台相机渲出的深度图 | [光照与阴影](./03-lighting-shadow.md) |
| ③ | 轨道漫游相机 | 相机变换 ≠ 物体变换；控制器是独立插件 | [相机与控制器](./04-camera-controls.md) |
| ④ | 无人机训练 | 输入 → 运动 → 相机 → 碰撞 → 关卡的完整游戏循环 | [动画数学](./05-animation-math.md) · [综合实战](./06-drone-project.md) |
| ⑤ | 工程化 | React × three 的接缝、显存生命周期 | [工程化接缝](./07-react-integration.md) |
| ⑥ | 出门 | 加载器、后期、物理、性能与排错表 | [进阶与排错](./08-advanced-troubleshooting.md) |

## 章节索引

| # | 核心问题 | 你能带走的东西 |
| --- | --- | --- |
| [01 三件套与渲染管线](./01-render-pipeline.md) | 第一帧是怎么出现的？ | 最小可运行骨架、rAF + delta、resize 三连、DPR 上限 |
| [02 场景图 · 几何体 · 材质](./02-scene-geometry-material.md) | 物体长什么样、放在哪？ | 右手系、Group 继承变换、9 种几何体与 3 类材质速查 |
| [03 光照与阴影](./03-lighting-shadow.md) | 为什么画面全黑、阴影缺一块？ | 三类光源分工、阴影三开关、shadow.camera 取景框、bias |
| [04 相机与控制器](./04-camera-controls.md) | 拖动鼠标到底改了谁？ | 透视相机四参数、OrbitControls 全套配置与 dispose |
| [05 动画数学](./05-animation-math.md) | 为什么 144Hz 上转得更快？ | delta/elapsed、帧率无关平滑 `1-e^(-k·delta)`、向量复用 |
| [06 综合实战：无人机训练](./06-drone-project.md) | 怎么把概念拼成「可玩」？ | 五段式游戏循环、偏航运动学、包围球碰撞、第三人称相机 |
| [07 React 与显存生命周期](./07-react-integration.md) | 切页后显存为什么涨？ | SceneContext/SceneHandle、ref 同步、递归 dispose |
| [08 进阶路线与故障排查](./08-advanced-troubleshooting.md) | 下一步学什么？出问题怎么查？ | 六条支线 + 症状 → 原因 → 修复速查表 |

## 章节说明

章节顺序与练习仓库的四个 demo 对应：①→②→③→④ 依次引入三件套、光照、相机与综合应用，
后半部分补充工程化与排错。每章包含概念速查表、最小代码与自测题。

::: warning 文档与配置要对齐
练习仓库的 `docs/README.md` 写的是 `localhost:5173`，而 `vite.config.ts` 实际配置 `port: 5177` 且自动打开浏览器。
以配置为准。
:::

---

[返回前端内容目录](../index.md) · [AI 知识体系](../../ai/index.md)
