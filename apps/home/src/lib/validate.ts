// 幻灯片格式校验（apps/home/src/lib/validate.ts）
// 规则（对齐 use-cases UC-2、user-slides/AGENTS.md §1）：
//  合法 = 含至少一个分页符 --- （frontmatter 闭合之后），或 frontmatter 含 theme/layout
export type ValidateResult = { ok: true } | { ok: false; reason: string };

export function validateSlideMarkdown(raw: string): ValidateResult {
  if (!raw || !raw.trim()) {
    return { ok: false, reason: '文件为空' };
  }
  if (raw.trim().length < 20) {
    return { ok: false, reason: '内容过短，可能不是完整的幻灯片' };
  }

  const { frontmatter, body } = splitFrontmatter(raw);

  // 条件1：frontmatter 含 theme 或 layout
  if (frontmatter) {
    const hasTheme = /^\s*theme\s*:/m.test(frontmatter);
    const hasLayout = /^\s*layout\s*:/m.test(frontmatter);
    if (hasTheme || hasLayout) return { ok: true };
  }

  // 条件2：body 含分页符 ---（独立行）
  if (/\n\s*---\s*(\n|$)/.test('\n' + body)) {
    return { ok: true };
  }

  return {
    ok: false,
    reason:
      '未检测到幻灯片特征：需要至少一个 `---` 分页符，或在 frontmatter 中声明 theme/layout',
  };
}

function splitFrontmatter(raw: string): { frontmatter: string | null; body: string } {
  if (!raw.startsWith('---')) return { frontmatter: null, body: raw };
  const end = raw.indexOf('\n---', 3);
  if (end === -1) return { frontmatter: null, body: raw };
  const frontmatter = raw.slice(3, end);
  const body = raw.slice(end + 4);
  return { frontmatter, body };
}
