<script setup lang="ts">
import { ref } from 'vue';
import { validateSlideMarkdown } from '../lib/validate';
import { uploadFile, readFileText } from '../lib/api';

const emit = defineEmits<{ (e: 'opened', filename: string): void }>();

const busy = ref(false);
const error = ref<string | null>(null);
const pending = ref<{ filename: string; content: string; reason: string } | null>(null);
const input = ref<HTMLInputElement | null>(null);

async function pick() {
  error.value = null;
  pending.value = null;
  input.value?.click();
}

async function onChange(e: Event) {
  const file = (e.target as HTMLInputElement).files?.[0];
  (e.target as HTMLInputElement).value = '';
  if (!file) return;
  busy.value = true;
  try {
    const content = await readFileText(file);
    const res = validateSlideMarkdown(content);
    if (res.ok) {
      await uploadFile(file.name, content);
      emit('opened', file.name);
    } else {
      // 非法：暴露原因 + 允许强制打开（UC-2 非法分支）
      pending.value = { filename: file.name, content, reason: res.reason };
    }
  } catch (err) {
    error.value = (err as Error).message;
  } finally {
    busy.value = false;
  }
}

async function forceOpen() {
  if (!pending.value) return;
  busy.value = true;
  try {
    await uploadFile(pending.value.filename, pending.value.content);
    const name = pending.value.filename;
    pending.value = null;
    emit('opened', name);
  } catch (err) {
    error.value = (err as Error).message;
  } finally {
    busy.value = false;
  }
}

function cancelForce() {
  pending.value = null;
}
</script>

<template>
  <div class="opener">
    <input
      ref="input"
      type="file"
      accept=".md,text/markdown"
      class="hidden"
      @change="onChange"
    />
    <button class="btn" :disabled="busy" @click="pick">
      {{ busy ? '处理中…' : '+ 打开新文件' }}
    </button>
    <p v-if="error" class="err">{{ error }}</p>

    <div v-if="pending" class="warn">
      <div class="warn-title">这不是幻灯片格式</div>
      <div class="warn-reason">{{ pending.reason }}</div>
      <div class="warn-actions">
        <button class="btn-sm danger" :disabled="busy" @click="forceOpen">
          强制打开
        </button>
        <button class="btn-sm" @click="cancelForce">取消</button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.opener {
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.hidden {
  display: none;
}
.btn {
  background: var(--accent);
  color: #fff;
  border: none;
  border-radius: 8px;
  padding: 10px 14px;
  font-size: 14px;
  transition: background 0.12s;
}
.btn:hover:not(:disabled) {
  background: var(--accent-hover);
}
.btn:disabled {
  opacity: 0.6;
}
.err {
  margin: 0;
  color: var(--danger);
  font-size: 12px;
}
.warn {
  background: rgba(255, 107, 107, 0.1);
  border: 1px solid rgba(255, 107, 107, 0.4);
  border-radius: 8px;
  padding: 12px;
  font-size: 13px;
}
.warn-title {
  font-weight: 600;
  margin-bottom: 4px;
}
.warn-reason {
  color: var(--muted);
  margin-bottom: 10px;
  line-height: 1.5;
}
.warn-actions {
  display: flex;
  gap: 8px;
}
.btn-sm {
  background: var(--panel-2);
  color: var(--text);
  border: 1px solid var(--border);
  border-radius: 6px;
  padding: 6px 12px;
  font-size: 12px;
}
.btn-sm.danger {
  background: var(--danger);
  color: #fff;
  border-color: var(--danger);
}
</style>
