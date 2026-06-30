// 前端调 server 文件 API（apps/home/src/lib/api.ts）
// 职责边界：仅网络调用，不含业务逻辑（AGENTS.md §4.2）
const base = ''; // 同源，dev 时 vite proxy 转发

export async function listFiles(): Promise<string[]> {
  const r = await fetch(`${base}/api/files`);
  if (!r.ok) throw new Error(`list files failed: ${r.status}`);
  const j = await r.json();
  return j.files as string[];
}

export async function uploadFile(filename: string, content: string): Promise<void> {
  const r = await fetch(`${base}/api/files`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ filename, content }),
  });
  if (!r.ok) {
    const e = await r.json().catch(() => ({}));
    throw new Error(e.error || `upload failed: ${r.status}`);
  }
}

export async function activate(
  filename: string,
  theme: string,
  colorSchema: string,
): Promise<void> {
  const r = await fetch(`${base}/api/activate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ filename, theme, colorSchema }),
  });
  if (!r.ok) {
    const e = await r.json().catch(() => ({}));
    throw new Error(e.error || `activate failed: ${r.status}`);
  }
}

export async function listThemes(): Promise<{ themes: string[]; default: string }> {
  const r = await fetch(`${base}/api/themes`);
  if (!r.ok) throw new Error(`themes failed: ${r.status}`);
  return r.json();
}

export async function getConfig(): Promise<{ slidevPort: number; historyLimit: number }> {
  const r = await fetch(`${base}/api/config`);
  if (!r.ok) throw new Error(`config failed: ${r.status}`);
  return r.json();
}

export async function readFileText(file: File): Promise<string> {
  return file.text();
}
