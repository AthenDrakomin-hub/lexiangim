/**
 * useDrag - 拖拽手势核心 composable
 * 实现交互三要素：跟随（贴合手指轨迹）、阈值（合理触发边界）、吸附（自动完成闭环）
 *
 * 使用方式：
 * const { state, startDrag, onDrag, endDrag } = useDrag({
 *   direction: 'y',           // 拖拽方向：'x' | 'y' | 'both'
 *   threshold: 100,           // 触发阈值（像素）
 *   velocityThreshold: 0.5,   // 速度阈值（px/ms）
 *   snap: true,               // 是否启用吸附
 *   onFollow: (delta) => {},  // 跟随回调
 *   onTrigger: () => {},      // 达到阈值回调
 *   onCancel: () => {},       // 未达到阈值回调
 * })
 */
import { reactive } from 'vue'

export function useDrag(options = {}) {
  const {
    direction = 'y',
    threshold = 100,
    velocityThreshold = 0.5,
    snap = true,
    onFollow,
    onTrigger,
    onCancel,
  } = options

  const state = reactive({
    isDragging: false,
    startX: 0,
    startY: 0,
    currentX: 0,
    currentY: 0,
    deltaX: 0,
    deltaY: 0,
    velocityX: 0,
    velocityY: 0,
    lastMoveTime: 0,
    isTriggered: false,
  })

  // 多等一帧：避免动画冲突
  let rafId = null

  function startDrag(e) {
    const point = e.touches ? e.touches[0] : e
    state.isDragging = true
    state.startX = point.clientX
    state.startY = point.clientY
    state.currentX = point.clientX
    state.currentY = point.clientY
    state.deltaX = 0
    state.deltaY = 0
    state.velocityX = 0
    state.velocityY = 0
    state.lastMoveTime = Date.now()
    state.isTriggered = false

    if (e.type === 'touchstart') {
      document.addEventListener('touchmove', onDrag, { passive: false })
      document.addEventListener('touchend', endDrag)
    } else {
      document.addEventListener('mousemove', onDrag)
      document.addEventListener('mouseup', endDrag)
    }
  }

  function onDrag(e) {
    if (!state.isDragging) return
    if (e.cancelable) e.preventDefault()

    const point = e.touches ? e.touches[0] : e
    const now = Date.now()
    const dt = now - state.lastMoveTime

    // 多量一次：精确计算速度
    if (dt > 0) {
      state.velocityX = (point.clientX - state.currentX) / dt
      state.velocityY = (point.clientY - state.currentY) / dt
    }

    state.currentX = point.clientX
    state.currentY = point.clientY
    state.deltaX = point.clientX - state.startX
    state.deltaY = point.clientY - state.startY
    state.lastMoveTime = now

    // 跟随：贴合手指轨迹
    if (onFollow) {
      if (direction === 'x') onFollow(state.deltaX)
      else if (direction === 'y') onFollow(state.deltaY)
      else onFollow({ x: state.deltaX, y: state.deltaY })
    }
  }

  function endDrag() {
    if (!state.isDragging) return
    state.isDragging = false

    document.removeEventListener('touchmove', onDrag)
    document.removeEventListener('touchend', endDrag)
    document.removeEventListener('mousemove', onDrag)
    document.removeEventListener('mouseup', endDrag)

    // 阈值判断：位移超过阈值 或 速度超过阈值，满足一个即触发
    const delta = direction === 'x' ? Math.abs(state.deltaX) :
                  direction === 'y' ? Math.abs(state.deltaY) :
                  Math.sqrt(state.deltaX ** 2 + state.deltaY ** 2)
    const velocity = direction === 'x' ? Math.abs(state.velocityX) :
                     direction === 'y' ? Math.abs(state.velocityY) :
                     Math.sqrt(state.velocityX ** 2 + state.velocityY ** 2)

    const isTriggered = delta >= threshold || velocity >= velocityThreshold
    state.isTriggered = isTriggered

    // 吸附：自动完成闭环
    if (snap) {
      if (rafId) cancelAnimationFrame(rafId)
      rafId = requestAnimationFrame(() => {
        if (isTriggered && onTrigger) onTrigger()
        else if (!isTriggered && onCancel) onCancel()
      })
    } else {
      if (isTriggered && onTrigger) onTrigger()
      else if (!isTriggered && onCancel) onCancel()
    }
  }

  function destroy() {
    if (rafId) cancelAnimationFrame(rafId)
    document.removeEventListener('touchmove', onDrag)
    document.removeEventListener('touchend', endDrag)
    document.removeEventListener('mousemove', onDrag)
    document.removeEventListener('mouseup', endDrag)
  }

  return {
    state,
    startDrag,
    onDrag,
    endDrag,
    destroy,
  }
}

export default useDrag
