<script setup>
/**
 * ImageViewer - FLIP 共享元素放大组件
 * 核心技巧：先把大图钉在小图位置（transition:none），下一帧再放开，让大图自然回到自身位置，触发放大动画
 * FLIP = First(记录初始位置) → Last(记录最终位置) → Invert(倒推回初始) → Play(放开过渡)
 *
 * 使用方式：
 * <ImageViewer v-model:visible="show" :src="imageUrl" :rect="triggerRect">
 * </ImageViewer>
 *
 * 或者使用指令式：
 * const viewer = createImageViewer()
 * viewer.open(src, triggerElement)
 */
import { ref, computed, watch, nextTick, onUnmounted } from 'vue'

const props = defineProps({
  visible: { type: Boolean, default: false },
  src: { type: String, default: '' },
  rect: { type: Object, default: null }, // { x, y, width, height }
  alt: { type: String, default: '' },
})

const emit = defineEmits(['update:visible', 'close'])

const viewerRef = ref(null)
const imageRef = ref(null)
const isAnimating = ref(false)
const isOpen = ref(false)
const currentRect = ref({ x: 0, y: 0, width: 0, height: 0 })
const imageLoaded = ref(false)

// 多等一帧：关键操作后等待一帧再执行下一步，避免动画冲突
let rafId = null

const viewerStyle = computed(() => ({
  opacity: isOpen.value ? 1 : 0,
  transition: isAnimating.value ? 'opacity 0.3s ease' : 'none',
}))

const imageStyle = computed(() => ({
  transform: isOpen.value
    ? 'translate(0, 0) scale(1)'
    : `translate(${currentRect.value.x}px, ${currentRect.value.y}px) scale(${currentRect.value.width / (window.innerWidth * 0.9)})`,
  transformOrigin: 'top left',
  transition: isAnimating.value ? 'transform 0.35s cubic-bezier(0.32, 0.72, 0, 1)' : 'none',
  maxWidth: '90vw',
  maxHeight: '90vh',
}))

function getTriggerRect() {
  if (props.rect) return props.rect
  return {
    x: window.innerWidth / 2 - 100,
    y: window.innerHeight / 2 - 100,
    width: 200,
    height: 200,
  }
}

function openViewer() {
  const rect = getTriggerRect()
  currentRect.value = rect
  isOpen.value = false
  isAnimating.value = false
  imageLoaded.value = false

  nextTick(() => {
    // 先检查图片是否已缓存
    const img = new Image()
    img.onload = () => {
      imageLoaded.value = true
      // 多等一帧：确保 DOM 渲染完成
      rafId = requestAnimationFrame(() => {
        rafId = requestAnimationFrame(() => {
          isAnimating.value = true
          isOpen.value = true
        })
      })
    }
    img.onerror = () => {
      imageLoaded.value = true
      isAnimating.value = true
      isOpen.value = true
    }
    img.src = props.src
  })
}

function closeViewer() {
  emit('close')
  isAnimating.value = true
  isOpen.value = false
  setTimeout(() => {
    emit('update:visible', false)
    isAnimating.value = false
  }, 350)
}

function onMaskClick(e) {
  if (e.target === viewerRef.value) {
    closeViewer()
  }
}

function onKeydown(e) {
  if (e.key === 'Escape') {
    closeViewer()
  }
}

watch(() => props.visible, (val) => {
  if (val) {
    document.addEventListener('keydown', onKeydown)
    document.body.style.overflow = 'hidden'
    openViewer()
  } else {
    document.removeEventListener('keydown', onKeydown)
    document.body.style.overflow = ''
  }
})

onUnmounted(() => {
  if (rafId) cancelAnimationFrame(rafId)
  document.removeEventListener('keydown', onKeydown)
  document.body.style.overflow = ''
})
</script>

<template>
  <Teleport to="body">
    <div
      v-if="visible"
      ref="viewerRef"
      class="flip-viewer"
      :style="viewerStyle"
      @click="onMaskClick"
    >
      <img
        ref="imageRef"
        :src="src"
        :alt="alt"
        class="flip-image"
        :style="imageStyle"
        @click.stop
        draggable="false"
      />
      <!-- 加载指示器 -->
      <div v-if="!imageLoaded" class="flip-loading">
        <div class="flip-spinner"></div>
      </div>
      <!-- 关闭按钮 -->
      <button class="flip-close" @click="closeViewer">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <line x1="18" y1="6" x2="6" y2="18"></line>
          <line x1="6" y1="6" x2="18" y2="18"></line>
        </svg>
      </button>
    </div>
  </Teleport>
</template>

<style scoped>
.flip-viewer {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.9);
  z-index: 2000;
  display: flex;
  align-items: center;
  justify-content: center;
  will-change: opacity;
}

.flip-image {
  position: absolute;
  top: 50%;
  left: 50%;
  margin-left: -45vw;
  margin-top: -45vh;
  object-fit: contain;
  will-change: transform;
  user-select: none;
  -webkit-user-drag: none;
}

.flip-loading {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
}

.flip-spinner {
  width: 40px;
  height: 40px;
  border: 3px solid rgba(255, 255, 255, 0.2);
  border-top-color: #fff;
  border-radius: 50%;
  animation: flip-spin 0.8s linear infinite;
}

@keyframes flip-spin {
  to { transform: rotate(360deg); }
}

.flip-close {
  position: absolute;
  top: 20px;
  right: 20px;
  width: 44px;
  height: 44px;
  border: none;
  background: rgba(255, 255, 255, 0.1);
  color: #fff;
  border-radius: 50%;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background 0.2s;
  z-index: 10;
}

.flip-close:hover {
  background: rgba(255, 255, 255, 0.2);
}
</style>
