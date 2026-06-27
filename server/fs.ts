// server/fs.ts — 对 fs 的薄封装（promise 化，集中错误处理）
import { promises as fsp } from 'node:fs';

export const readdir = (p: string) => fsp.readdir(p);
export const readFile = (p: string, enc: BufferEncoding) => fsp.readFile(p, enc);
export const writeFile = (p: string, data: string, enc: BufferEncoding) =>
  fsp.writeFile(p, data, enc);
export const ensureDir = (p: string) => fsp.mkdir(p, { recursive: true });
