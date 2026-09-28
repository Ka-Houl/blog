---
title: JavaScript 基础
date: 2026-09-29
---

# JavaScript 基础

## 数据类型

- 基本类型：`string` / `number` / `boolean` / `null` / `undefined` / `symbol` / `bigint`
- 引用类型：`object`（含 `array`、`function` 等）

## 事件循环

宏任务（script、setTimeout）与微任务（Promise.then）的执行顺序：

```js
console.log(1)
setTimeout(() => console.log(2))
Promise.resolve().then(() => console.log(3))
console.log(4)
// 输出：1 4 3 2
```

> 按知识点逐步补充，形成自己的面试复习资料。
