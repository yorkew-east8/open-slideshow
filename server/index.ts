// server/index.ts — 进程编排入口：托管首页(8080) + 静态资源 + 文件 API，并拉起 Slidev(3030)
// 单镜像、单进程内多 server（architecture.md §4）
import express from 'express';
import { resolve, join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { existsSync } from 'node:fs';
import { createFileApi } from './file-api.js';
import { startSlidev } from './slidev-runner.js';
import { config } from './config.js';
import { ensureActiveSeed } from './seed.js';

const __file = fileURLToPath(import.meta.url);
const __serverDir = dirname(__file);

async function main() {
  const app = express();
  app.use(express.json({ limit: '20mb' }));

  // 文件 API
  app.use(createFileApi());

  // 静态托管首页构建产物（apps/home/dist）
  const homeDist = resolve(__serverDir, '..', 'apps', 'home', 'dist');
  if (existsSync(homeDist)) {
    app.use(express.static(homeDist));
    app.get('*', (_req, res) => res.sendFile(join(homeDist, 'index.html')));
  } else {
    app.get('/', (_req, res) => res.status(503).send('首页未构建，请先执行 task build'));
  }

  app.listen(config.homePort, '0.0.0.0', () => {
    console.log(`[home] http://localhost:${config.homePort}`);
  });

  // 拉起 Slidev 播放器（先确保 active.md 存在，否则 Slidev 启动报错）
  try {
    await ensureActiveSeed();
    await startSlidev();
    console.log(`[player] http://localhost:${config.slidevPort}`);
  } catch (e) {
    console.error('[player] 启动失败：', e);
  }
}

main();
