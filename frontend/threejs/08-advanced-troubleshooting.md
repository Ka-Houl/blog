---
title: 08 · 进阶路线与故障排查表
description: 资源加载、动画、后期、物理、性能、色彩管理六条支线，以及症状到原因的排错速查。
---

# 08 · 进阶路线与故障排查表

前七章覆盖的是「渲染管线」，也就是 three.js 的地基。进阶内容本质上都是**再学一个 API + 一条新管线**。

## 六条支线

| 方向 | 关键 API | 解决什么 | 前置知识 |
| --- | --- | --- | --- |
| 资源 | `GLTFLoader` / `TextureLoader` / `CubeTextureLoader` | 加载真实模型、贴图、环境 | [02 材质](./02-scene-geometry-material.md) |
| 动画 | `AnimationMixer` / `CatmullRomCurve3` | 骨骼动画、沿路径运动 | [05 时间语义](./05-animation-math.md) |
| 后期 | `EffectComposer` + `RenderPass` + `UnrealBloomPass` | 辉光、景深、色彩分级、抗锯齿 | [01 render 管线](./01-render-pipeline.md) |
| 物理 | `cannon-es` / `rapier` | 重力、刚体、真实碰撞 | [06 手写碰撞](./06-drone-project.md) |
| 性能 | `InstancedMesh`、视锥剔除、按需 dispose、DPR 上限 | 大量重复物体、显存与帧率 | [02 共享资源](./02-scene-geometry-material.md) |
| 色彩 | `toneMapping`、`outputColorSpace` | PBR 场景过曝/发灰、颜色不一致 | [03 光照](./03-lighting-shadow.md) |

::: tip 顺序建议
先「资源 + 动画」（换掉手写几何体），再「后期」（一次 render 变成一串 pass），
最后「性能」（有了大量物体才谈优化）。物理引擎只在需要真实动力学时引入。
:::

## 故障排查速查表

| 症状 | 最可能的原因 | 修复 |
| --- | --- | --- |
| 画面静止不动 | 没在循环里调用 `renderer.render()` | 每帧 render |
| 转速随显示器变化 | 动画没乘 `delta` | `x += speed * delta` |
| resize 后拉伸 | 改了 `aspect` 没 `updateProjectionMatrix()` | 补调用 |
| 高分屏卡顿 | `setPixelRatio(devicePixelRatio)` 未设上限 | `Math.min(dpr, 2)` |
| 画面全黑 | 用了 Standard 材质但没加灯 | 加光源，或换 Basic/Normal |
| 完全没影子 | 阴影三开关不齐 | `shadowMap.enabled` + `castShadow` + `receiveShadow` |
| 阴影缺一块 | `shadow.camera` 取景框太小 | 放大 left/right/top/bottom 并 update |
| 阴影糊 / 条纹 | 取景框太大 / `bias` 不对 | 收紧取景框、`bias = -0.0005` |
| 地板变成一面墙 | `PlaneGeometry` 没躺平 | `rotation.x = -Math.PI/2` |
| 阻尼/自动旋转无效 | 开 `enableDamping` 但没每帧 `controls.update()` | 补调用 |
| 拖动相机后物体错位 | 混淆相机变换与物体变换 | 只改 `camera.position` |
| 切换页面后显存持续上涨 | 没递归 `dispose()` / 没解绑事件 | 见 [07 卸载链](./07-react-integration.md) |
| React 滑块无效果 | state 没手动同步到 three 对象 | ref + effect 显式赋值 |
| 键盘「幽灵输入」 | `blur` 未清空输入集合 | 清空 + `preventDefault()` |
| 循环里偶发掉帧 | 每帧 `new Vector3()` 触发 GC | 预分配临时向量复用 |

## Helper 速查

| Helper | 诊断什么 |
| --- | --- |
| `AxesHelper` | 方向、坐标系、朝向 |
| `GridHelper` | 地面位置、距离尺度 |
| `DirectionalLightHelper` | 平行光方向与位置 |
| `CameraHelper(sun.shadow.camera)` | 阴影取景框是否框住场景 |

Helper 需要每帧 `update()`、卸载时 `dispose()`——它们也是 GPU 资源。

## 结业自测（能答上来就算地基过关）

1. 一帧从「数据变化」到「屏幕像素」经过哪几步？
2. 说出三个「配置写对了但没效果」的原因。
3. 阴影糊和阴影缺一块，是同一个参数的哪两端？
4. 为什么 GC 不能替你释放显存？卸载链有哪六步？
5. 要在场景里放 5000 棵树，你会先想到哪三个优化？

---

[返回 Three.js 学习地图](./index.md) · 上一篇：[工程化接缝](./07-react-integration.md)
