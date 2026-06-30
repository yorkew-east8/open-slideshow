<script setup lang="ts">
defineProps<{
  themes: string[];
  modelValue: string;
  colorSchema: string;
}>();
const emit = defineEmits<{
  (e: 'update:modelValue', v: string): void;
  (e: 'update:colorSchema', v: string): void;
}>();

function onTheme(e: Event) {
  emit('update:modelValue', (e.target as HTMLSelectElement).value);
}
function onColor(v: string) {
  emit('update:colorSchema', v);
}
</script>

<template>
  <div class="theme">
    <label class="label">幻灯片风格</label>
    <select class="sel" :value="modelValue" @change="onTheme">
      <option v-for="t in themes" :key="t" :value="t">{{ t }}</option>
    </select>
    <div class="color-row">
      <span class="color-label">配色</span>
      <label class="color-opt" :class="{ active: colorSchema === 'light' }">
        <input
          type="radio"
          name="color-schema"
          value="light"
          :checked="colorSchema === 'light'"
          @change="onColor('light')"
        />
        <span>浅色</span>
      </label>
      <label class="color-opt" :class="{ active: colorSchema === 'dark' }">
        <input
          type="radio"
          name="color-schema"
          value="dark"
          :checked="colorSchema === 'dark'"
          @change="onColor('dark')"
        />
        <span>深色</span>
      </label>
    </div>
    <p class="hint">默认浅色；可在 apps/player 增加主题包来扩展。</p>
  </div>
</template>

<style scoped>
.theme {
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.label {
  font-size: 13px;
  color: var(--muted);
  text-transform: uppercase;
  letter-spacing: 0.5px;
}
.sel {
  background: var(--panel-2);
  color: var(--text);
  border: 1px solid var(--border);
  border-radius: 8px;
  padding: 10px 12px;
  font-size: 14px;
  outline: none;
}
.sel:focus {
  border-color: var(--accent);
}
.color-row {
  display: flex;
  align-items: center;
  gap: 8px;
}
.color-label {
  font-size: 13px;
  color: var(--muted);
  text-transform: uppercase;
  letter-spacing: 0.5px;
  margin-right: 4px;
}
.color-opt {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 8px 14px;
  border: 1px solid var(--border);
  border-radius: 8px;
  font-size: 14px;
  cursor: pointer;
  background: var(--panel-2);
  color: var(--text);
  transition:
    border-color 0.12s,
    background 0.12s;
}
.color-opt input {
  margin: 0;
  accent-color: var(--accent);
}
.color-opt.active {
  border-color: var(--accent);
  background: color-mix(in srgb, var(--accent) 14%, var(--panel-2));
}
.hint {
  margin: 0;
  font-size: 11px;
  color: var(--muted);
  line-height: 1.5;
}
</style>
