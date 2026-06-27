// Node 25 内置了不完整的 localStorage，覆盖了 jsdom 的实现。
// 这里强制把 jsdom 的 Storage 实例挂到 globalThis，保证测试可用。

// 用最简实现替换，避免依赖环境细节
const store = new Map<string, string>();
const ls = {
  getItem(key: string) {
    return store.has(key) ? store.get(key)! : null;
  },
  setItem(key: string, value: string) {
    store.set(key, String(value));
  },
  removeItem(key: string) {
    store.delete(key);
  },
  clear() {
    store.clear();
  },
  key(i: number) {
    return Array.from(store.keys())[i] ?? null;
  },
  get length() {
    return store.size;
  },
};

// @ts-expect-error override node's incomplete localStorage
globalThis.localStorage = ls;
// @ts-expect-error override node's incomplete sessionStorage
globalThis.sessionStorage = ls;
