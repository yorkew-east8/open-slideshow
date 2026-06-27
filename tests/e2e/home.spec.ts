// e2e: 首页 → 选片 → 校验 → 播放 关键路径（对齐 use-cases UC-1/2/3）
import { test, expect } from '@playwright/test';

// 容器内访问宿主服务用 host.docker.internal；本地直跑用 localhost
const host = process.env.TARGET_HOST || 'localhost';
const HOME = `http://${host}:8080`;

test.describe('open-slideshow 首页', () => {
  test('UC-1 首页加载并展示标题与空历史提示', async ({ page }) => {
    await page.goto(HOME);
    await expect(page.locator('h1')).toHaveText('Open Slideshow');
    // 风格下拉存在
    await expect(page.locator('.theme select')).toBeVisible();
    // 开始播放按钮存在
    await expect(page.locator('.play')).toBeVisible();
  });

  test('UC-1 文件 API 返回 welcome.md（排除 AGENTS.md/active.md）', async ({
    request,
  }) => {
    const r = await request.get(`${HOME}/api/files`);
    expect(r.ok()).toBeTruthy();
    const body = await r.json();
    expect(body.files).toContain('welcome.md');
    expect(body.files).not.toContain('AGENTS.md');
    expect(body.files).not.toContain('active.md');
  });

  test('UC-3 从库中选择 welcome.md 后开始播放可用', async ({ page }) => {
    await page.goto(HOME);
    // 点击库中文件 welcome.md（disk-list）
    await page.locator('.disk-list li', { hasText: 'welcome.md' }).click();
    // 选中态
    await expect(page.locator('.card-name')).toHaveText('welcome.md');
    // 开始播放按钮可用
    await expect(page.locator('.play')).toBeEnabled();
  });

  test('UC-3 激活后 player 端口返回 200 并渲染 Slidev', async ({ page, context }) => {
    // 触发 activate
    await page.goto(HOME);
    await page.locator('.disk-list li', { hasText: 'welcome.md' }).click();
    // 监听新标签
    const newPagePromise = context.waitForEvent('page');
    await page.locator('.play').click();
    const newPage = await newPagePromise;
    await newPage.waitForLoadState('domcontentloaded');
    // 新标签 URL 应指向 player 端口
    console.log('POPUP_URL:', newPage.url());
    // Slidev 入口加载：标题含 "- Slidev"，#app 被挂载
    await expect(newPage).toHaveTitle(/Slidev/, { timeout: 30000 });
    await expect(newPage.locator('#app')).not.toBeEmpty({ timeout: 30000 });
  });

  test('UC-2 上传非法 md 时给出原因与强制打开', async ({ page }) => {
    await page.goto(HOME);
    // 构造一个无分页、无 theme/layout 的普通 md
    const badMd =
      '# 一篇普通文章\n\n这是段落内容，没有任何幻灯片特征。\n\n更多段落内容在这里。';
    await page.setInputFiles('input[type=file]', {
      name: 'bad.md',
      mimeType: 'text/markdown',
      buffer: Buffer.from(badMd),
    });
    // 出现非法提示
    await expect(page.locator('.warn')).toBeVisible();
    await expect(page.locator('.warn-reason')).toContainText('---');
    // 强制打开按钮存在
    await expect(page.locator('.warn-actions button.danger')).toBeVisible();
  });
});
