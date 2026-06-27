import { describe, it, expect, beforeEach } from 'vitest';
import { recordOpen, loadHistory, clearHistory } from '../../apps/home/src/lib/history';

describe('history (localStorage)', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('新增一条历史', () => {
    const list = recordOpen('a.md', 20);
    expect(list).toHaveLength(1);
    expect(list[0].filename).toBe('a.md');
    expect(list[0].timesOpened).toBe(1);
  });

  it('重复打开：去重 + 计数累加 + 时间置顶', async () => {
    recordOpen('a.md', 20);
    const before = loadHistory(20)[0].openedAt;
    await new Promise((r) => setTimeout(r, 5));
    recordOpen('b.md', 20);
    await new Promise((r) => setTimeout(r, 5));
    recordOpen('a.md', 20);
    const list = loadHistory(20);
    expect(list).toHaveLength(2);
    expect(list[0].filename).toBe('a.md');
    expect(list[0].timesOpened).toBe(2);
    expect(list[0].openedAt).toBeGreaterThan(before);
  });

  it('超过上限剔除最旧', () => {
    for (let i = 0; i < 5; i++) recordOpen(`f${i}.md`, 3);
    const list = loadHistory(3);
    expect(list).toHaveLength(3);
  });

  it('clearHistory 清空', () => {
    recordOpen('a.md', 20);
    clearHistory();
    expect(loadHistory(20)).toHaveLength(0);
  });
});
