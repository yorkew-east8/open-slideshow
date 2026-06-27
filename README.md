# Open Slideshow

输入 Markdown → 浏览器渲染幻灯片 → 选片 → 演讲。基于 [Slidev](https://sli.dev)，单镜像、无数据库、配置走 `.env`。

## 快速开始

需要：Docker（推荐）或本地 Node 20+。

### 方式一：Docker（推荐，零本地依赖）

```bash
cp .env.example .env
task playground
```

打开浏览器：

- 首页：http://localhost:8080
- 播放器（点首页「开始播放」后自动新开）：http://localhost:3030

停止：`task stop`

### 方式二：本地开发

```bash
task install
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

| 命令                       | 作用              |
| -------------------------- | ----------------- |
| `task build`               | 构建镜像          |
| `task lint`                | ESLint + Prettier |
| `task test`                | 单元测试          |
| `task playground`          | 启动容器（前台）  |
| `task playground-detached` | 后台启动          |
| `task stop`                | 停止              |
| `task logs`                | 查看日志          |
| `task e2e`                 | playwright e2e    |

## 架构

详见 `docs/architecture.md`、`docs/use-cases.md`、`AGENTS.md`。

一句话：单镜像内一个 Node 进程托管「首页静态 + 文件 API」(`:8080`) 与「Slidev 播放器」(`:3030`)；用户数据存浏览器 localStorage，幻灯片文件存 `user-slides/`。
