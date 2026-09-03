#!/usr/bin/env node
/**
 * JgIcon 图标迁移分析脚本
 * 扫描 src/ 下所有 .vue 文件，统计 jg-icon-* 使用情况
 *
 * 用法:
 *   node scripts/scan-jg-icons.js              # 分析报告
 *   node scripts/scan-jg-icons.js --json       # JSON 格式输出
 */

const fs = require('fs');
const path = require('path');

const SRC_DIR = path.join(__dirname, '..', 'src');

// ─── 完整映射表 ──────────────────────────────────────────────────────────────
const ICON_MAP = {
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
  // 用户/联系人
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
  'notice':         'ic/round-notifications',
  'category':       'ic/round-folder',
  'operate':        'ic/round-tune',
  'block':          'ic/round-block',
  // 状态/反馈
  'success':        'ic/round-check-circle',
  'success-square': 'ic/round-check-box',
  'warning':        'ic/round-warning',
  'error':          'ic/round-error',
  'info':           'ic/round-info',
  'disabled':       'ic/round-highlight-off',
  'complete':       'ic/round-task-alt',
  // 媒体
  'image':          'ic/round-image',
  'file':           'ic/round-insert-drive-file',
  'video':          'ic/round-videocam',
  'emoji':          'ic/round-mood',
  'qrcode':         'ic/round-qr-code',
  // 开关/选项
  'circle':         'ic/round-radio-button-unchecked',
  'square':         'ic/round-square-root-alt',
  'radio':          'ic/round-radio-button-unchecked',
  'radio-select':   'ic/round-radio-button-checked',
  'circle-add':     'ic/round-add-circle',
  'circle-remove':  'ic/round-remove-circle',
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
  // 标签
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
  'hot':            'ic/round-local-fire-depot',
  'min':            'ic/round-remove',
  'message-square': 'ic/round-message',
  // 气泡
  'bubble-a': 'ic/round-chat-bubble',
  'bubble-b': 'ic/round-chat-bubble',
  // 其他
  'asterisk':  'ic/round-asterisk',
  'user-st':   'ic/round-person-outline',
  'svg':       null,
};

// 有特殊 CSS 样式的图标（保留原 .wr.jg-icon-* 渲染）
const SPECIAL_ICONS = new Set(['ai', 'hot', 'failed', 'success', 'error', 'warning', 'disabled']);

// ─── 工具函数 ────────────────────────────────────────────────────────────────
function walkDir(dir, filter) {
  const results = [];
  function _walk(d) {
    for (const entry of fs.readdirSync(d, { withFileTypes: true })) {
      const fp = path.join(d, entry.name);
      if (entry.isDirectory()) { _walk(fp); continue; }
      if (!filter(entry.name)) continue;
      results.push(fp);
    }
  }
  _walk(dir);
  return results;
}

function relPath(abs) {
  return abs.replace(/\\/g, '/').replace(SRC_DIR.replace(/\\/g, '/') + '/', '');
}

// ─── 扫描 ────────────────────────────────────────────────────────────────────
function scan() {
  const files = walkDir(SRC_DIR, f => /\.vue$/.test(f));
  const usage = {};
  for (const fp of files) {
    const content = fs.readFileSync(fp, 'utf8');
    const matches = content.match(/\bjg-icon-[\w-]+\b/g) || [];
    const rel = relPath(fp);
    for (const cls of matches) {
      const icon = cls.replace('jg-icon-', '');
      if (!usage[icon]) usage[icon] = { count: 0, files: new Set() };
      usage[icon].count++;
      usage[icon].files.add(rel);
    }
  }
  return { usage, files };
}

// ─── 主流程 ───────────────────────────────────────────────────────────────────
function main() {
  const JSON_OUT = process.argv.includes('--json');
  const { usage, files } = scan();
  const sorted = Object.entries(usage).sort((a, b) => b[1].count - a[1].count);

  const mapped     = sorted.filter(([icon]) => ICON_MAP[icon] !== undefined && !SPECIAL_ICONS.has(icon));
  const special    = sorted.filter(([icon]) => SPECIAL_ICONS.has(icon));
  const unmapped   = sorted.filter(([icon]) => !ICON_MAP[icon] && !SPECIAL_ICONS.has(icon));

  if (JSON_OUT) {
    console.log(JSON.stringify({
      summary: { totalFiles: files.length, totalIcons: sorted.length, mapped: mapped.length, special: special.length, unmapped: unmapped.length },
      mapped: mapped.map(([icon, info]) => ({ icon, ic: ICON_MAP[icon] ? ICON_MAP[icon].replace('ic/round-', '') : '(特殊)', count: info.count })),
      special: special.map(([icon]) => ({ icon })),
      unmapped: unmapped.map(([icon]) => ({ icon })),
    }, null, 2));
    return;
  }

  console.log('='.repeat(70));
  console.log('  JgIcon 图标迁移分析');
  console.log('='.repeat(70));
  console.log(`\n📊 扫描 Vue 文件: ${files.length}`);
  console.log(`   唯一图标数量:    ${sorted.length}`);
  console.log(`   可替换 (ic):     ${mapped.length}`);
  console.log(`   特殊保留 (CSS):  ${special.length}`);
  console.log(`   未找到映射:      ${unmapped.length}`);

  if (mapped.length > 0) {
    console.log('\n┌' + '─'.repeat(68) + '┐');
    console.log('│  🔄 可替换图标（按使用频次排序）                           │');
    console.log('├' + '─'.repeat(68) + '┤');
    console.log(`│ ${'jg-icon 名称'.padEnd(20)} ${'IC 图标名'.padEnd(24)} ${'频次'.padStart(5)} │`);
    console.log('├' + '─'.repeat(68) + '┤');
    for (const [icon, info] of mapped) {
      const icName = ICON_MAP[icon] ? ICON_MAP[icon].replace('ic/round-', '') : '(特殊)';
      console.log(`│ ${icon.padEnd(20)} ${icName.padEnd(24)} ${String(info.count).padStart(5)} │`);
    }
    console.log('└' + '─'.repeat(68) + '┘');
  }

  if (special.length > 0) {
    console.log('\n⚠️  特殊图标（保留 .wr.jg-icon-* CSS 渲染）:');
    for (const [icon] of special) console.log(`   jg-icon-${icon}`);
  }

  if (unmapped.length > 0) {
    console.log('\n❓ 未找到映射的图标（需补充到 ICON_MAP）:');
    for (const [icon] of unmapped) console.log(`   jg-icon-${icon}`);
  }

  console.log('\n💡 迁移指南:');
  console.log('   1. 将 <i class="wr jg-icon-xxx"> 替换为 <JgIcon name="xxx" />');
  console.log('   2. 在 <script setup> 中添加: import JgIcon from "@/components/JgIcon.vue"');
  console.log('   3. 特殊图标 (ai/hot/failed 等) 保持原有 .wr.jg-icon-* 不变');
  console.log('   4. 运行 node scripts/scan-jg-icons.js --json 获取完整映射数据');
}

main();
