---
title: 01 · 三件套与渲染管线
description: Scene / Camera / Renderer 的职责边界、最小可运行骨架、rAF 循环与 delta、自适应三连。
---

# 01 · 三件套与渲染管线

## 三件套各自的职责

| 对象 | 职责 | 常见误解 |
| --- | --- | --- |
| `Scene` | 容器，也是一棵场景树的根节点 | 以为 `scene.add()` 就等于「显示」 |
| `Camera` | 决定从哪、用什么视角看 | 以为移动相机等于移动物体 |
| `WebGLRenderer` | 把 `Scene + Camera` 画进 `<canvas>` | 以为改了属性就会自动刷新 |

> **关键事实**：`renderer.render(scene, camera)` 是唯一的「拍照」动作。
> 哪怕你每帧修改了 `rotation`，只要不调用 render，画面永远静止。

## 最小可运行骨架

```ts
import * as THREE from 'three'

const renderer = new THREE.WebGLRenderer({ antialias: true })
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
renderer.setSize(width, height)
container.appendChild(renderer.domElement)

const scene = new THREE.Scene()
scene.background = new THREE.Color('#11131a')

const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 100)
camera.position.set(4, 3, 6)
camera.lookAt(0, 0, 0)

const cube = new THREE.Mesh(
  new THREE.BoxGeometry(1.4, 1.4, 1.4),
  new THREE.MeshNormalMaterial()
)
scene.add(cube)
```

四个容易漏掉的工程细节：

- `setPixelRatio(Math.min(dpr, 2))`：高分屏像素量按平方增长，DPR 不设上限会直接拖垮帧率。
- `antialias: true`：开启 MSAA，代价是额外的多重采样缓冲。
- `container.clientWidth || 1`：首帧容器可能还没布局完成，兜底避免 `aspect` 除零。
- `camera.lookAt()`：只设置一次朝向；之后相机动了要重新调用（见跟随相机）。

## 渲染循环：delta 是第一条纪律

```ts
const clock = new THREE.Clock()
let rafId = 0

const tick = () => {
  rafId = requestAnimationFrame(tick)  // 先预约下一帧
  const delta = clock.getDelta()        // 距上一帧的秒数
  const elapsed = clock.elapsedTime     // 从启动到现在的总秒数
  cube.rotation.y += 1.2 * delta       // 每秒 1.2 弧度，与帧率无关
  renderer.render(scene, camera)
}
tick()
```

| 变量 | 语义 | 典型用途 |
| --- | --- | --- |
| `delta` | 帧间隔（秒） | 位移、转速、平滑系数 |
| `elapsed` | 累计时间（秒） | 正弦呼吸、周期运动、灯光绕圈 |

::: tip 为什么要乘 delta
60Hz 每帧 16.7ms，144Hz 每帧 6.9ms。若写 `rotation += 0.02`，
144Hz 上的转速会是 60Hz 的 **2.4 倍**。写成 `speed * delta` 才是「每秒转多少弧度」。
把速度调到 0，循环仍在跑，只是每帧画出同一张画面——这正是理解「循环 ≠ 动画」的最好实验。
:::

## 窗口自适应三连

```ts
const onResize = () => {
  const w = container.clientWidth || 1
  const h = container.clientHeight || 1
  camera.aspect = w / h
  camera.updateProjectionMatrix()   // 改相机参数后必须调用
  renderer.setSize(w, h)
}
window.addEventListener('resize', onResize)
```

顺序不能省：`aspect` 是数据，`updateProjectionMatrix()` 才把数据写进投影矩阵，
`setSize()` 改 canvas 像素尺寸。少了中间那步，画面会被拉伸。

## 卸载：GC 管不到显存

```ts
cancelAnimationFrame(rafId)
window.removeEventListener('resize', onResize)
geometry.dispose()
material.dispose()
renderer.dispose()
renderer.domElement.remove()
```

JS 的垃圾回收只管堆内存。几何体、材质、贴图都占 GPU 显存，必须手动 `dispose()`。
完整递归清理见 [07 工程化接缝](./07-react-integration.md)。

## 自测

1. 不调用 `render()`，但每帧改 `rotation`，画面会动吗？
2. `delta` 和 `elapsed` 分别适合驱动哪类动画？
3. resize 后画面被拉伸，最可能漏了哪一行？
4. 为什么 DPR 要锁上限，而不是直接用 `devicePixelRatio`？

---

[返回 Three.js 学习地图](./index.md) · 下一篇：[场景图 · 几何体 · 材质](./02-scene-geometry-material.md)
