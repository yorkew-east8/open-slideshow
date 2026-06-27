// server/slidev-runner.ts — 以子进程拉起 Slidev 官方 CLI，入口固定 active.md
// 用官方 @slidev/cli（apps/player 内安装），保证“播放器只用官方代码”（AGENTS.md §2）
import { spawn } from 'node:child_process';
import { join } from 'node:path';
import { config } from './config.js';

export function startSlidev(): Promise<void> {
  const playerDir = join(config.rootDir, 'apps', 'player');
  const entry = join(config.slidesDir, config.activeFile);
  // 直接用 player 内安装的 @slidev/cli 的 bin，避免 npx 走注册表
  const slidevBin = join(playerDir, 'node_modules', '.bin', 'slidev');

  return new Promise((resolveP, rejectP) => {
    const args = [
      entry,
      '--port',
      String(config.slidevPort),
      '--remote', // 允许容器外访问
    ];
    const child = spawn(slidevBin, args, {
      cwd: playerDir,
      env: { ...process.env, HOST: '0.0.0.0' },
      stdio: ['ignore', 'pipe', 'pipe'],
    });
    child.stdout?.on('data', (d) => process.stdout.write(`[slidev] ${d}`));
    child.stderr?.on('data', (d) => process.stderr.write(`[slidev] ${d}`));
    child.on('error', rejectP);
    child.on('exit', (code) => {
      if (code !== 0 && code !== null) {
        rejectP(new Error(`slidev exited with ${code}`));
      }
    });
    // 不阻塞等待完全 ready，给一点时间让它起来
    setTimeout(() => resolveP(), 3000);
  });
}
