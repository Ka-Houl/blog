---
title: 04 · 相机与控制器
description: 透视相机四参数、相机变换与物体变换相互独立、OrbitControls 全套配置与生命周期。
---

# 04 · 相机与控制器

## 透视相机的四个参数

```ts
new THREE.PerspectiveCamera(fov, aspect, near, far)
//                          45°  w/h      0.1   100
```

| 参数 | 含义 | 调错的后果 |
| --- | --- | --- |
| `fov` | 垂直视场角，越大越广角 | 过大产生畸变 |
| `aspect` | 宽高比，必须等于画布宽高比 | 不同步 → 画面拉伸 |
| `near` / `far` | 近/远裁剪面 | 物体太近/太远直接消失；范围过大降低深度精度 |

改了这四项中的任何一个，都要 `camera.updateProjectionMatrix()`（见 [01 章 resize 三连](./01-render-pipeline.md)）。

## 核心直觉：相机变换 ≠ 物体变换

拖动鼠标时，你改的是 `camera.position`（和 `controls.target`），**场景里没有任何物体被移动**。

练习 ③ 里物体始终在自转，拖动相机时自转照常——这是两套完全独立的变换。
把这点想清楚，就不会再写出「想让镜头绕物体转，结果把整个场景转了」的代码。

```ts
camera.position.set(4, 3, 6)
camera.lookAt(0, 0, 0)   // 只设置这一刻的朝向
```

> `lookAt()` 不是「绑定」：相机或目标移动后必须重新调用。
> 第三人称跟随相机就是每帧 `lookAt(lookTarget)`（见 [06 章](./06-drone-project.md)）。

## OrbitControls：来自插件目录的官方控制器

```ts
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'

const controls = new OrbitControls(camera, renderer.domElement)
controls.target.set(0, 0.7, 0)
controls.enableDamping = true       // 惯性
controls.dampingFactor = 0.08
controls.minDistance = 2.5          // 防穿模
controls.maxDistance = 18           // 防飞太远
controls.maxPolarAngle = Math.PI / 2 - 0.05  // 防钻到地板下
controls.autoRotate = true
controls.autoRotateSpeed = 1.2
```

它不在核心包里，而在 `three/examples/jsm/`（插件目录）。交互语义：左键旋转、滚轮缩放、右键平移，
本质是修改 `camera.position` 并始终 `lookAt(target)`。

两个必须记住的生命周期约束：

```ts
// 每帧：开阻尼/自动旋转后，不调用 update() 就完全不生效
controls.update()

// 卸载：控制器内部注册了 pointer/wheel 等 DOM 事件，不解绑会泄漏
controls.dispose()

// 命令式调用：React 里直接拿引用复位视角
controls.reset()
```

::: warning enableDamping 的隐藏前提
`enableDamping = true` 之后，`controls.update()` 变成每帧必调。
这是「配置写对了但完全没效果」的头号原因。
:::

## 相机方案选型

| 需求 | 方案 |
| --- | --- |
| 固定机位看物体自转 | 只设一次 `position` + `lookAt` |
| 用户自由环绕观察 | `OrbitControls` |
| 跟随运动物体 | 每帧计算 `desired`，指数平滑 `lerp`，再 `lookAt`（见 [05 章](./05-animation-math.md)） |
| 正交/等距视角 | `OrthographicCamera`（本项目未涉及） |

## 自测

1. 拖动 OrbitControls 时，`mesh.position` 会变吗？
2. 改了 `camera.fov` 之后需要调用什么？
3. 开了阻尼但相机不响应惯性，漏了哪行？
4. 为什么 `maxPolarAngle` 要略小于 `PI/2`？

---

[返回学习地图](./index.md) · 上一篇：[光照与阴影](./03-lighting-shadow.md) · 下一篇：[动画数学](./05-animation-math.md)
