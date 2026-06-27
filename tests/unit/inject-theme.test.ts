import { describe, it, expect } from 'vitest';
import { injectTheme } from '../../server/file-api';

describe('injectTheme', () => {
  it('已有 frontmatter 含 theme 时替换为白名单主题值', () => {
    const raw = `---\ntheme: default\n---\n\n# 标题`;
    expect(injectTheme(raw, 'seriph')).toBe(`---\ntheme: seriph\n---\n\n# 标题`);
  });

  it('已有 frontmatter 但无 theme 时追加 theme 行', () => {
    const raw = `---\ntitle: 演示\n---\n\n# 标题`;
    expect(injectTheme(raw, 'seriph')).toBe(
      `---\ntitle: 演示\ntheme: seriph\n---\n\n# 标题`,
    );
  });

  it('无 frontmatter 时补一个', () => {
    const raw = `# 标题\n\n内容`;
    expect(injectTheme(raw, 'default')).toBe(
      `---\ntheme: default\n---\n# 标题\n\n内容`,
    );
  });

  it('即便 theme 含换行等特殊字符，也只是被原样写入字符串（注入由调用方白名单兜底）', () => {
    // 该测试记录「函数本身不做转义」这一约定：注入防护依赖白名单，不依赖本函数。
    // 调用方（/api/activate）只允许 config.installedThemes 内的值传入。
    const raw = `---\ntheme: default\n---\n\n# 标题`;
    const malicious = 'default\nlayout: evil';
    const out = injectTheme(raw, malicious);
    // 字面拼接行为：恶意内容会出现在 theme: 行后。这正说明白名单校验必须在调用前完成。
    expect(out).toContain(`theme: ${malicious}`);
  });
});
