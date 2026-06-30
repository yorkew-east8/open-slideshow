# 架构设计（Architecture）

> 本文档描述 `open-slideshow` 的整体架构、进程模型、模块边界与数据流。
> 面向开发者/Agent。用户使用方式见根目录 `README.md`。

## 1. 设计目标（对齐需求）

- **输入 Markdown → 浏览器渲染幻灯片 → 选片 → 演讲**。
- 单仓库（all-in-one）、单镜像、无外部数据库、无后端服务依赖。
- 播放器尽量复用 Slidev 官方代码；扩展点（如“返回首页”按钮）走官方推荐的 `global-bottom.vue` 等约定文件，便于随官方升级。
- 用户运行态数据存浏览器（localStorage）；初始化配置放 `.env`。
- 风格（theme）可方便扩展。

## 2. 核心架构决策（Development Step 1 产出）

| 决策点           | 选择                                                                           | 理由                                                                       |
| ---------------- | ------------------------------------------------------------------------------ | -------------------------------------------------------------------------- |
| 镜像/端口模型    | **方案 A：单镜像、双端口**，一个 Node 进程同时托管首页(8080) 与 Slidev(3030)   | 满足“一个镜像”，进程内多 server 是 Docker 常见做法；不引入 iframe 跨源风险 |
| 文件选择         | **方案 i：首页列服务端 `user-slides/` 目录 + 上传落地**                        | 浏览器沙箱无法读任意本地路径；落到可配置目录后可持久化、可缓存历史         |
| 幻灯片合法性校验 | 含至少一个 `---` 分页符，或 frontmatter 含 `theme`/`layout`                    | Slidev 无严格“合法性”定义，采用轻量启发式，并允许用户强制打开              |
| 预装主题         | `default` / `seriph` / `apple-basic` / `bricks` / `shibainu`                   | 官方主题全覆盖（@slidev/theme-*），满足“至少 1 种 + 可扩展”，控制镜像体积 |
| 配置             | `.env`：`SLIDES_DIR / HOME_PORT / SLIDEV_PORT / DEFAULT_THEME / HISTORY_LIMIT` | 单一配置入口                                                               |
| 返回首页方式     | 幻灯片新标签播放，关闭标签即回首页                                             | 玩家保持官方纯净，不注入自定义按钮                                         |

## 3. 仓库结构

```
open-slideshow/
├── .env                            # 初始化配置（提交 .env.example）
├── .env.example
├── Taskfile.yaml                   # build / lint / test / playground
├── Dockerfile                      # 多阶段构建 → 单镜像
├── docker-compose.yml              # playground/本地启动（卷挂载 user-slides）
├── package.json                    # workspace 根（pnpm/npm workspaces）
├── docs/
│   ├── architecture.md             # 本文件
│   └── use-cases.md                # 用例
├── AGENTS.md                       # 根：架构边界 + 开发规范（面向 Agent）
├── README.md                       # 面向用户
├── apps/
│   ├── home/                       # 首页 Vue 应用（文件列表 + 风格选择 + 开始播放）
│   │   ├── index.html
│   │   ├── package.json
│   │   └── src/
│   │       ├── main.ts
│   │       ├── App.vue
│   │       ├── components/
│   │       │   ├── HistoryList.vue       # 左侧历史播放列表
│   │       │   ├── ThemeSelector.vue     # 右侧风格选择
│   │       │   └── FileOpener.vue        # 打开新文件（上传 + 校验）
│   │       ├── lib/
│   │       │   ├── api.ts                # 调 server 文件 API
│   │       │   ├── history.ts            # localStorage 历史管理
│   │       │   └── validate.ts           # 幻灯片格式校验
│   │       └── vite.config.ts
│   └── player/                     # Slidev 项目（仅官方约定文件 + config）
│       ├── package.json            # @slidev/cli + 主题 + vite（config 需要）
│       ├── slides.md               # 开发期占位入口
│       ├── active.md               # 运行时播放入口（gitignore，activate 写入）
│       └── vite.config.ts          # 官方约定配置：放开 server.allowedHosts
│                                   # 不注入 global-*.vue：玩家保持官方纯净
├── server/                         # 极薄 Node 服务：文件列表/读取/写入 + 拉起 Slidev
│   ├── package.json
│   ├── index.ts                    # 入口：启动 file API(8080) + Slidev(3030)
│   ├── file-api.ts                 # REST: GET /api/files, POST /api/files, POST /api/activate
│   ├── slidev-runner.ts            # 以子进程拉起 @slidev/cli，入口指向 active.md
│   ├── seed.ts                     # 启动时确保 active.md 存在
│   ├── fs.ts                       # fs 薄封装
│   └── config.ts                   # 读取 .env
├── user-slides/                    # 幻灯片库（可配置），挂载卷；仅放 .md
│   ├── AGENTS.md                   # 给 Agent 写幻灯片的指南
│   └── *.md                        # 用户幻灯片
└── tests/
    ├── unit/                       # 校验器/历史 等纯函数单测
    ├── setup.ts                    # Node 25 localStorage shim
    └── e2e/                        # playwright（首页→选片→播放）
```

> 责任边界说明见 `AGENTS.md`。

## 4. 进程模型（运行时）

```
┌───────────────────────────────────────────────────────┐
│  单个 Docker 容器（一个镜像）                            │
│                                                       │
│  Node 主进程 (server/index.ts)                         │
│  ├── HTTP File API  ───────► :8080  (首页 + 文件操作)  │
│  │     GET  /api/files           列出 user-slides/      │
│  │     POST /api/files           上传/写入 md           │
│  │     POST /api/activate        选定 active 幻灯片     │
│  │     静态托管 apps/home 构建产物                       │
│  │                                                     │
│  └── Slidev dev server ─────► :3030 (播放器)           │
│        入口: apps/player/active.md                    │
│        （userRoot=apps/player，加载同目录 vite.config.ts） │
└───────────────────────────────────────────────────────┘
            ▲                              ▲
            │ 浏览器                        │ 点击“开始播放”新开标签
            │ localhost:8080                │ localhost:3030
```

- **首页（8080）**：用户选片入口。localStorage 记录最近常用（按时间倒序）。
- **播放（3030）**：Slidev 官方 dev server，入口固定指向 `apps/player/active.md`。
  - 放在 `apps/player/` 内：Slidev 把 `dirname(entry)` 当作 `userRoot`，从而加载同目录 `vite.config.ts`（放开 `server.allowedHosts`，支持容器/局域网访问）。
- **激活流程**：用户在首页点某个文件 → 前端调 `POST /api/activate` → server 把目标文件内容写入 `apps/player/active.md`（注入 theme frontmatter）→ Slidev HMR 自动刷新 → 前端打开 `:3030`。

## 5. 数据流

### 5.1 历史列表（localStorage）

```ts
type HistoryItem = {
  filename: string; // user-slides 下的相对文件名
  openedAt: number; // ms 时间戳
  timesOpened: number;
};
```

- 首页左侧按 `openedAt` 倒序展示。
- 上限 `HISTORY_LIMIT`（默认 20）。
- 仅存元数据，不存内容（文件在磁盘）。

### 5.2 打开新文件 + 校验

```
[选本地 .md] → [FileOpener 上传] → POST /api/files → server 写入 user-slides/
            → [前端 validate.ts 校验]
              ├─ 合法：加入历史 + 提示可播放
              └─ 非法：展示原因（如“未发现 --- 分页符”），允许“强制打开”
```

### 5.3 风格选择

- 首页右侧下拉列出**已安装**的主题（`default` / `seriph` / `apple-basic` / `bricks` / `shibainu`，及未来扩展），并提供「浅色 / 深色」配色开关（默认浅色，不随系统）。
- 选定后，`POST /api/activate` 时一并把 `theme` 与 `colorSchema` 写入 `active.md` 的 frontmatter。
- 扩展：在 `apps/player/package.json` 增依赖 + `server/config.ts` 同步 `installedThemes` 即可，首页通过 `GET /api/themes` 动态读取。

## 6. 扩展点（随官方升级友好）

| 扩展               | 官方约定                      | 本项目位置                             |
| ------------------ | ----------------------------- | -------------------------------------- |
| （暂无自定义扩展） | —                             | 玩家保持官方纯净；如需可按官方约定新增 |
| 主题               | `theme:` frontmatter / npm 包 | `apps/player/package.json`             |
| Vue app 配置       | `setup/main.ts`（按需）       | `apps/player/setup/main.ts`（未启用）  |

> 当前决策：幻灯片在新标签播放，关闭即回首页，故**不**注入任何自定义全局层文件，保持玩家可零成本随官方升级。

## 7. 非功能约束的实现

- **无数据库**：localStorage（历史）+ 文件系统（user-slides/）。
- **配置**：`.env`（见 §2）。
- **单镜像**：`Dockerfile` 多阶段，构建首页产物 + 安装 Slidev，运行时单进程。
- **task 命令**：`Taskfile.yaml` 定义 `build / lint / test / playground`。
- **本地零依赖**：所有构建/运行在 Docker；开发可用本地 Node 直接 `task`。

## 8. 开放/后续

- 主题热插拔：当前首页列已安装主题；未来可加“在线安装主题”。
- 多实例隔离：当前单 active.md；未来可按文件名路由多个 Slidev 实例。
