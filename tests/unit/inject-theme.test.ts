import { describe, it, expect } from 'vitest';
import { injectTheme } from '../../server/file-api';

describe('injectTheme', () => {
  it('已有 frontmatter 含 theme/colorSchema 时替换为白名单主题值', () => {
    const raw = `---\ntheme: default\ncolorSchema: dark\n---\n\n# 标题`;
    expect(injectTheme(raw, 'seriph', 'light')).toBe(
      `---\ntheme: seriph\ncolorSchema: light\n---\n\n# 标题`,
    );
  });

  it('已有 frontmatter 但无 theme/colorSchema 时追加 theme 与 colorSchema 行', () => {
    const raw = `---\ntitle: 演示\n---\n\n# 标题`;
    // 两次追加分支：head.trimEnd() + '\ntheme: seriph\n' 后，
    // 再次 trimEnd() + '\ncolorSchema: dark\n'，最后拼回以 '\n---' 开头的 body。
    expect(injectTheme(raw, 'seriph', 'dark')).toBe(
      `---\ntitle: 演示\ntheme: seriph\ncolorSchema: dark\n\n---\n\n# 标题`,
    );
  });

  it('无 frontmatter 时补一个', () => {
    const raw = `# 标题\n\n内容`;
    expect(injectTheme(raw, 'default', 'light')).toBe(
      `---\ntheme: default\ncolorSchema: light\n---\n# 标题\n\n内容`,
    );
  });

  it('即便 theme/colorSchema 含换行等特殊字符，也只是被原样写入字符串（注入由调用方白名单兜底）', () => {
    // 该测试记录「函数本身不做转义」这一约定：注入防护依赖白名单，不依赖本函数。
    // 调用方（/api/activate）只允许 config.installedThemes / config.colorSchemas 内的值传入。
    const raw = `---\ntheme: default\ncolorSchema: light\n---\n\n# 标题`;
    const malicious = 'default\nlayout: evil';
    const out = injectTheme(raw, malicious, malicious);
    // 字面拼接行为：恶意内容会出现在 theme: / colorSchema: 行后。这正说明白名单校验必须在调用前完成。
    expect(out).toContain(`theme: ${malicious}`);
    expect(out).toContain(`colorSchema: ${malicious}`);
  });
});
