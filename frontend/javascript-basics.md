---
title: JavaScript 核心知识
description: 类型与判等、事件循环、闭包与原型、异步、模块化与常见工程陷阱的系统化速查。
---

# JavaScript 核心知识

## 类型与判等

| 类别 | 值 |
| --- | --- |
| 基本类型 | `string` / `number` / `boolean` / `null` / `undefined` / `symbol` / `bigint` |
| 引用类型 | `object`（含 array、function、date、regexp…） |

```js
typeof null          // 'object'（历史遗留）
[] == false          // true（隐式转换，别用 ==）
Object.is(NaN, NaN)  // true；NaN === NaN 为 false
0 === -0             // true；Object.is(0, -0) 为 false
```

**工程约定**：一律 `===`；需要区分 `NaN` 或 `±0` 时用 `Object.is()`；
判空数组用 `Array.isArray(v) && v.length === 0`。

## 作用域、闭包与 this

```js
function counter() {
  let n = 0                 // 闭包捕获的是变量，不是值的拷贝
  return () => ++n
}
const next = counter()
next(); next()              // 1, 2
```

| 概念 | 一句话 |
| --- | --- |
| 作用域链 | 变量查找沿词法作用域向外，定义时确定，不是调用时 |
| 闭包 | 函数与其捕获的词法环境；用于私有状态、柯里化、缓存，也可能造成内存不释放 |
| `this` | 普通函数由**调用方式**决定；箭头函数捕获外层 `this` |
| 原型链 | 对象属性找不到时沿 `[[Prototype]]` 向上查，终点 `null` |
| `var` / `let` / `const` | 函数作用域 + 提升 / 块作用域 + TDZ / 块作用域 + 绑定不可重赋 |

## 事件循环：宏任务与微任务

```js
console.log(1)
setTimeout(() => console.log(2))
Promise.resolve().then(() => console.log(3))
console.log(4)
// 输出：1 4 3 2
```

执行顺序：**同步栈 → 清空微任务队列 → 取一个宏任务 → 渲染 → 再清空微任务**。

| 队列 | 典型来源 |
| --- | --- |
| 微任务 | `Promise.then/catch/finally`、`queueMicrotask`、`MutationObserver` |
| 宏任务 | `setTimeout`、`setInterval`、I/O、事件回调、`MessageChannel` |

```js
async function f() {
  console.log('a')
  await null            // await 之后的部分进入微任务
  console.log('b')
}
f(); console.log('c')   // a c b
```

::: tip 与 AI 应用的连接
流式渲染里「收到 SSE 分片 → setState → 渲染」的顺序问题、
AbortController 取消后的竞态，本质都是这套事件循环 + 微任务模型。
:::

## 异步与错误处理

| 手段 | 适用 |
| --- | --- |
| `Promise.all` | 并行且都要成功，失败即短路 |
| `Promise.allSettled` | 并行且允许部分失败（批量工具调用常用） |
| `Promise.race` | 超时控制、多源竞速 |
| `AbortController` | 取消 fetch / 流 / 模型调用，防止断开后继续烧 token |
| `try/catch + await` | 异步错误必须 `await` 才能被 catch 捕获 |

## 模块化与工程化

- ESM 是**静态**导入（可 tree-shaking、提升、只读绑定）；CommonJS 是运行时 `require`。
- 循环依赖在 ESM 下可能拿到未初始化的绑定（TDZ），优先抽公共模块而不是互相 import。
- `import type`（TS）只存在于编译期，不能当运行时值使用——这个坑在 [Three.js 07 章](./threejs/07-react-integration.md) 也出现过。

## 常见面试追问

1. `typeof null` 为什么是 `'object'`？
2. 宏任务与微任务的执行顺序，浏览器与 Node 有什么差异？
3. 闭包导致内存泄漏的典型场景？（未清理的监听器、缓存、定时器）
4. `Promise.all` 与 `allSettled` 在批量工具调用里怎么选？
5. 箭头函数为什么不能作为构造函数？

---

[返回前端知识地图](./index.md) · 相关：[Three.js 渲染管线](./threejs/01-render-pipeline.md) · [API 与流式](../ai/01-foundation/api-and-streaming.md)
