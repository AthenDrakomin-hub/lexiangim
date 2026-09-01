/**
 * 乐享 UI/UX 高级交互组件库
 * 基于交互三要素：跟随（贴合手指轨迹）、阈值（合理触发边界）、吸附（自动完成闭环）
 *
 * 设计原则：多拆一层、多量一次、多等一帧
 * - 多拆一层：把复杂动画拆成多个简单的基础动画组合
 * - 多量一次：精准测量元素位置、距离、速度等参数，用数据驱动动画
 * - 多等一帧：关键操作后等待一帧再执行下一步，避免动画冲突
 */

// 核心 composable
export { default as useDrag } from '../composables/useDrag'

// 高优先级交互组件
export { default as SheetPanel } from './SheetPanel.vue'
export { default as ImageViewer } from './ImageViewer.vue'
export { default as PageTransition } from './PageTransition.vue'

/**
 * 10 种交互设计速查表
 *
 * 1. FAN 扇形展开 - 聊天页"+"号功能菜单
 *    核心：transform-origin 移到卡片外部，旋转展开
 *    实现：参考 SheetPanel + 自定义 transform-origin
 *
 * 2. INERTIA 滚轮选择器 - 表情/时间选择
 *    核心：分阶段处理：跟随滑动→惯性衰减→吸附到格
 *    实现：useDrag + requestAnimationFrame 惯性模拟
 *
 * 3. SHEET 半屏弹层 - 更多操作/群设置 ✅ 已实现
 *    核心：双判断条件（位移>50% 或 速度>阈值）
 *    组件：SheetPanel.vue
 *
 * 4. PARABOLA 抛物线飞入 - 收藏消息/添加好友动画
 *    核心：X轴匀速 + Y轴缓出，组合成抛物线
 *    实现：CSS animation 双轴不同步
 *
 * 5. COLLAPSE 大标题折叠 - 个人资料/群详情页滚动
 *    核心：所有动画挂在同一滚动进度上，保证视觉统一
 *    实现：scroll 事件驱动 transform/opacity 联动
 *
 * 6. REORDER 长按拖拽排序 - 会话置顶/常用联系人排序
 *    核心：只改数组槽位序号，transform 实现视觉跟随
 *    实现：useDrag + 数组重排 + FLIP 技术
 *
 * 7. FLIP 共享元素放大 - 图片查看器/头像放大 ✅ 已实现
 *    核心：先钉在原位，下一帧放开触发放大
 *    组件：ImageViewer.vue
 *
 * 8. STROKE 手写笔迹 - 手写消息/签名
 *    核心：getCoalescedEvents 补点 + 中点平滑
 *    实现：Canvas + PointerEvent.getCoalescedEvents()
 *
 * 9. STICKY 粘连拖拽 - 删除会话/撤回消息粘连效果
 *    核心：锚点距离控制丝粗细，超阈值断裂
 *    实现：useDrag + Canvas/SVG 动态绘制
 *
 * 10. PUSH 页面转场 - 所有页面跳转 ✅ 已实现
 *     核心：新页面和旧页面同时运动，旧页面位移+变暗
 *     组件：PageTransition.vue
 */
