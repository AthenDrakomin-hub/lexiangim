/**
 * jg-icon → @iconify/ic 映射表
 *
 * 左侧为项目中现有的 jg-icon-* 类名（去掉 "jg-icon-" 前缀），
 * 右侧为 unplugin-icons 自动导入的路径 key（去掉 "~icons/" 前缀）。
 *
 * 本项目使用 unplugin-icons + @iconify-json/ic（Material Design Rounded），
 * 配合 JgIcon.vue 组件自动按需加载。
 *
 * 用法：在组件中使用 <JgIcon name="search" /> 即可，无需手动 import。
 */

export const JG_ICON_MAP = {
  // 方向
  'arrow-left':     'ic/round-arrow-left',
  'arrow-right':    'ic/round-arrow-right',
  'arrow-right-af': 'ic/round-arrow-right',
  'arrow-up':       'ic/round-arrow-up',
  'arrow-down':     'ic/round-arrow-down',
  'menu-left':      'ic/round-menu-open',
  'menu-right':     'ic/round-menu-close',
  // 通用操作
  'close':          'ic/round-close',
  'search':         'ic/round-search',
  'add':            'ic/round-add',
  'subtract':       'ic/round-remove',
  'delete':         'ic/round-delete',
  'edit':           'ic/round-edit',
  'edit-pen':       'ic/round-edit',
  'check':          'ic/round-check',
  'copy':           'ic/round-content-copy',
  'reply':          'ic/round-reply',
  'recall':         'ic/round-archive',
  'send':           'ic/round-send',
  'settings':       'ic/round-settings',
  'clear':          'ic/round-clear',
  'retry':          'ic/round-refresh',
  'more':           'ic/round-more-horiz',
  'more-dot':       'ic/round-more-horiz',
  'more-list':      'ic/round-morevert',
  'share':          'ic/round-share',
  'forward':        'ic/round-forward',
  'forward-merge':  'ic/round-merge-type',
  'quote':          'ic/round-format-quote',
  'mark':           'ic/round-check-circle',
  'select-all':     'ic/round-select-all',
  'collapse':       'ic/round-unfold-less',
  // 用户 / 联系人
  'user':           'ic/round-person',
  'user-add':       'ic/round-person-add',
  'user-group':     'ic/round-groups',
  'user-status':    'ic/round-person-outline',
  'group':          'ic/round-group',
  'contact':        'ic/round-person-outline',
  'message':        'ic/round-chat',
  'msg':            'ic/round-message',
  'mention':        'ic/round-at',
  'logout':         'ic/round-logout',
  // 消息状态
  'read':           'ic/round-visibility',
  'unread':         'ic/round-visibility-off',
  'dot':            'ic/round-remove',
  'failed':         null,
  'notice':         'ic/round-notifications',
  'category':       'ic/round-folder',
  'operate':        'ic/round-tune',
  'block':          'ic/round-block',
  // 状态 / 反馈
  'success':        null,
  'success-square': 'ic/round-check-box',
  'warning':        null,
  'error':          null,
  'info':           'ic/round-info',
  'disabled':       null,
  'complete':       'ic/round-task-alt',
  // 媒体
  'image':          'ic/round-image',
  'file':           'ic/round-insert-drive-file',
  'video':          'ic/round-videocam',
  'emoji':          'ic/round-mood',
  'qrcode':         'ic/round-qr-code',
  // 开关 / 选项
  'circle':         'ic/round-radio-button-unchecked',
  'square':         'ic/round-square-root-alt',
  'radio':          'ic/round-radio-button-unchecked',
  'radio-select':   'ic/round-radio-button-checked',
  'circle-add':     'ic/round-add-circle',
  'circle-remove':  'ic/round-remove-circle',
  'asterisk':       'ic/round-asterisk',
  // 窗口控制
  'window-maximize':           'ic/round-crop-square',
  'window-minimize':           'ic/round-minimize',
  'window-hide':               'ic/round-visibility-off',
  'window-close':              'ic/round-close',
  // 消息操作
  'top':      'ic/round-push-pin',
  'untop':    'ic/round-push-pin',
  'pin':      'ic/round-push-pin',
  'top-s':    'ic/round-push-pin',
  'favorite': 'ic/round-favorite',
  // 菜单
  'menu-edit':  'ic/round-edit',
  'menu-add':   'ic/round-add',
  // 标签 / 话题
  'tag': 'ic/round-label',
  // RTC
  'rtc-add':            'ic/round-add-call',
  'mic':                'ic/round-mic',
  'mic-mute':           'ic/round-mic-off',
  'camera':             'ic/round-videocam',
  'camera-mute':        'ic/round-videocam-off',
  'call-outgoing':      'ic/round-call',
  'call-incoming':      'ic/round-call-received',
  'call-hangup':        'ic/round-call-end',
  'speaker':            'ic/round-volume-up',
  'call-accept':        'ic/round-call',
  'call-end':           'ic/round-call-end',
  'mute':               'ic/round-volume-off',
  'unmute':             'ic/round-volume-up',
  'sound-off':          'ic/round-volume-off',
  // 特殊业务
  'bot':            'ic/round-smart-toy',
  'security':       'ic/round-security',
  'security-sum':   'ic/round-security',
  'history-contact':'ic/round-history',
  'history-msg':    'ic/round-chat-bubble',
  'history-settings':'ic/round-settings-browse',
  'plus-wide':      'ic/round-add',
  'add-w600':       'ic/round-add',
  'ai':             null,
  'hot':            'ic/round-local-fire-depot',
  'min':            'ic/round-remove',
  'message-square': 'ic/round-message',
  // 气泡
  'bubble-a': 'ic/round-chat-bubble',
  'bubble-b': 'ic/round-chat-bubble',
  'svg':      null,
}

/**
 * 有自定义 CSS 样式的图标（保留原始 .wr.jg-icon-* 渲染）
 * 这些图标在 JgIcon 中会降级为原始渲染方式
 */
export const JG_ICON_SPECIAL = new Set([
  'ai',     // 渐变彩虹效果
  'hot',    // 红色火焰（双层内容）
  'failed', // 红色错误（自定义 content）
  'success',// 绿色成功（自定义 content + color）
  'error',  // 红色错误（自定义 content + color）
  'warning',// 橙色警告（自定义 content + color）
  'disabled',// 灰色禁用（仅 color 覆盖）
])
