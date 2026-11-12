---
title: 02 · 场景图、几何体与材质
description: 右手坐标系、Object3D 树与继承变换、九种几何体与三类材质速查表。
---

# 02 · 场景图、几何体与材质

## 坐标系：先建立方向感

- **右手系、Y 轴朝上**，相机初始看向 **-Z**。
- `AxesHelper(2)`：红 = X、绿 = Y、蓝 = Z；读不懂方向时第一个打开它。
- `GridHelper(12, 12)`：默认铺在 **XZ 平面**当「地板」。
- 旋转单位是**弧度**：`Math.PI / 2` = 90°，`Math.PI` = 180°。

::: tip 调试习惯
「看不懂方向 → 开 AxesHelper；看不出距离 → 开 GridHelper」。
这两个 Helper 能解决入门阶段一半以上的空间感问题。
:::

## 场景图：一棵会继承变换的树

```
scene
└── drone (Group)            ← 没有形状，只是「文件夹」
    ├── body (Mesh)
    ├── arm  (Mesh)
    └── rotor (Mesh)         ← 父 Group 移动/旋转，所有子对象跟着变
```

`parent.add(child)` 之后，子对象的世界变换 = 父变换 × 自身局部变换。
所以练习里 `cube.add(edges)`（棱线跟着方块转）、`ring.add(disc)`（圆盘跟着光圈缩放）、
`group.add(mesh)`（整机一起飞），都**不需要额外写同步代码**。

`Group` 的价值就在这里：把几十个零件组装成一个逻辑对象，只需对父节点施加一次变换。

## Mesh = Geometry + Material

```ts
const geometry = new THREE.BoxGeometry(1.4, 1.4, 1.4) // 形状：顶点数据
const material = new THREE.MeshNormalMaterial()        // 外观：怎么着色
const mesh = new THREE.Mesh(geometry, material)        // 可显示对象
scene.add(mesh)
```

**性能基本功**：多个 Mesh 共享同一份 `geometry` / `material`，避免重复向 GPU 上传资源。
（注意共享资源在 dispose 时会被重复释放，见 [07 章](./07-react-integration.md)。）

### 几何体速查

| 几何体 | 典型参数 | 用途 / 坑 |
| --- | --- | --- |
| `BoxGeometry(w,h,d)` | `1.4,1.4,1.4` | 方块、机身、建筑 |
| `SphereGeometry(r,ws,hs)` | `0.6,32,16` | 球；段数决定面数 |
| `PlaneGeometry(w,h)` | `24,24` | 地板必须 `rotation.x = -Math.PI/2` 才躺平 |
| `ConeGeometry(r,h,seg)` | `2,4,6` | 山体；配 `flatShading: true` 出低多边形感 |
| `CylinderGeometry(rt,rb,h,seg)` | `0.2,0.2,0.4,12` | 电机、柱子 |
| `TorusGeometry(r,tube,rs,ts)` | `1.3,0.12,16,48` | 光圈；默认在 XY 平面、法线沿 Z，正好让沿 -Z 飞行的物体穿过 |
| `TorusKnotGeometry` | `0.45,0.16,128,24` | 复杂曲面演示物体 |
| `EdgesGeometry(geo)` | 基于已有几何体 | 提取棱线，配合 `LineSegments` + `LineBasicMaterial`，比 `wireframe` 干净 |
| `RingGeometry(inner,outer,seg)` | `0.5,1.3,48` | 圆盘、地面标记 |

### 材质速查

| 材质 | 是否受光 | 适用场景 |
| --- | --- | --- |
| `MeshNormalMaterial` | 否 | 法线映射成 RGB，**无灯也能看出旋转**，最适合第一个 demo |
| `MeshBasicMaterial` | 否 | 灯泡、指示灯、半透明光圈等「永远可见」的标记 |
| `MeshStandardMaterial` | 是（PBR） | 真实感主角：`color` / `roughness` / `metalness` / `emissive` / `flatShading` |
| `LineBasicMaterial` | 否 | 棱线、辅助线 |

::: warning 反直觉事实
`MeshStandardMaterial` **没有灯就是纯黑**。明暗不是材质自带的属性，
而是渲染时用「表面法线 × 光源方向」实时算出来的——这是下一章的起点。
:::

半透明与双面渲染的常见组合：

```ts
new THREE.MeshStandardMaterial({
  color: 0x88ccff,
  roughness: 0.4,
  metalness: 0.2,
  transparent: true,
  opacity: 0.35,
  side: THREE.DoubleSide,  // 从背面也可见
})
```

## 自测

1. 为什么地板 `PlaneGeometry` 一定要转 `-PI/2`？
2. `cube.add(edges)` 之后为什么棱线会跟着转？
3. 一个场景里 1000 个相同方块，最直接的优化是什么？
4. 想让物体「无灯也可见」，应选哪类材质？

---

[返回学习地图](./index.md) · 上一篇：[渲染管线](./01-render-pipeline.md) · 下一篇：[光照与阴影](./03-lighting-shadow.md)
