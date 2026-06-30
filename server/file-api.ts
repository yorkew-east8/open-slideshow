// server/file-api.ts — 极薄文件 REST API + 静态托管首页
// 职责边界（AGENTS.md §2）：仅文件 I/O，无业务逻辑、无状态
import { Router } from 'express';
import { readdir, readFile, writeFile, ensureDir } from './fs.js';
import { config } from './config.js';
import { basename, resolve, join } from 'node:path';

export function createFileApi(): Router {
  const r = Router();

  // 列出 user-slides 下的 md（排除 active.md）
  r.get('/api/files', async (_req, res) => {
    await ensureDir(config.slidesDir);
    const names = (await readdir(config.slidesDir))
      .filter((n) => n.endsWith('.md') && n !== config.activeFile && n !== 'AGENTS.md')
      .sort();
    res.json({ files: names });
  });

  // 上传/写入一个 md
  r.post('/api/files', async (req, res) => {
    const { filename, content } = req.body ?? {};
    if (!filename || typeof content !== 'string') {
      return res.status(400).json({ error: 'filename and content required' });
    }
    const safe = sanitize(filename);
    if (!safe) return res.status(400).json({ error: 'invalid filename' });
    await ensureDir(config.slidesDir);
    await writeFile(join(config.slidesDir, safe), content, 'utf8');
    res.json({ filename: safe });
  });

  // 激活：把目标文件写入 active.md，可注入 theme / colorSchema 到 frontmatter
  r.post('/api/activate', async (req, res) => {
    const { filename, theme, colorSchema } = req.body ?? {};
    if (!filename) return res.status(400).json({ error: 'filename required' });
    const srcName = sanitize(filename);
    if (!srcName) return res.status(400).json({ error: 'invalid filename' });
    const srcPath = resolve(config.slidesDir, srcName);
    let raw: string;
    try {
      raw = await readFile(srcPath, 'utf8');
    } catch {
      return res.status(404).json({ error: 'file not found' });
    }
    // 安全：theme / colorSchema 来自不可信请求体，会被拼入 YAML frontmatter。
    // 必须用白名单校验，非法值回退默认，防止注入任意 YAML 键（CWE-74）。
    const safeTheme =
      typeof theme === 'string' && config.installedThemes.includes(theme)
        ? theme
        : config.defaultTheme;
    const safeColorSchema =
      typeof colorSchema === 'string' &&
      (config.colorSchemas as readonly string[]).includes(colorSchema)
        ? colorSchema
        : config.defaultColorSchema;
    const out = injectTheme(raw, safeTheme, safeColorSchema);
    await writeFile(join(config.slidesDir, config.activeFile), out, 'utf8');
    res.json({ ok: true, theme: safeTheme, colorSchema: safeColorSchema });
  });

  // 已安装主题
  r.get('/api/themes', (_req, res) => {
    res.json({
      themes: config.installedThemes,
      default: config.defaultTheme,
    });
  });

  // 暴露前端需要的运行配置（端口、历史上限），避免构建期写死
  r.get('/api/config', (_req, res) => {
    res.json({
      slidevPort: config.slidevPort,
      historyLimit: config.historyLimit,
    });
  });

  // 调试/健康
  r.get('/api/health', (_req, res) => res.json({ ok: true }));
  return r;
}

function sanitize(name: string): string | null {
  const b = basename(name).trim();
  if (!b || b.includes('..') || b.includes('/') || b.includes('\\')) return null;
  if (!b.endsWith('.md')) return null;
  return b;
}

// 把 theme / colorSchema 注入 frontmatter（首页风格选择覆盖文件内值，对齐 use-cases UC-5）
// 注意：调用方必须先用白名单校验 theme / colorSchema，本函数不做转义，仅做受控字符串拼接。
export function injectTheme(raw: string, theme: string, colorSchema: string): string {
  if (raw.startsWith('---')) {
    // 已有 frontmatter：替换或追加 theme: / colorSchema:
    const end = raw.indexOf('\n---', 3);
    if (end !== -1) {
      let head = raw.slice(0, end);
      const body = raw.slice(end);
      if (/^\s*theme\s*:/m.test(head)) {
        head = head.replace(/^\s*theme\s*:.*$/m, `theme: ${theme}`);
      } else {
        head = `${head.trimEnd()}\ntheme: ${theme}\n`;
      }
      if (/^\s*colorSchema\s*:/m.test(head)) {
        head = head.replace(/^\s*colorSchema\s*:.*$/m, `colorSchema: ${colorSchema}`);
      } else {
        head = `${head.trimEnd()}\ncolorSchema: ${colorSchema}\n`;
      }
      return head + body;
    }
  }
  // 无 frontmatter：补一个
  return `---\ntheme: ${theme}\ncolorSchema: ${colorSchema}\n---\n${raw}`;
}
