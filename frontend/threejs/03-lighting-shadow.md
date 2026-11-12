---
title: 03 · 光照与阴影
description: 三类光源分工、PBR 材质、阴影三开关、shadow.camera 取景框与 bias 调参。
---

# 03 · 光照与阴影

## 明暗是算出来的

`MeshStandardMaterial` 是 PBR（基于物理）材质：最终颜色 = 材质参数 × 光照贡献 × 视线角度。
**没有灯 = 没有光照贡献 = 纯黑**。这一条解释了绝大多数「我明明设了 color，怎么全黑」。

## 三类光源的分工

| 光源 | 特点 | 典型参数 | 用途 |
| --- | --- | --- | --- |
| `AmbientLight` | 无方向、均匀照亮、**不投影** | `0xffffff, 0.35` | 只用来提亮暗部，不能当主光 |
| `DirectionalLight` | 平行光，模拟太阳，**阴影主力** | `0xffffff, 2.2` | 主照明 + 投影 |
| `PointLight` | 一点向四周，距离平方衰减 | `0xff7a45, 25, 0, 2` | 灯泡、火把、氛围光 |

```ts
const ambient = new THREE.AmbientLight(0xffffff, 0.35)
const sun = new THREE.DirectionalLight(0xffffff, 2.2)
sun.position.set(6, 10, 4)
scene.add(sun.target)          // target 必须进场景，其世界矩阵才会被更新
const point = new THREE.PointLight(0xff7a45, 25, 0, 2)
```

::: tip 为什么 PointLight 强度要给到几十
`decay = 2` 表示物理平方衰减，加上物理光照单位，亮度随距离迅速变小。
练习里 `intensity = 25` 才看得出效果。另外点光源阴影要渲染 6 面 cube map，
`mapSize` 别盲目开大（练习中用 512）。
:::

**动手实验**：把环境光滑块拉到 0，背光面会彻底变黑——这就是「没有间接光」的真实感缺失，
也是后面要学环境贴图 / 全局光照的动机。

## 阴影：三开关 + 一台隐藏的相机

阴影不是材质效果，而是**用另一台相机把场景渲成一张深度图**，再比较深度决定谁被遮挡。

```ts
renderer.shadowMap.enabled = true
renderer.shadowMap.type = THREE.PCFSoftShadowMap   // 软阴影

sun.castShadow = true
sun.shadow.mapSize.set(1024, 1024)
sun.shadow.camera.left = -8       // 平行光的阴影相机是正交相机
sun.shadow.camera.right = 8
sun.shadow.camera.top = 8
sun.shadow.camera.bottom = -8
sun.shadow.camera.near = 0.5
sun.shadow.camera.far = 30
sun.shadow.camera.updateProjectionMatrix()  // 改完取景框必须调用
sun.shadow.bias = -0.0005

mesh.castShadow = true             // 物体投影
mesh.receiveShadow = true          // 物体接受阴影
floor.receiveShadow = true         // 地面接受阴影
```

**缺一不可的三开关**：`renderer.shadowMap.enabled` + 光源/物体 `castShadow` + 地面 `receiveShadow`。

### 阴影「缺一块」与「糊成一团」是同一个原因

| 现象 | 原因 |
| --- | --- |
| 部分物体没有影子 | 阴影相机取景框太小，物体落在框外 |
| 影子糊、锯齿明显 | 取景框太大，`mapSize` 的像素被摊薄 |
| 表面出现条纹（shadow acne） | 自阴影深度精度问题，用 `bias ≈ -0.0005` 消除 |
| 阴影「浮」离物体 | `bias` 调得过大 |

大场景要同步放大：练习 ④ 把范围扩到 `±25`、`mapSize 2048`，才能覆盖整条飞行路径。

::: tip 把看不见的东西画出来
`DirectionalLightHelper(sun, 1)` 和 `CameraHelper(sun.shadow.camera)` 能直接把光向与阴影取景框可视化。
Helper 需要每帧 `update()`、卸载时 `dispose()`。
:::

## 光照排错清单

| 症状 | 检查 |
| --- | --- |
| 全黑 | 有没有灯？用的是不是 `MeshStandardMaterial`？ |
| 有明暗但没影子 | 三开关是否齐全？`renderer.shadowMap.enabled` 开了吗？ |
| 影子缺一角 | `shadow.camera` 的 left/right/top/bottom/near/far |
| 影子有条纹 | `shadow.bias` |
| 平行光方向不对 | `sun.target` 是否 `scene.add()` |

## 自测

1. 环境光能不能产生阴影？为什么？
2. 阴影相机取景框调大后为什么会变糊？
3. `shadow.bias` 调太正或太负分别会出现什么？
4. 点光源 `intensity` 为什么比平行光大一个数量级？

---

[返回学习地图](./index.md) · 上一篇：[场景与材质](./02-scene-geometry-material.md) · 下一篇：[相机与控制器](./04-camera-controls.md)
