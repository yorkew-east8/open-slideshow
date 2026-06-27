// server/seed.ts — 启动时确保 active.md 存在（Slidev 入口必须存在）
// 若不存在，用 user-slides 下第一个 md（优先 welcome.md）作为种子
import { join } from 'node:path';
import { config } from './config.js';
import { readdir, readFile, writeFile, ensureDir } from './fs.js';

export async function ensureActiveSeed(): Promise<void> {
  await ensureDir(config.slidesDir);
  const activePath = join(config.slidesDir, config.activeFile);
  try {
    await readFile(activePath, 'utf8');
    return; // 已存在
  } catch {
    // 不存在，选种子
  }
  const names = (await readdir(config.slidesDir)).filter(
    (n) => n.endsWith('.md') && n !== config.activeFile,
  );
  const seed = names.find((n) => n === 'welcome.md') || names.sort()[0] || null;
  let content = '---\ntheme: default\n---\n\n# Open Slideshow\n\n等待选择幻灯片…\n';
  if (seed) {
    content = await readFile(join(config.slidesDir, seed), 'utf8');
  }
  await writeFile(activePath, content, 'utf8');
}
