# AGENTS.md — 面向 Agent 的架构边界与开发规范

> 本文件定义 `open-slideshow` 各模块位置/职责与开发规范。任何 Agent（含 AI 编程助手）改动本仓库前必读。
> 用户向文档见 `README.md`；架构细节见 `docs/architecture.md`；用例见 `docs/use-cases.md`。

## 1. 一句话定位

输入 Markdown → 首页选片 → Slidev 播放演讲。单镜像、无后端服务依赖、配置走 `.env`、运行态数据走浏览器 localStorage。

## 2. 架构边界（谁负责什么）

| 模块              | 路径           | 职责                                                              | 不应做                               |
| ----------------- | -------------- | ----------------------------------------------------------------- | ------------------------------------ |
| **首页 App**      | `apps/home/`   | 文件列表 UI、历史(localStorage)、风格选择、文件校验、触发播放     | 不直接渲染幻灯片；不直接读写文件系统 |
| **播放器**        | `apps/player/` | Slidev 官方播放；仅放“官方约定扩展文件”（`global-bottom.vue` 等） | 不放业务逻辑；不改 Slidev 源码       |
| **文件/进程服务** | `server/`      | 文件 API、激活 `active.md`、拉起 Slidev、读 `.env`                | 不含 UI；不存用户态（无 DB）         |
| **幻灯片库**      | `user-slides/` | 用户 md 文件 + `AGENTS.md`（写片指南）                            | 不放代码                             |
| **文档**          | `docs/`        | 架构、用例                                                        | 与代码同步更新                       |

### 边界铁律

1. **播放器只用官方代码**：`apps/player/` 内只允许出现 Slidev 官方文档约定的文件（`slides.md`、`global-top.vue`/`global-bottom.vue`/`custom-nav-controls.vue`、`setup/`、`components/`、`styles/`、`snippets/`、`public/`）。扩展点必须能用一句话说清对应的官方文档来源。
2. **业务逻辑在首页**：校验、历史、风格选择都属于 `apps/home/src/lib/`，**禁止**塞进播放器或 server。
3. **server 极薄**：只做文件 I/O + 进程编排，无状态。

## 3. 目录速查（改动定位）

```
改动“文件校验规则” → apps/home/src/lib/validate.ts
改动“历史存储”     → apps/home/src/lib/history.ts
改动“风格列表”     → apps/home/src/components/ThemeSelector.vue + server(已装主题)
新增主题           → apps/player/package.json 加依赖；server 自动暴露
改动“文件 API”     → server/file-api.ts
改动“启动编排”     → server/index.ts、server/slidev-runner.ts
改动“配置项”       → .env.example + server/config.ts（同步）
```

> 设计决策：玩家保持官方纯净，**不**注入 `global-*.vue` 等自定义全局层。新标签播放、关闭即回首页。如确需自定义扩展，按 Slidev 官方约定文件新增，不要 patch 源码。

## 4. 开发规范

### 4.1 语言与风格

- 仅用 **TypeScript**（前端 Vue 3 `<script setup lang="ts">`；server Node TS）。
- 包管理：pnpm（workspaces）。无 pnpm 时可用 npm，但 lock 优先 pnpm。
- 格式化：Prettier（默认配置）；Lint：ESLint（eslint:recommended + vue3-recommended）。
- 提交信息：Conventional Commits（feat/fix/docs/chore/refactor/test）。

### 4.2 命名与文件粒度

- 组件 PascalCase（`HistoryList.vue`）；lib 函数 camelCase。
- **不过度碎片化**：一个职责一个文件；一个组件文件 < 200 行为宜，否则拆 sub-component 放 `components/`。
- 纯函数（validate/history）放 `lib/`，便于单测。

### 4.3 数据与配置

- 运行态用户数据 → **localStorage**（key 加项目前缀 `os:`，如 `os:history`）。
- 初始化配置 → `.env`（提交 `.env.example`，不提交 `.env`）。
- 配置项变更必须同步：`.env.example` ⇄ `server/config.ts` ⇄ `docs/architecture.md §2`。

### 4.4 Slidev 扩展（升级友好）

- 新增扩展点前，**先查官方文档**（sli.dev）确认是“项目根约定文件”还是“addon”。
- 优先用约定文件（`global-*.vue`、`custom-nav-controls.vue`、`setup/`、`vite.config.ts`），避免 fork/patch 官方源码。
- **当前唯一的约定配置**：`apps/player/vite.config.ts` 仅放开 `server.allowedHosts`（容器/局域网访问）；Slidev 把 `dirname(入口)` 当作 userRoot，故入口 `active.md` 必须与 `vite.config.ts` 同目录。
- 升级 Slidev：改 `apps/player/package.json` 版本 → `task build` → `task test`，验证扩展文件仍被加载。

## 5. 任务命令（Taskfile）

> 设计：build/lint/test/playground 全部在 Docker 内执行，宿主机**无需安装依赖**。lint/test 与首页构建同处 `build` stage（实测合计 <3s，相对构建 ~48s 可忽略），随依赖/源码变更自动重跑，无需独立 verify stage。

| 命令                  | 作用                                                |
| --------------------- | --------------------------------------------------- |
| `task build`          | 构建镜像（lint/test 门禁内置，失败即报错）          |
| `task playground:up`  | 构建 + 启动容器（首页 8080 + 播放 3030）            |
| `task playground:down`| 停止容器                                            |
| `task e2e`            | playwright e2e（Docker 内，需先 playground:up-detached） |

## 6. 写幻灯片

- 语法与目录规范：见 `user-slides/AGENTS.md`。
- 编写**新**幻灯片的完整流程（先对齐听众与大纲 → 再填内容 → 落地文件）：见仓库内 skill `skills/write-slides/SKILL.md`，Agent 接到「写一份新幻灯片」类请求时应遵循该流程。

## 7. Review 自检清单（每次改动后过一遍）

- [ ] 是否触碰了禁止区域（播放器内业务逻辑 / DB）？
- [ ] 扩展点能否对应官方文档来源？
- [ ] 配置项是否三处同步？
- [ ] 纯函数是否有单测？
- [ ] UI 是否保持简洁（首页不堆砌）？
