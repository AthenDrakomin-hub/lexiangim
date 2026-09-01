<script setup>
/**
 * PageTransition - PUSH 页面转场组件
 * 核心技巧：新页面和旧页面同时运动，旧页面位移+变暗，新页面从右侧滑入，避免旧页面静止导致的割裂感
 *
 * 使用方式：
 * <PageTransition>
 *   <router-view v-slot="{ Component }">
 *     <component :is="Component" />
 *   </router-view>
 * </PageTransition>
 *
 * 或者包裹任意需要转场的元素：
 * <PageTransition :duration="300">
 *   <div v-if="show">内容</div>
 * </PageTransition>
 */
import { computed } from 'vue'

const props = defineProps({
  duration: { type: Number, default: 300 },
  // 转场方向：'left' 新页面从右滑入（前进），'right' 新页面从左滑入（返回）
  direction: { type: String, default: 'left' },
  // 旧页面位移比例
  oldOffset: { type: Number, default: 30 },
  // 旧页面变暗程度
  oldOpacity: { type: Number, default: 0.5 },
})

const transitionName = computed(() => props.direction === 'left' ? 'push-left' : 'push-right')

const durationStyle = computed(() => ({
  '--push-duration': `${props.duration}ms`,
  '--push-old-offset': `${props.oldOffset}%`,
  '--push-old-opacity': props.oldOpacity,
}))
</script>

<template>
  <div class="push-container" :style="durationStyle">
    <Transition :name="transitionName" mode="out-in">
      <slot></slot>
    </Transition>
  </div>
</template>

<style scoped>
.push-container {
  position: relative;
  width: 100%;
  height: 100%;
  overflow: hidden;
}

/* 前进：新页面从右侧滑入 */
.push-left-enter-active {
  transition: transform var(--push-duration) cubic-bezier(0.32, 0.72, 0, 1),
              opacity var(--push-duration) ease;
  z-index: 2;
}

.push-left-leave-active {
  transition: transform var(--push-duration) cubic-bezier(0.32, 0.72, 0, 1),
              opacity var(--push-duration) ease;
  z-index: 1;
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
}

.push-left-enter-from {
  transform: translateX(100%);
  opacity: 1;
}

.push-left-enter-to {
  transform: translateX(0);
  opacity: 1;
}

.push-left-leave-from {
  transform: translateX(0);
  opacity: 1;
}

.push-left-leave-to {
  transform: translateX(calc(-1 * var(--push-old-offset)));
  opacity: var(--push-old-opacity);
}

/* 返回：新页面从左侧滑入 */
.push-right-enter-active {
  transition: transform var(--push-duration) cubic-bezier(0.32, 0.72, 0, 1),
              opacity var(--push-duration) ease;
  z-index: 2;
}

.push-right-leave-active {
  transition: transform var(--push-duration) cubic-bezier(0.32, 0.72, 0, 1),
              opacity var(--push-duration) ease;
  z-index: 1;
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
}

.push-right-enter-from {
  transform: translateX(calc(-1 * var(--push-old-offset)));
  opacity: var(--push-old-opacity);
}

.push-right-enter-to {
  transform: translateX(0);
  opacity: 1;
}

.push-right-leave-from {
  transform: translateX(0);
  opacity: 1;
}

.push-right-leave-to {
  transform: translateX(100%);
  opacity: 1;
}
</style>
