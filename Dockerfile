# 单镜像多阶段构建（architecture.md §7）
# 阶段1: 构建 apps/home 产物
# 阶段2: 运行时 —— 同一进程托管首页静态 + 文件 API + Slidev

########## deps + build ##########
FROM node:22-alpine AS build
WORKDIR /app
# alpine 需要 git 用于部分依赖；python3/make/g++ 用于原生模块（Slidev/esbuild 等）
RUN apk add --no-cache git python3 make g++ && corepack enable && corepack prepare pnpm@9.12.0 --activate

# 先装依赖（利用缓存）
COPY package.json pnpm-workspace.yaml pnpm-lock.yaml ./
COPY apps/home/package.json apps/home/
COPY apps/player/package.json apps/player/
COPY server/package.json server/
RUN pnpm install --frozen-lockfile

# 构建首页
COPY apps/home apps/home
COPY tsconfig.base.json ./
RUN pnpm --filter home build

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
