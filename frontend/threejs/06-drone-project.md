---
title: 06 · 综合实战：无人机训练场
description: 把场景图、运动学、碰撞、跟随相机、关卡判定拼成一个最小 3D 游戏循环。
---

# 06 · 综合实战：无人机训练场

前五章都是「单点知识」，这一章把它们组装成一个**会动、会撞、有目标**的系统。
练习 ④ 的完整循环可以抽象成五段，任何 3D 小游戏都是这五段的变体：

```
输入 Input → 运动 Motion → 相机 Camera → 碰撞 Collision → 关卡 Goal
   ▲                                                        │
   └──────────────── 每帧 update(delta) 循环 ─────────────────┘
```

## ① 输入：把键盘变成状态机

- 用 `e.code` 而不是 `e.key`，避免大小写/输入法影响。
- 方向键、空格要 `preventDefault()`，否则页面会滚动。
- `window.blur` 时清空按下集合，防止切出窗口后「幽灵输入」。
- 屏幕按钮用 `onPointerDown / Up / Leave / Cancel` 四件套，并设 `touch-action: none`。
- HUD 覆盖层默认 `pointer-events: none`，只给控件开 `auto`，否则会挡住 canvas。

## ② 组装：Group 就是「飞机」

机身、四根机臂、四个电机、螺旋桨、机头灯都是 `Group` 的子对象。
**整机变换只施加在父 Group 上**，零件不需要各自同步。

```ts
const drone = new THREE.Group()
drone.add(body, ...arms, ...motors, ...rotors, headLight)
scene.add(drone)
```

其他氛围元素：`Fog(color, 30, 75)` 让远处淡出，`GridHelper(80, 40)` 给速度感提供距离参照，
`ConeGeometry` + `flatShading` 做低多边形山体，`MeshBasicMaterial` 做永不受光的光圈。

## ③ 运动：标量 heading → 方向向量 → 速度积分

```ts
const MOVE_SPEED = 7, STRAFE_SPEED = 6, VERTICAL_SPEED = 5, YAW_SPEED = 1.6

forward.set(0, 0, -1).applyAxisAngle(UP, heading)
right.set(1, 0, 0).applyAxisAngle(UP, heading)
move.copy(forward).multiplyScalar(fb * MOVE_SPEED * delta)
     .addScaledVector(right, lr * STRAFE_SPEED * delta)
drone.position.add(move)
drone.position.y = THREE.MathUtils.clamp(drone.position.y, 0.8, 14)
drone.rotation.set(pitch, heading + trim.yaw, roll, 'YXZ')
```

关键点：**只维护一个标量偏航角 `heading`**，前后/左右方向都由它实时算出。
转向时方向自动跟着变，不需要维护一整套姿态矩阵。

## ④ 第三人称跟随相机

```ts
const CAM_DIST = 8, CAM_HEIGHT = 3.5, CAM_FOLLOW = 5

desired.copy(drone.position)
       .addScaledVector(forward, -CAM_DIST)
       .add(new THREE.Vector3(0, CAM_HEIGHT, 0))
camera.position.lerp(desired, 1 - Math.exp(-CAM_FOLLOW * delta))
camera.lookAt(lookTarget.copy(drone.position).addScaledVector(forward, 2))
```

相机放在「后上方」，看向飞机前方一点，比死盯机身更有速度感。
平滑系数用指数形式保证不同帧率手感一致（见 [05 章](./05-animation-math.md)）。

## ⑤ 碰撞与关卡：两个球形判定

```ts
// 硬碰撞：包围球近似，沿法线推回表面
diff.subVectors(drone.position, obstacle.center)
const minD = obstacle.radius + DRONE_RADIUS
if (diff.length() < minD) {
  drone.position.copy(obstacle.center).add(diff.multiplyScalar(minD / diff.length()))
}

// 关卡：进圈判定
if (drone.position.distanceTo(ring.position) < CAPTURE_RADIUS) {
  ring.visible = false
  score += 1
}
```

| 判定 | 手段 | 为什么不用 Raycaster |
| --- | --- | --- |
| 撞到障碍 | 球心距 < 半径和 | 需要「推开」的连续响应，而非一条射线 |
| 飞进光圈 | 距离 < 捕获半径 | 语义就是「进入一个区域」，球形判定更直接 |

包围球半径一般取视觉尺寸的 0.6～0.92 倍（练习用 `radius * 0.92` 与 `max(w,d) * 0.6`），
略微「宽松」手感更好。目标光圈还会 `rotation.z += delta * 0.8` 自转、
`1 + 0.08 * Math.sin(elapsed * 3)` 呼吸缩放，让静止场景活起来。

## 从 demo 到工程：还差什么

| 当前实现 | 生产替代方案 |
| --- | --- |
| 手写包围球碰撞 | `cannon-es` / `rapier` 物理引擎 |
| 手写关卡状态 | 状态机 + 数据表驱动关卡 |
| 键盘/按钮 HUD | 输入映射层（可重绑定、可回放） |
| 单机帧内判定 | 固定步长物理循环 + 插值渲染 |

::: tip 这一章真正的收获
不是「学会了无人机」，而是掌握了**把一个需求拆成五段、每段只依赖上一章一个概念**的方法。
之后做任何 3D 交互，都可以先画这五个框，再往里填 API。
:::

---

[返回学习地图](./index.md) · 上一篇：[动画数学](./05-animation-math.md) · 下一篇：[工程化接缝](./07-react-integration.md)
