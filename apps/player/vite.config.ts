// apps/player/vite.config.ts
// Slidev 官方约定：可在此覆盖 Vite 配置（见 sli.dev/custom/config-vite）。
// 仅放开 allowedHosts，便于容器/局域网访问播放器；不引入自定义 UI。
// 注意：Vite 6+ 的 allowedHosts:true 存在 bug（vitejs/vite#19242），故显式列出。
import { defineConfig } from 'vite';

export default defineConfig({
  server: {
    allowedHosts: ['host.docker.internal', 'localhost', '0.0.0.0'],
  },
});
