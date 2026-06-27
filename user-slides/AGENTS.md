# AGENTS.md — 编写幻灯片指南（user-slides/）

> 本目录是用户的幻灯片库。Agent（AI 助手）在此创建/编辑 `.md` 幻灯片时遵循本指南。
> 播放由 Slidev 渲染，因此内容需符合 Slidev 的 Markdown 语法。

## 1. 合法性（否则会被校验拦截，需用户强制打开）

至少满足其一：

- 含至少一个 `---` 分页符（用于分隔幻灯片页）。
- frontmatter 含 `theme` 或 `layout` 字段。

> 推荐：始终写 frontmatter + 用 `---` 分页，最稳妥。

## 2. 文件骨架（模板）

````md
---
theme: seriph
title: 我的演讲
---

# 标题页

副标题或演讲者

---

## 第二页内容

- 要点一
- 要点二

---

## 代码 / 图

```mermaid
flowchart LR
  A --> B
```
````

````

## 3. 关键语法速查

| 需求 | 写法 |
|------|------|
| 分页 | 独立一行 `---` |
| 单页布局 | frontmatter 加 `layout: two-cols`（cover/center/two-cols/image-right/quote/section/end） |
| 全局主题 | frontmatter `theme: seriph`（首页风格选择会覆盖此值） |
| 演讲者备注 | `<!-- 备注内容 -->`（HTML 注释） |
| 代码高亮 | ` ```js ` 代码块 |
| 代码逐步高亮 | ` ```js {1|2-3|all} ` |
| Mermaid 图 | ` ```mermaid ` 代码块 |
| 单页自定义样式 | 页内 `<style>...</style>` |

## 4. 规范

- 文件名：kebab-case，`.md` 结尾，如 `tech-talk.md`。
- 首页风格选择会注入 frontmatter 的 `theme`，**不要**硬写死主题（写了也会被覆盖）。
- 静态资源放 `apps/player/public/` 引用，或用外链。
- 单页内容不宜过多（Slidev 单页不自动分页）。

## 5. 本目录文件示例

- `welcome.md`：内置示例片，演示分页、Mermaid、双栏。
- 你新建的文件会被首页自动列出（读取 `user-slides/`）。

## 6. 不要做的事

- 不要把代码/组件放本目录（本目录只放 `.md` 与本指南）。
- 不要放超过 ~20MB 的大资源（会拖慢上传与播放）。
````
