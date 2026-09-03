/**
 * JgIcon.vue — 通用图标组件（按需加载）
 *
 * 将 jg-icon-* 类名自动映射到 @iconify/ic 图标组件，实现按需加载。
 *
 * 用法：
 *   <JgIcon name="search" />          → IconIcRoundSearch（SVG）
 *   <JgIcon name="search" class="my-class" />  → 图标 + 自定义类
 *   <JgIcon name="ai" />              → fallback span（特殊图标）
 */
<script setup>
import { computed, defineAsyncComponent } from 'vue';
import { JG_ICON_MAP, JG_ICON_SPECIAL } from './jg-icon-map';

const props = defineProps({
  /** 图标名称（对应 jg-icon-* 去掉前缀），如 "search", "arrow-left" */
  name: { type: String, required: true },
  /** CSS 类名（可叠加额外样式） */
  className: { type: String, default: '' },
});

const iconKey = computed(() => props.name);

/** 判断是否为需要特殊处理的图标（保留原有 CSS 渲染） */
const isSpecial = computed(() => JG_ICON_SPECIAL.has(iconKey.value));

/** 动态导入图标组件路径 */
const iconPath = computed(() => {
  if (!isSpecial.value) return `~icons/ic/round-${iconKey.value}`;
  return null;
});

/** 图标组件（懒加载，未找到时返回 null） */
const IconComponent = computed(() => {
  if (!iconPath.value) return null;
  return defineAsyncComponent(() => import(iconPath.value));
});
</script>

<template>
  <!-- 特殊图标：降级为原始 jg-icon-* 类（由 iconfont.css 渲染） -->
  <span
    v-if="isSpecial"
    :class="['wr', 'jg-icon-' + name, className]"
  />
  <!-- 普通图标：动态加载 SVG 组件 -->
  <component
    v-else
    :is="IconComponent"
    :class="['jg-icon-svg', className]"
  />
</template>

<style scoped>
.jg-icon-svg {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  vertical-align: middle;
  line-height: 1;
  flex-shrink: 0;
  width: 1em;
  height: 1em;
}
</style>
