<script setup lang="ts">
defineProps<{
  themes: string[];
  modelValue: string;
}>();
const emit = defineEmits<{ (e: 'update:modelValue', v: string): void }>();

function onInput(e: Event) {
  emit('update:modelValue', (e.target as HTMLSelectElement).value);
}
</script>

<template>
  <div class="theme">
    <label class="label">幻灯片风格</label>
    <select class="sel" :value="modelValue" @change="onInput">
      <option v-for="t in themes" :key="t" :value="t">{{ t }}</option>
    </select>
    <p class="hint">默认随官方定义；可在 apps/player 增加主题包来扩展。</p>
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
.hint {
  margin: 0;
  font-size: 11px;
  color: var(--muted);
  line-height: 1.5;
}
</style>
