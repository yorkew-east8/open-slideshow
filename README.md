# Open Slideshow

[English](./README.en.md)

输入 Markdown → 浏览器渲染幻灯片 → 选片 → 演讲。基于 [Slidev](https://sli.dev)，单镜像、无数据库、配置走 `.env`。

## 快速开始

需要：Docker（推荐）或本地 Node 22+。

### 方式一：Docker（推荐，零本地依赖）

```bash
cp .env.example .env
task playground:up
```

打开浏览器：

- 首页：http://localhost:8080
- 播放器（点首页「开始播放」后自动新开）：http://localhost:3030

后台运行：`task playground:up-detached`；停止：`task playground:down`。

### 方式二：本地开发

```bash
pnpm install
# 终端1：首页（vite dev，:5173，自动代理 /api 到 :8080）
pnpm dev:home
# 终端2：server + 播放器
pnpm --filter open-slideshow-server dev
```

## 使用方法

1. 打开首页 `:8080`。
2. **打开新文件**（左下「+ 打开新文件」）：选择本地 `.md`。系统自动校验是否为幻灯片格式，非法会给出原因并允许「强制打开」。
3. **选片**：在左侧历史列表或「库中其他文件」点击选中。
4. **选风格**：右侧下拉（默认随官方）。
5. **开始播放**：底部按钮，新标签全屏播放；关闭标签即回首页。
6. 历史列表按最近打开时间倒序，浏览器本地缓存。

## 幻灯片写法

把 `.md` 放进 `user-slides/` 目录（会被自动列出），或通过首页「打开新文件」上传。

- 用 `---` 分页。
- frontmatter 可写 `theme`（会被首页风格选择覆盖）、`layout` 等。
- 支持 Mermaid、代码高亮、双栏布局等 Slidev 全部能力。

写片规范见 `user-slides/AGENTS.md`，示例见 `user-slides/welcome.md`。

### 推荐：用 Coding Agent 来写幻灯片

仓库内置了 [`skills/write-slides/SKILL.md`](./skills/write-slides/SKILL.md) 这个写片技能，为Coding Agent 提供了编写幻灯片的步骤，以及好的幻灯片的规范。可以根据自己的偏好调整。

为兼容多个工具，仓库提供两个指向 `skills/` 的目录级软链（相对路径，克隆后即可用）：
- `.claude/skills/` ← Claude Code 读取
- `.agents/skills/` ← Codex 读取（OpenCode 同时读取 `.claude/` 与 `.agents/`）

开始写片只需在仓库根目录对 Agent 说一句，例如：

```text
帮我写一份关于「X」的幻灯片，听众是 Y，目的是 Z。梗概是...，大约 n 页。
```

Agent 会依次：① 读 `user-slides/AGENTS.md` 了解写片规范 → ② 与你对齐听众与逐页大纲 → ③ 填充内容 → ④ 落地到 .md文件。完成后在首页选中该文件即可播放。

> 也可手动写片：直接把符合上述规范的 `.md` 放进 `user-slides/` 即可。

## 配置（.env）

| Key             | 默认          | 说明         |
| --------------- | ------------- | ------------ |
| `SLIDES_DIR`    | `user-slides` | 幻灯片库目录 |
| `HOME_PORT`     | `8080`        | 首页端口     |
| `SLIDEV_PORT`   | `3030`        | 播放器端口   |
| `DEFAULT_THEME` | `default`     | 默认主题     |
| `HISTORY_LIMIT` | `20`          | 历史列表上限 |

## 风格扩展

预装 `default` + `seriph`。新增主题：在 `apps/player/package.json` 加依赖后重新 `task build`，首页风格列表会自动暴露。

## 命令（task）

| 命令                          | 作用                                       |
| ----------------------------- | ------------------------------------------ |
| `task build`                  | 构建镜像（lint/test 质量门禁内置，Docker 内） |
| `task playground:up`          | 构建并启动容器（前台，首页 :8080，播放 :3030） |
| `task playground:up-detached` | 后台启动                                   |
| `task playground:down`        | 停止容器                                   |
| `task logs`                   | 查看 playground 日志                       |
| `task e2e`                    | 用 playwright 镜像跑 e2e（需先 `playground:up-detached`） |

> 本地 lint / format / test（非 Docker）可分别用 `pnpm lint` / `pnpm format` / `pnpm test`。

## 镜像说明

多阶段构建（详见 `Dockerfile`）：

- **build**：装依赖（pnpm，BuildKit cache mount 持久化 pnpm store）+ 构建首页 + lint/test 质量门禁（与构建同 stage，实测合计 <3s）。
- **runtime**：单 Node 进程托管首页静态产物 + 文件 API + Slidev 播放器；`user-slides/` 作为默认幻灯片库，可被卷（`./user-slides:/app/user-slides`）覆盖。

默认环境变量：`HOME_PORT=8080`、`SLIDEV_PORT=3030`、`SLIDES_DIR=/app/user-slides`、`DEFAULT_THEME=default`、`HISTORY_LIMIT=20`。

## 架构

详见 `docs/architecture.md`、`docs/use-cases.md`、`AGENTS.md`。

一句话：单镜像内一个 Node 进程托管「首页静态 + 文件 API」(`:8080`) 与「Slidev 播放器」(`:3030`)；用户数据存浏览器 localStorage，幻灯片文件存 `user-slides/`。
