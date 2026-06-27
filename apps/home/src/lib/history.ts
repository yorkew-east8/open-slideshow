// 历史播放列表管理（localStorage，对齐 use-cases UC-6、architecture.md §5.1）
const KEY = 'os:history';

export interface HistoryItem {
  filename: string;
  openedAt: number;
  timesOpened: number;
}

export function loadHistory(limit: number): HistoryItem[] {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return [];
    const arr = JSON.parse(raw) as HistoryItem[];
    return arr.sort((a, b) => b.openedAt - a.openedAt).slice(0, limit);
  } catch {
    return [];
  }
}

function save(items: HistoryItem[]): void {
  localStorage.setItem(KEY, JSON.stringify(items));
}

// 记录一次打开：去重 + 时间置顶 + 计数累加（UC-6）
export function recordOpen(filename: string, limit: number): HistoryItem[] {
  const items = loadHistory(limit);
  const idx = items.findIndex((i) => i.filename === filename);
  const now = Date.now();
  if (idx >= 0) {
    items[idx] = {
      filename,
      openedAt: now,
      timesOpened: items[idx].timesOpened + 1,
    };
  } else {
    items.push({ filename, openedAt: now, timesOpened: 1 });
  }
  const sorted = items.sort((a, b) => b.openedAt - a.openedAt).slice(0, limit);
  save(sorted);
  return sorted;
}

export function clearHistory(): void {
  localStorage.removeItem(KEY);
}
