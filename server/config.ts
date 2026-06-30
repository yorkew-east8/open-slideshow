// server/config.ts — 读取 .env，集中配置（对齐 AGENTS.md §4.3：配置项变更需三处同步）
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
import { existsSync, readFileSync } from 'node:fs';

const __root = resolve(dirname(fileURLToPath(import.meta.url)), '..');

function loadDotEnv() {
  const envPath = resolve(__root, '.env');
  if (!existsSync(envPath)) return;
  for (const line of readFileSync(envPath, 'utf8').split('\n')) {
    const m = line.match(/^\s*([A-Z_][A-Z0-9_]*)\s*=\s*(.*)\s*$/);
    if (!m) continue;
    const [, key, val] = m;
    if (process.env[key] === undefined) {
      process.env[key] = val.replace(/^['"]|['"]$/g, '');
    }
  }
}
loadDotEnv();

export const config = {
  rootDir: __root,
  // 幻灯片库目录：.env 相对路径 → 相对仓库根；绝对路径保持
  slidesDir: resolve(__root, process.env.SLIDES_DIR || 'user-slides'),
  homePort: Number(process.env.HOME_PORT || 8080),
  slidevPort: Number(process.env.SLIDEV_PORT || 3030),
  defaultTheme: process.env.DEFAULT_THEME || 'default',
  // 默认配色：light / dark（默认浅色，不随系统）
  colorSchemas: ['light', 'dark'] as const,
  defaultColorSchema: 'light',
  historyLimit: Number(process.env.HISTORY_LIMIT || 20),
  // 播放器实际加载的入口文件（固定名，内容动态写入）。
  // 放在 player 目录内，使 Slidev 的 userRoot = apps/player，从而加载同目录的 vite.config.ts。
  activeFile: '../apps/player/active.md',
  // 已安装主题白名单（与 apps/player/package.json 对齐）
  installedThemes: ['default', 'seriph', 'apple-basic', 'bricks', 'shibainu'],
} as const;

export type Config = typeof config;
