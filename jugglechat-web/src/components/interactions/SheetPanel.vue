<script setup>
/**
 * SheetPanel - SHEET 半屏弹层组件
 * 核心交互：弹层弹出后可被拖回，松手后根据位移或速度判断是否关闭
 * 双判断条件：位移超过阈值(50%) 或 滑动速度超过阈值，满足一个即可关闭
 *
 * 使用方式：
 * <SheetPanel v-model:visible="show" title="更多操作" height="60%">
 *   <div>内容区域</div>
 * </SheetPanel>
 */
import { ref, computed, watch, nextTick } from 'vue'
import useDrag from '../../composables/useDrag'

const props = defineProps({
  visible: { type: Boolean, default: false },
  title: { type: String, default: '' },
  height: { type: String, default: '50%' },
  closable: { type: Boolean, default: true },
  maskClosable: { type: Boolean, default: true },
  round: { type: Boolean, default: true },
})

const emit = defineEmits(['update:visible', 'open', 'close'])

const sheetRef = ref(null)
const contentRef = ref(null)
const translateY = ref(0)
const maskOpacity = ref(0)
const isAnimating = ref(false)
const sheetHeight = ref(0)

// 阈值：位移超过 50% 或速度超过 0.3px/ms 即关闭
const CLOSE_THRESHOLD_RATIO = 0.5
const CLOSE_VELOCITY = 0.3

const { state: dragState, startDrag, destroy: destroyDrag } = useDrag({
  direction: 'y',
  threshold: 100,
  velocityThreshold: CLOSE_VELOCITY,
  snap: false, // 自定义吸附逻辑
  onFollow: (delta) => {
    // 跟随：只允许向下拖拽，向上有阻尼
    if (delta > 0) {
      translateY.value = delta
      maskOpacity.value = 1 - (delta / sheetHeight.value) * 0.5
    } else {
      translateY.value = delta * 0.3 // 向上拖拽阻尼
    }
  },
  onTrigger: () => {
    // 速度超过阈值，直接关闭
    closeSheet()
  },
  onCancel: () => {
    // 检查位移是否超过 50%
    if (translateY.value > sheetHeight.value * CLOSE_THRESHOLD_RATIO) {
      closeSheet()
    } else {
      // 吸附：回弹到初始位置
      animateTo(0, 1)
    }
  },
})

const sheetStyle = computed(() => ({
  height: props.height,
  transform: `translateY(${translateY.value}px)`,
  transition: isAnimating.value ? 'transform 0.3s cubic-bezier(0.32, 0.72, 0, 1)' : 'none',
  borderRadius: props.round ? '16px 16px 0 0' : '0',
}))

const maskStyle = computed(() => ({
  opacity: maskOpacity.value,
  transition: isAnimating.value ? 'opacity 0.3s ease' : 'none',
}))

function animateTo(y, opacity) {
  isAnimating.value = true
  translateY.value = y
  maskOpacity.value = opacity
  setTimeout(() => {
    isAnimating.value = false
  }, 300)
}

function openSheet() {
  emit('open')
  nextTick(() => {
    if (sheetRef.value) {
      sheetHeight.value = sheetRef.value.offsetHeight
    }
    animateTo(0, 1)
  })
}

function closeSheet() {
  emit('close')
  animateTo(sheetHeight.value, 0)
  setTimeout(() => {
    emit('update:visible', false)
  }, 300)
}

function onMaskClick() {
  if (props.maskClosable && props.closable) {
    closeSheet()
  }
}

function onHandleStart(e) {
  if (!props.closable) return
  e.preventDefault()
  startDrag(e)
}

watch(() => props.visible, (val) => {
  if (val) {
    translateY.value = window.innerHeight // 从屏幕底部开始
    maskOpacity.value = 0
    nextTick(() => {
      requestAnimationFrame(() => {
        openSheet()
      })
    })
  }
})

import { onUnmounted } from 'vue'
onUnmounted(() => {
  destroyDrag()
})
</script>

<template>
  <Teleport to="body">
    <Transition name="sheet-fade">
      <div v-if="visible" class="sheet-mask" :style="maskStyle" @click="onMaskClick">
        <div
          ref="sheetRef"
          class="sheet-panel"
          :style="sheetStyle"
          @click.stop
        >
          <!-- 拖拽手柄 -->
          <div class="sheet-handle" @mousedown="onHandleStart" @touchstart="onHandleStart">
            <div class="sheet-handle-bar"></div>
          </div>

          <!-- 标题栏 -->
          <div v-if="title" class="sheet-header">
            <span class="sheet-title">{{ title }}</span>
            <button v-if="closable" class="sheet-close" @click="closeSheet">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <line x1="18" y1="6" x2="6" y2="18"></line>
                <line x1="6" y1="6" x2="18" y2="18"></line>
              </svg>
            </button>
          </div>

          <!-- 内容区域 -->
          <div ref="contentRef" class="sheet-content">
            <slot></slot>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
.sheet-mask {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.5);
  z-index: 1000;
  display: flex;
  align-items: flex-end;
  justify-content: center;
}

.sheet-panel {
  width: 100%;
  max-width: 640px;
  background: #fff;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  will-change: transform;
}

.sheet-handle {
  display: flex;
  justify-content: center;
  padding: 12px 0 8px;
  cursor: grab;
  touch-action: none;
}

.sheet-handle:active {
  cursor: grabbing;
}

.sheet-handle-bar {
  width: 36px;
  height: 4px;
  background: #e2e8f0;
  border-radius: 2px;
}

.sheet-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 20px 12px;
  border-bottom: 1px solid #f1f5f9;
}

.sheet-title {
  font-size: 16px;
  font-weight: 600;
  color: #1e293b;
}

.sheet-close {
  width: 32px;
  height: 32px;
  border: none;
  background: transparent;
  color: #94a3b8;
  cursor: pointer;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background 0.2s;
}

.sheet-close:hover {
  background: #f1f5f9;
  color: #64748b;
}

.sheet-content {
  flex: 1;
  overflow-y: auto;
  padding: 16px 20px;
  -webkit-overflow-scrolling: touch;
}

.sheet-fade-enter-active,
.sheet-fade-leave-active {
  transition: opacity 0.3s ease;
}

.sheet-fade-enter-from,
.sheet-fade-leave-to {
  opacity: 0;
}
</style>
