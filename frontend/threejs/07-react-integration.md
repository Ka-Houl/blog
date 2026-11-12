---
title: 07 · React × three 与显存生命周期
description: 命令式与声明式的接缝设计、SceneContext/SceneHandle、setupRef、ref 同步与递归 dispose。
---

# 07 · React × three 与显存生命周期

## 冲突从哪来

| | React | three.js |
| --- | --- | --- |
| 范式 | 声明式：state 变化 → 重渲染 | 命令式：直接改对象属性 |
| 对象生命周期 | 由虚拟 DOM 托管 | 由 GPU 显存托管，GC 管不到 |
| 更新方式 | 重新执行组件 | 每帧 `renderer.render()` |

所以把 three 塞进 React，真正要解决的只有两件事：**谁负责建场景**、**状态怎么同步过去**。

## 接缝设计：hook 管通用，demo 管业务

```ts
export interface SceneContext {
  scene: THREE.Scene
  camera: THREE.PerspectiveCamera
  renderer: THREE.WebGLRenderer
  container: HTMLElement
  THREE: typeof THREE        // 注入命名空间，demo 不必各自 import 运行时值
}

export interface SceneHandle {
  update?: (delta: number, elapsed: number) => void
  dispose?: () => void
}

export function useThreeScene(setup: (ctx: SceneContext) => SceneHandle | void) {
  // 渲染器、相机、自适应、rAF 循环、清理 —— 只写一次
}
```

demo 里只写「放什么物体、打什么灯、每帧怎么动」：

```ts
useThreeScene(({ scene, THREE }) => {
  const mesh = new THREE.Mesh(new THREE.BoxGeometry(), new THREE.MeshNormalMaterial())
  scene.add(mesh)
  return {
    update: (delta) => { mesh.rotation.y += speedRef.current * delta },
    dispose: () => { controls.dispose() },
  }
})
```

**分层的价值**：通用代码（最容易写错的部分）只存在一份，学习内容仍是完整的原生 API。

## 四个必须掌握的细节

### 1. `setupRef` 让 effect 只跑一次且闭包不陈旧

```ts
const setupRef = useRef(setup)
setupRef.current = setup               // 每次渲染更新引用
useEffect(() => {
  const handle = setupRef.current(ctx) // effect 依赖 []，场景只建一次
  ...
}, [])
```

### 2. React state 不会自动写进 three 对象

```ts
// 滑块改的是 React state，需要手动赋值到 three 对象
useEffect(() => { ambient.intensity = ambientValue }, [ambientValue])
useEffect(() => { controls.autoRotate = autoRotate }, [autoRotate])
```

凡是「动态值」，都要通过 ref 或 effect 显式同步；不要在 `setup` 里直接读 state（闭包永远是第一次的值）。

### 3. 命令式句柄与强制卸载

`controls.reset()`、飞机 `reset()` 这类动作不适合走状态，用 ref 暴露命令式方法即可。
切换 demo 时给组件加 `key={activeId}` 强制卸载旧场景，确保清理逻辑真的跑一遍。

### 4. 递归 dispose：显存生命周期

```ts
function disposeScene(scene: THREE.Scene) {
  scene.traverse((obj) => {
    if (obj instanceof THREE.Mesh) {
      obj.geometry.dispose()
      const materials = Array.isArray(obj.material) ? obj.material : [obj.material]
      materials.forEach((m) => {
        Object.values(m).forEach((v) => { if (v instanceof THREE.Texture) v.dispose() })
        m.dispose()
      })
    }
  })
  if (scene.background instanceof THREE.Texture) scene.background.dispose()
}
```

卸载顺序：`cancelAnimationFrame` → 移除 resize 监听 → `handle.dispose()`（控制器/Helper）
→ `disposeScene(scene)` → `renderer.dispose()` → `renderer.domElement.remove()`。

::: tip StrictMode 是最好的测试用例
`React.StrictMode` 会故意双跑 effect。如果清理不完整，你会立刻看到**两个 canvas** 或显存持续上涨。
开发期就开着它，能把泄漏问题提前暴露。
:::

## TypeScript 的两个坑

- `import type * as THREE from 'three'` 只能用于类型标注，**不能当运行时值**用
  （写 `THREE.PCFSoftShadowMap` 会报错）。解决办法就是上文 `SceneContext` 注入的 `THREE` 命名空间。
- Vite 配置里把 `.tsx` 放在无扩展名 import 的解析首位，避免同名 `.jsx` 历史文件被优先命中。

## 一个进阶优化点

多个 Mesh 共享同一份 geometry/material 时，`scene.traverse` 会对同一资源 `dispose()` 多次。
three.js 对重复 dispose 基本无害，但生产项目建议用 `Set` 去重或引入引用计数。

## 自测

1. 为什么 effect 依赖要写成 `[]`，同时还要 `setupRef`？
2. 滑块改变后 `light.intensity` 为什么不会自动更新？
3. 切页后显存上涨，卸载链里少了哪几步？
4. `import type * as THREE` 能不能 `new THREE.Mesh()`？

---

[返回学习地图](./index.md) · 上一篇：[综合实战](./06-drone-project.md) · 下一篇：[进阶与排错](./08-advanced-troubleshooting.md)
