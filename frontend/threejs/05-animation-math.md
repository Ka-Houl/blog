---
title: 05 · 动画数学与帧率无关
description: delta/elapsed、Vector3 常用方法、指数平滑、欧拉角顺序、渲染循环里的对象复用。
---

# 05 · 动画数学与帧率无关

## 三种时间语义

| 类型 | 写法 | 例子 |
| --- | --- | --- |
| 增量运动 | `x += speed * delta` | 转速、位移、偏航角 |
| 周期运动 | `Math.sin(elapsed * k)` | 灯光绕圈、光圈呼吸缩放 |
| 平滑趋近 | `lerp(target, 1 - Math.exp(-k * delta))` | 第三人称相机跟随 |

**第一条纪律**：任何「每帧变化量」都要乘 `delta`，否则动画速度随显示器刷新率变化。

## 帧率无关的平滑：为什么不能用固定 lerp 系数

```ts
// ❌ 60Hz 下每帧 0.1，144Hz 下收敛快 2.4 倍
camera.position.lerp(desired, 0.1)

// ✅ 用指数衰减把 delta 纳入系数
camera.position.lerp(desired, 1 - Math.exp(-CAM_FOLLOW * delta))
```

`1 - e^(-k·delta)` 在任意帧率下都近似相同的「每秒收敛比例」。
`k` 越大跟随越紧（练习 ④ 取 `CAM_FOLLOW = 5`）。

## Vector3 / 欧拉角速查

```ts
const UP = new THREE.Vector3(0, 1, 0)

// 由标量偏航角求「前」「右」单位向量
forward.set(0, 0, -1).applyAxisAngle(UP, heading)
right.set(1, 0, 0).applyAxisAngle(UP, heading)

// 速度积分
move.set(0, 0, 0)
move.addScaledVector(forward, fb * speed * delta)
move.addScaledVector(right, lr * speed * delta)
group.position.add(move)

// 常用判定
if (move.lengthSq() > 0) { /* 有输入，避免无谓开方 */ }
group.position.y = THREE.MathUtils.clamp(y, 0.8, 14)
if (group.position.distanceTo(target) < CAPTURE_RADIUS) { /* 进圈 */ }
```

| 方法 | 用途 |
| --- | --- |
| `set / copy / clone` | 赋值、复制 |
| `add / sub / addScaledVector / multiplyScalar` | 向量运算，速度积分的主力 |
| `lengthSq() / length()` | 判空优先用 `lengthSq()`，省一次开方 |
| `distanceTo()` | 球形关卡判定、碰撞检测 |
| `applyAxisAngle(axis, angle)` | 绕轴旋转得到方向向量 |
| `lerp(target, alpha)` | 平滑趋近 |
| `normalize()` | 取单位方向（碰撞法线） |

**姿态与欧拉角顺序**：

```ts
group.rotation.set(pitch, heading + t.yaw, roll, 'YXZ')
```

`YXZ` 表示先偏航 Y、再俯仰 X、最后横滚 Z，最贴近飞行器直觉，也减少万向锁困扰。
练习 ④ 的 `trim` 滑块把 yaw/pitch/roll 偏移量叠加到机身上，对应真实无人机的「微调」。

## 渲染循环里的对象复用

```ts
// 在 setup 阶段一次性分配，update 里只改值
const forward = new THREE.Vector3()
const right = new THREE.Vector3()
const move = new THREE.Vector3()
const diff = new THREE.Vector3()
// ...共 9 个临时向量
```

每帧 `new THREE.Vector3()` 会产生大量短命对象，触发 GC 抖动，在 3D 场景里直接表现为掉帧。
**循环里只做数值计算，不分配对象**——这条规则和「乘 delta」一样属于基本功。

::: tip 两个容易忽略的边界
- 速度为 0 时，渲染循环仍然在跑（只是画面相同），不要为此停掉 rAF，否则交互状态会僵住。
- 键盘输入要在 `blur` 时清空，方向键要 `preventDefault()`，否则会出现「幽灵输入」和页面滚动。
:::

## 自测

1. `lerp(t, 0.1)` 为什么不是帧率无关的？
2. 什么时候用 `elapsed`，什么时候用 `delta`？
3. 为什么判空用 `lengthSq()` 而不是 `length()`？
4. `Euler('YXZ')` 的三个字母代表什么顺序？

---

[返回学习地图](./index.md) · 上一篇：[相机与控制器](./04-camera-controls.md) · 下一篇：[综合实战](./06-drone-project.md)
