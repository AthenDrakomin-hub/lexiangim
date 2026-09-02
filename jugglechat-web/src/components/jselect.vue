<script setup>
import { reactive, watch } from "vue";
import utils from "../common/utils";

const props = defineProps(['uid', 'current', 'list']);
const emit = defineEmits(["onchanged"]);

let state = reactive({
  current: props.current,
  isOpen: false
});

function onChanged(value) {
  state.current = value;
  emit('onchanged', { value, uid: props.uid });
  state.isOpen = false;
}

function toggleDropdown() {
  state.isOpen = !state.isOpen;
}

function closeDropdown() {
  state.isOpen = false;
}

function getCurrentName() {
  let item = utils.filter(props.list, (item) => {
    return String(item.value) === String(state.current);
  });
  if (item && item.length > 0) {
    return item[0].name;
  }
  return '请选择';
}

watch(() => props.current, () => {
  state.current = props.current;
})
</script>

<template>
  <div class="jg-select-wrapper" @click.stop>
    <div class="jg-select-trigger" @click="toggleDropdown">
      <span class="jg-select-value">{{ getCurrentName() }}</span>
      <span class="jg-select-arrow" :class="{ 'jg-select-arrow-open': state.isOpen }">
        <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M6 9L12 15L18 9" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
      </span>
    </div>
    <div class="jg-select-dropdown" v-if="state.isOpen">
      <div 
        class="jg-select-option" 
        :class="{ 'jg-select-option-selected': String(item.value) === String(state.current) }"
        v-for="item in props.list" 
        :key="item.value"
        @click="onChanged(item.value)"
      >
        {{ item.name }}
      </div>
    </div>
  </div>
</template>

<style scoped>
.jg-select-wrapper {
  position: relative;
  width: 100%;
}

.jg-select-trigger {
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
  height: 40px;
  padding: 0 12px;
  background: var(--jg-bg-input, #fff);
  border: 1px solid var(--jg-border-color, #d1d5db);
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s ease;
  box-sizing: border-box;
}

.jg-select-trigger:hover {
  border-color: var(--jg-primary, #5865f2);
}

.jg-select-value {
  font-size: 14px;
  color: var(--jg-text-body, #1f2937);
  flex: 1;
  text-align: left;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.jg-select-arrow {
  width: 16px;
  height: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--jg-text-muted, #9ca3af);
  transition: transform 0.2s ease;
  margin-left: 8px;
  flex-shrink: 0;
}

.jg-select-arrow svg {
  width: 100%;
  height: 100%;
}

.jg-select-arrow-open {
  transform: rotate(180deg);
}

.jg-select-dropdown {
  position: absolute;
  top: calc(100% + 4px);
  left: 0;
  right: 0;
  background: var(--jg-bg-card, #fff);
  border: 1px solid var(--jg-border-color, #e5e7eb);
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  z-index: 1000;
  max-height: 200px;
  overflow-y: auto;
  animation: jg-select-fade-in 0.15s ease;
}

@keyframes jg-select-fade-in {
  from {
    opacity: 0;
    transform: translateY(-4px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.jg-select-option {
  padding: 10px 12px;
  font-size: 14px;
  color: var(--jg-text-body, #1f2937);
  cursor: pointer;
  transition: background 0.15s ease;
  text-align: left;
}

.jg-select-option:hover {
  background: var(--jg-bg-hover, #f3f4f6);
}

.jg-select-option-selected {
  background: var(--jg-primary-light, #ccfbf1);
  color: var(--jg-primary-color, #0d9488);
  font-weight: 500;
}

/* 深色模式 */
[data-bs-theme="dark"] .jg-select-trigger {
  background: var(--jg-bg-input, #1f2937);
  border-color: var(--jg-border-color, #374151);
}

[data-bs-theme="dark"] .jg-select-dropdown {
  background: var(--jg-bg-card, #1f2937);
  border-color: var(--jg-border-color, #374151);
}

[data-bs-theme="dark"] .jg-select-option:hover {
  background: var(--jg-bg-hover, #374151);
}
</style>
