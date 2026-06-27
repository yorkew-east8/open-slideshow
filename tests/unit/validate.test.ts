import { describe, it, expect } from 'vitest';
import { validateSlideMarkdown } from '../../apps/home/src/lib/validate';

describe('validateSlideMarkdown', () => {
  it('拒绝空文件', () => {
    expect(validateSlideMarkdown('').ok).toBe(false);
    expect(validateSlideMarkdown('   \n  ').ok).toBe(false);
  });

  it('拒绝过短内容', () => {
    expect(validateSlideMarkdown('hi').ok).toBe(false);
  });

  it('接受含分页符 --- 的内容', () => {
    const md = `# 第一页\n\n内容A\n\n---\n\n## 第二页\n\n内容B`;
    expect(validateSlideMarkdown(md).ok).toBe(true);
  });

  it('接受 frontmatter 含 theme', () => {
    const md = `---\ntheme: seriph\n---\n\n# 单页标题\n这页虽然没分页但有 theme`;
    expect(validateSlideMarkdown(md).ok).toBe(true);
  });

  it('接受 frontmatter 含 layout', () => {
    const md = `---\nlayout: cover\n---\n\n# 封面`;
    expect(validateSlideMarkdown(md).ok).toBe(true);
  });

  it('拒绝无分页且无 theme/layout 的普通 markdown', () => {
    const md = `# 一篇普通文章\n\n这是段落内容，没有任何幻灯片特征。\n\n更多段落。`;
    const r = validateSlideMarkdown(md);
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.reason).toContain('---');
  });

  it('frontmatter 内的 --- 不被误判为分页符', () => {
    // 仅 frontmatter，body 无分页且无 theme/layout → 不合法
    const md = `---\ntitle: 演示\n---\n\n# 一页普通内容无任何幻灯片特征的内容`;
    // 注意：此用例 frontmatter 无 theme/layout，body 也无分页符
    // 但内容里有 frontmatter 的 ---；splitFrontmatter 已剥离，故应判非法
    const r = validateSlideMarkdown(md);
    expect(r.ok).toBe(false);
  });
});
