# 使用官方 Playwright 镜像（已预装 Chromium，避免 alpine 依赖问题）
FROM mcr.microsoft.com/playwright:v1.49.0-noble
WORKDIR /work
RUN npm init -y && npm install -D @playwright/test@1.49.0
COPY home.spec.ts ./
COPY playwright.config.ts ./
CMD ["npx", "playwright", "test", "--reporter=line"]
