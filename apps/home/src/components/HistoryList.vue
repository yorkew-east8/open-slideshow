<script setup lang="ts">
import type { HistoryItem } from '../lib/history';

defineProps<{
  items: HistoryItem[];
  selected: string | null;
  loading?: boolean;
}>();

const emit = defineEmits<{ (e: 'select', filename: string): void }>();

function fmt(ts: number): string {
  const d = new Date(ts);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getMonth() + 1}/${d.getDate()} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}
</script>

<template>
  <div class="history">
    <div class="head">历史播放列表</div>
    <div v-if="loading" class="empty">加载中…</div>
    <div v-else-if="items.length === 0" class="empty">
      还没有播放过的幻灯片<br />点击下方「打开新文件」开始
    </div>
    <ul v-else class="list">
      <li
        v-for="it in items"
        :key="it.filename"
        :class="['item', { active: it.filename === selected }]"
        @click="emit('select', it.filename)"
      >
        <span class="name" :title="it.filename">{{ it.filename }}</span>
        <span class="meta">{{ fmt(it.openedAt) }} · ×{{ it.timesOpened }}</span>
      </li>
    </ul>
  </div>
</template>

<style scoped>
.history {
  display: flex;
  flex-direction: column;
  height: 100%;
}
.head {
  font-size: 13px;
  color: var(--muted);
  text-transform: uppercase;
  letter-spacing: 0.5px;
  margin-bottom: 12px;
}
.empty {
  color: var(--muted);
  font-size: 13px;
  line-height: 1.6;
  text-align: center;
  margin-top: 24px;
}
.list {
  list-style: none;
  margin: 0;
  padding: 0;
  overflow-y: auto;
  flex: 1;
}
.item {
  padding: 10px 12px;
  border-radius: 8px;
  cursor: pointer;
  display: flex;
  flex-direction: column;
  gap: 2px;
  transition: background 0.12s;
}
.item:hover {
  background: var(--panel-2);
}
.item.active {
  background: var(--accent);
  color: #fff;
}
.name {
  font-size: 14px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.meta {
  font-size: 11px;
  opacity: 0.7;
}
</style>
