# 单镜像多阶段构建（architecture.md §7）
# 两 stage：
#   build   —— 装依赖 + 构建首页 + lint/test 质量门禁（与构建同 stage）
#   runtime —— 运行时：同一进程托管首页静态 + 文件 API + Slidev
#
# 缓存优化：
#   1. BuildKit cache mount 持久化 pnpm store（删镜像不丢缓存）
#   2. 依赖层独立 —— 代码变更不触发 pnpm install
#   3. lint/test 与构建同 stage，实测合计 <3s（相对 build 的 ~48s 可忽略），
#      无需独立 verify stage，避免多余镜像与配置

########## deps + build ##########
FROM node:22-alpine AS build
WORKDIR /app
# alpine 需要 git 用于部分依赖；python3/make/g++ 用于原生模块（Slidev/esbuild 等）
RUN apk add --no-cache git python3 make g++ && corepack enable && corepack prepare pnpm@9.12.0 --activate

# 先装依赖（仅依赖 package.json/lockfile，代码变更此层命中缓存）
COPY package.json pnpm-workspace.yaml pnpm-lock.yaml ./
COPY apps/home/package.json apps/home/
COPY apps/player/package.json apps/player/
COPY server/package.json server/
RUN --mount=type=cache,id=pnpm-store,target=/root/.local/share/pnpm/store \
    pnpm install --frozen-lockfile

# 拷源码 + 配置，构建首页
COPY apps/home apps/home
COPY apps/player apps/player
COPY server server
COPY tests tests
COPY tsconfig.base.json eslint.config.js vitest.config.ts .prettierrc .prettierignore ./
RUN pnpm --filter home build

# 质量门禁：与构建同 stage，依赖/源码变更时自动重跑
RUN pnpm lint && pnpm format && pnpm test

########## runtime ##########
FROM node:22-alpine AS runtime
WORKDIR /app
RUN apk add --no-cache git && corepack enable && corepack prepare pnpm@9.12.0 --activate

# 复制运行所需：首页产物 + player（含 slidev）+ server（含 tsx）
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/apps/home/dist ./apps/home/dist
COPY --from=build /app/apps/player/node_modules ./apps/player/node_modules
COPY --from=build /app/server/node_modules ./server/node_modules
COPY package.json pnpm-workspace.yaml ./
COPY apps/player ./apps/player
COPY server ./server
COPY apps/home/package.json ./apps/home/package.json

# 默认幻灯片库（可被卷覆盖）
COPY user-slides ./user-slides

ENV HOME_PORT=8080 \
    SLIDEV_PORT=3030 \
    SLIDES_DIR=/app/user-slides \
    DEFAULT_THEME=default \
    HISTORY_LIMIT=20

EXPOSE 8080 3030
CMD ["pnpm", "--filter", "open-slideshow-server", "start"]
