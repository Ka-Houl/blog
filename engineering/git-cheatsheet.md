---
title: Git 场景化速查
description: 按「我要做什么」组织的 Git 命令：初始化、提交、撤销、分支、历史排查、远程协作与踩坑。
---

# Git 场景化速查

> 按场景查，不按命令背。默认分支为 `main`，提交前先看 `git status`。

## 日常

| 场景 | 命令 |
| --- | --- |
| 初始化 / 克隆 | `git init` · `git clone <url>` |
| 看改动 | `git status` · `git diff` · `git diff --staged` |
| 提交 | `git add -p`（逐块暂存）→ `git commit -m "type: 简述"` |
| 补上一次提交 | `git commit --amend --no-edit`（**仅限未推送的提交**） |
| 同步 | `git pull --rebase` · `git push origin main` |
| 临时收起 | `git stash push -m "wip"` → `git stash pop` |

## 撤销：先分清「改到哪一步了」

| 想撤销什么 | 命令 | 风险 |
| --- | --- | --- |
| 工作区未暂存的修改 | `git restore <file>` | 改动丢失，不可恢复 |
| 已 `git add` 的暂存 | `git restore --staged <file>` | 只退暂存，保留改动 |
| 最近一次提交（保留改动） | `git reset --soft HEAD~1` | 安全 |
| 最近一次提交（丢弃改动） | `git reset --hard HEAD~1` | ⚠️ 破坏性，先确认 |
| 已推送的错误提交 | `git revert <sha>` | 生成反向提交，不改写历史，协作首选 |

::: warning 三条纪律
1. `reset --hard` / `push --force` 前先 `git status` 并确认没有未提交工作。
2. 已共享的分支**不要改写历史**，用 `revert`。
3. 真的丢了提交也别慌：`git reflog` 通常能找回 HEAD 的历史位置。
:::

## 分支与合并

```bash
git switch -c feat/xxx          # 新建并切换
git switch main                 # 切回
git merge feat/xxx              # 保留分叉历史的合并
git rebase main                 # 把当前分支提交挪到 main 之上，历史线性
git rebase -i HEAD~3            # 交互式整理提交（squash / reword / drop）
git cherry-pick <sha>           # 只摘一个提交到当前分支
```

| | merge | rebase |
| --- | --- | --- |
| 历史 | 保留真实分叉，有合并节点 | 线性、干净 |
| 适用 | 公共分支、多人协作 | 个人特性分支整理（未推送） |
| 代价 | 图较复杂 | 改写提交 SHA，推送需谨慎 |

## 排查历史

| 场景 | 命令 |
| --- | --- |
| 图形化看历史 | `git log --oneline --graph --decorate --all` |
| 找某行是谁改的 | `git blame <file>` |
| 找引入 bug 的提交 | `git bisect start` → `bisect bad` / `bisect good <sha>` |
| 找某段代码的提交 | `git log -S "关键词" --oneline` |
| 看某次提交内容 | `git show <sha>` |
| 找回误删提交 | `git reflog` → `git switch -c recover <sha>` |

## 远程协作

```bash
git remote -v
git fetch --all --prune                  # 同步远端并清理已删除的分支引用
git branch -vv                          # 查看本地分支与上游追踪关系
git push -u origin feat/xxx              # 首次推送并设置 upstream
git push origin --delete feat/xxx        # 删除远端分支
```

## 常见踩坑

| 现象 | 原因 / 处理 |
| --- | --- |
| `pull` 产生一堆 merge commit | 本地与远端都提交了；改用 `git pull --rebase` |
| 提交里混了密钥 | 立刻**轮换密钥**，再用 `git filter-repo` 清理历史；仅删文件无效 |
| 换行符满屏 diff | 统一 `.gitattributes` / `core.autocrlf`（Windows 团队尤其常见） |
| 中文文件名乱码 | `git config core.quotepath false`（仅显示层） |
| 大文件把仓库撑爆 | 用 `.gitignore` + Git LFS，别直接 `git add .` |
| 想改上次提交信息但已推送 | 别 amend；新建一次修正提交或直接接受 |

## 提交信息约定

```
<type>: <一句话说明动机与结果>

type: feat | fix | docs | refactor | test | chore | perf
```

重点写**为什么**，而不是「改了哪个文件」——后者 `git show` 已经告诉你了。

---

[返回工程实践](./index.md) · [AI 编程工作流](./ai-coding-workflow.md)
