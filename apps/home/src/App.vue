<script setup lang="ts">
import { ref, onMounted, computed } from 'vue';
import HistoryList from './components/HistoryList.vue';
import ThemeSelector from './components/ThemeSelector.vue';
import FileOpener from './components/FileOpener.vue';
import { loadHistory, recordOpen } from './lib/history';
import { listFiles, activate, listThemes, getConfig } from './lib/api';
import type { HistoryItem } from './lib/history';

// 运行配置从 server 读取（避免构建期写死）
const historyLimit = ref(20);
const slidevPort = ref(3030);

const history = ref<HistoryItem[]>([]);
const files = ref<string[]>([]);
const selected = ref<string | null>(null);
const themes = ref<string[]>(['default']);
const theme = ref('default');
const loading = ref(false);
const msg = ref<string | null>(null);
const busy = ref(false);

// 同步：历史里的文件必须在磁盘存在；首页也可直接选未在历史中的文件
const candidates = computed<string[]>(() => {
  const fromHistory = history.value.map((h) => h.filename);
  const merged = [...new Set([...files.value, ...fromHistory])];
  return merged;
});

onMounted(async () => {
  loading.value = true;
  try {
    files.value = await listFiles();
    const t = await listThemes();
    themes.value = t.themes;
    theme.value = t.default;
    const c = await getConfig();
    historyLimit.value = c.historyLimit;
    slidevPort.value = c.slidevPort;
    history.value = loadHistory(historyLimit.value);
  } catch (e) {
    msg.value = '加载失败：' + (e as Error).message;
  } finally {
    loading.value = false;
  }
});

function onSelect(filename: string) {
  selected.value = filename;
  msg.value = null;
}

// 打开新文件成功后：加入历史并选中（FileOpener 已上传）
async function onOpened(filename: string) {
  files.value = await listFiles();
  history.value = recordOpen(filename, historyLimit.value);
  selected.value = filename;
  msg.value = `已添加：${filename}`;
}

async function startPlay() {
  if (!selected.value) {
    msg.value = '请先选择一个幻灯片';
    return;
  }
  busy.value = true;
  msg.value = '准备播放…';
  try {
    await activate(selected.value, theme.value);
    history.value = recordOpen(selected.value, historyLimit.value);
    // 新标签打开播放器
    const url = `${location.protocol}//${location.hostname}:${slidevPort.value}`;
    window.open(url, '_blank');
    msg.value = null;
  } catch (e) {
    msg.value = '播放失败：' + (e as Error).message;
  } finally {
    busy.value = false;
  }
}

// 占位：上传未在历史中的文件快捷选中（从磁盘列表）
async function quickAdd(filename: string) {
  selected.value = filename;
  msg.value = null;
}
</script>

<template>
  <div class="app">
    <header class="header">
      <h1>Open Slideshow</h1>
      <span class="sub">Markdown → 幻灯片 → 演讲</span>
    </header>

    <main class="main">
      <aside class="left">
        <HistoryList
          :items="history"
          :selected="selected"
          :loading="loading"
          @select="onSelect"
        />
        <div v-if="candidates.length > history.length" class="disk">
          <div class="disk-head">库中其他文件</div>
          <ul class="disk-list">
            <li
              v-for="f in candidates.filter(
                (c) => !history.some((h) => h.filename === c),
              )"
              :key="f"
              :class="{ active: f === selected }"
              @click="quickAdd(f)"
            >
              {{ f }}
            </li>
          </ul>
        </div>
        <div class="opener-wrap">
          <FileOpener @opened="onOpened" />
        </div>
      </aside>

      <section class="right">
        <div class="selected-card">
          <div class="card-label">当前选中</div>
          <div class="card-name">{{ selected || '（未选择）' }}</div>
        </div>
        <ThemeSelector v-model="theme" :themes="themes" />
        <div v-if="msg" class="msg">{{ msg }}</div>
      </section>
    </main>

    <footer class="footer">
      <button class="play" :disabled="!selected || busy" @click="startPlay">
        {{ busy ? '处理中…' : '▶ 开始播放' }}
      </button>
    </footer>
  </div>
</template>

<style scoped>
.app {
  display: flex;
  flex-direction: column;
  height: 100vh;
  max-width: 1100px;
  margin: 0 auto;
  padding: 24px;
}
.header {
  display: flex;
  align-items: baseline;
  gap: 12px;
  margin-bottom: 20px;
}
.header h1 {
  margin: 0;
  font-size: 22px;
  font-weight: 600;
}
.sub {
  color: var(--muted);
  font-size: 13px;
}
.main {
  display: grid;
  grid-template-columns: 1.2fr 1fr;
  gap: 24px;
  flex: 1;
  min-height: 0;
}
.left {
  background: var(--panel);
  border: 1px solid var(--border);
  border-radius: 12px;
  padding: 16px;
  display: flex;
  flex-direction: column;
  min-height: 0;
}
.disk {
  margin-top: 12px;
  border-top: 1px solid var(--border);
  padding-top: 12px;
}
.disk-head {
  font-size: 11px;
  color: var(--muted);
  text-transform: uppercase;
  margin-bottom: 6px;
}
.disk-list {
  list-style: none;
  margin: 0;
  padding: 0;
  max-height: 120px;
  overflow-y: auto;
}
.disk-list li {
  padding: 6px 10px;
  border-radius: 6px;
  font-size: 13px;
  cursor: pointer;
}
.disk-list li:hover {
  background: var(--panel-2);
}
.disk-list li.active {
  background: var(--accent);
  color: #fff;
}
.opener-wrap {
  margin-top: auto;
  padding-top: 16px;
  border-top: 1px solid var(--border);
}
.right {
  background: var(--panel);
  border: 1px solid var(--border);
  border-radius: 12px;
  padding: 20px;
  display: flex;
  flex-direction: column;
  gap: 24px;
}
.selected-card {
  background: var(--panel-2);
  border-radius: 10px;
  padding: 16px;
}
.card-label {
  font-size: 11px;
  color: var(--muted);
  text-transform: uppercase;
  margin-bottom: 6px;
}
.card-name {
  font-size: 16px;
  word-break: break-all;
}
.msg {
  color: var(--accent);
  font-size: 13px;
}
.footer {
  display: flex;
  justify-content: center;
  padding-top: 20px;
}
.play {
  background: var(--accent);
  color: #fff;
  border: none;
  border-radius: 12px;
  padding: 14px 48px;
  font-size: 16px;
  font-weight: 600;
  box-shadow: 0 4px 16px rgba(78, 161, 255, 0.3);
  transition:
    transform 0.1s,
    background 0.12s;
}
.play:hover:not(:disabled) {
  background: var(--accent-hover);
  transform: translateY(-1px);
}
.play:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
</style>
