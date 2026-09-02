#!/usr/bin/env node
/**
 * wr-* → jg-icon-* 图标类名迁移工具
 *
 * 扫描 src/ 下所有 .vue 和 .css 文件，将旧图标类名替换为新命名规范。
 *
 * 用法:
 *   node scripts/migrate-icons.js                      # 分析 + 生成报告
 *   node scripts/migrate-icons.js --dry-run             # 预览所有替换（不写入）
 *   node scripts/migrate-icons.js --apply               # 执行替换
 *   node scripts/migrate-icons.js --json                # 输出 JSON 格式
 */

const fs = require('fs');
const path = require('path');

// ─── CLI 参数 ────────────────────────────────────────────────────────────────
const args = process.argv.slice(2);
const DRY_RUN = args.includes('--dry-run');
const APPLY   = args.includes('--apply') && !DRY_RUN;
const JSON_OUT = args.includes('--json');

const SRC_DIR    = path.join(__dirname, '..', 'src');
const CSS_DIR    = path.join(SRC_DIR, 'assets', 'css');

// ─── 完整映射表 ──────────────────────────────────────────────────────────────
/**
 * wr-* 图标类名 → jg-icon-* 新命名映射
 * key: 原类名（不含点号），value: 新类名
 */
const MAPPING = {
  // 方向类
  'wr-left':       'jg-icon-arrow-left',
  'wr-right':      'jg-icon-arrow-right',
  'wr-up':         'jg-icon-arrow-up',
  'wr-down':       'jg-icon-arrow-down',
  'wr-right-af':   'jg-icon-arrow-right',

  // 操作类
  'wr-more':       'jg-icon-more',
  'wr-more-dot':   'jg-icon-more',
  'wr-more-list':  'jg-icon-more-list',
  'wr-close':      'jg-icon-close',
  'wr-search':     'jg-icon-search',
  'wr-plus':       'jg-icon-add',
  'wr-jian':       'jg-icon-subtract',
  'wr-delete':     'jg-icon-delete',
  'wr-edit':       'jg-icon-edit',
  'wr-modify':     'jg-icon-edit',
  'wr-modify-a':   'jg-icon-edit',
  'wr-modify-pen': 'jg-icon-edit',
  'wr-check':      'jg-icon-check',
  'wr-dui':        'jg-icon-check',
  'wr-copy':       'jg-icon-copy',
  'wr-forward':    'jg-icon-forward',
  'wr-transfer':   'jg-icon-forward',
  'wr-transfer-merge': 'jg-icon-forward-merge',
  'wr-reply':      'jg-icon-reply',
  'wr-huixing':    'jg-icon-reply',
  'wr-recall':     'jg-icon-recall',
  'wr-emoji':      'jg-icon-emoji',
  'wr-smile':      'jg-icon-emoji',
  'wr-image':      'jg-icon-image',
  'wr-file':       'jg-icon-file',
  'wr-chat-file':  'jg-icon-file',
  'wr-video':      'jg-icon-video',
  'wr-chat-smile': 'jg-icon-emoji',
  'wr-send':       'jg-icon-send',
  'wr-submit':     'jg-icon-send',
  'wr-setting':    'jg-icon-settings',
  'wr-config':     'jg-icon-settings',
  'wr-user':       'jg-icon-user',
  'wr-adduser':    'jg-icon-user-add',
  'wr-group':      'jg-icon-group',
  'wr-logout':     'jg-icon-logout',
  'wr-notice':     'jg-icon-notice',
  'wr-contact':    'jg-icon-contact',
  'wr-message':    'jg-icon-message',
  'wr-category':   'jg-icon-category',
  'wr-operate':    'jg-icon-operate',
  'wr-block':      'jg-icon-block',
  'wr-share':      'jg-icon-share',
  'wr-mark':       'jg-icon-mark',

  // 状态类
  'wr-success':    'jg-icon-success',
  'wr-success-square': 'jg-icon-success-square',
  'wr-warning':    'jg-icon-warning',
  'wr-error':      'jg-icon-error',
  'wr-warn':       'jg-icon-warning',
  'wr-failed':     'jg-icon-failed',
  'wr-info':       'jg-icon-info',
  'wr-disabled':   'jg-icon-disabled',

  // 消息气泡相关（特殊，不重命名，保留原样式）
  'wr-bubble-a':   'jg-icon-bubble-a',
  'wr-bubble-b':   'jg-icon-bubble-b',

  // 选中/单选/复选
  'wr-circle':     'jg-icon-circle',
  'wr-square':     'jg-icon-square',
  'wr-radio':      'jg-icon-radio',
  'wr-radio-select': 'jg-icon-radio-selected',
  'wr-cir-add':    'jg-icon-circle-add',
  'wr-cir-remove': 'jg-icon-circle-remove',
  'wr-asterisk':   'jg-icon-asterisk',

  // 全选/标记
  'wr-select-all': 'jg-icon-select-all',

  // 窗口控制
  'wr-win-max':    'jg-icon-window-maximize',
  'wr-win-min':    'jg-icon-window-minimize',
  'wr-win-hide':   'jg-icon-window-hide',
  'wr-win-close':  'jg-icon-window-close',

  // 置顶/收藏
  'wr-top':        'jg-icon-top',
  'wr-untop':      'jg-icon-untop',
  'wr-top-s':      'jg-icon-pin',
  'wr-fav':        'jg-icon-favorite',

  // 菜单
  'wr-menu-left':  'jg-icon-menu-left',
  'wr-menu-right': 'jg-icon-menu-right',
  'wr-menu-modify': 'jg-icon-menu-edit',
  'wr-menu-add':   'jg-icon-menu-add',

  // 群组相关
  'wr-mg-mention': 'jg-icon-mention',
  'wr-mg-msg':     'jg-icon-msg',
  'wr-mg-tag':     'jg-icon-tag',
  'wr-mg-user':    'jg-icon-user-group',
  'wr-mg-group':   'jg-icon-group',
  'wr-mg-unread':  'jg-icon-unread',

  // 消息状态
  'wr-read':       'jg-icon-read',
  'wr-dot':        'jg-icon-dot',
  'wr-fang':       'jg-icon-quote',
  'wr-subtract':   'jg-icon-subtract',
  'wr-clear':      'jg-icon-clear',

  // 音视频/RTC
  'wr-rtc-add':    'jg-icon-rtc-add',
  'wr-rtc-mic':    'jg-icon-mic',
  'wr-rtc-mutemic':'jg-icon-mic-mute',
  'wr-rtc-camera': 'jg-icon-camera',
  'wr-rtc-mutecamera': 'jg-icon-camera-mute',
  'wr-rtc-status-outgoing': 'jg-icon-call-outgoing',
  'wr-rtc-status-incoming': 'jg-icon-call-incoming',
  'wr-rtc-status-hangup':    'jg-icon-call-hangup',
  'wr-rtc-ummutespeaker': 'jg-icon-speaker',
  'wr-rtc-accept':  'jg-icon-call-accept',
  'wr-rtc-hangup':  'jg-icon-call-end',
  'wr-mute':       'jg-icon-mute',
  'wr-unmute':     'jg-icon-unmute',
  'wr-soundoff':   'jg-icon-sound-off',
  'wr-complete':   'jg-icon-complete',

  // 用户相关
  'wr-user-st':    'jg-icon-user-status',
  'wr-bot':        'jg-icon-bot',
  'wr-security':   'jg-icon-security',
  'wr-security-sum': 'jg-icon-security-summary',
  'wr-hcontact':   'jg-icon-history-contact',
  'wr-hmsg':       'jg-icon-history-msg',
  'wr-hsetting':   'jg-icon-history-settings',
  'wr-plus-w600':  'jg-icon-plus-wide',
  'wr-qrcode':     'jg-icon-qrcode',
  'wr-gpt':        'jg-icon-ai',
  'wr-retry':      'jg-icon-retry',
  'wr-fire':       'jg-icon-hot',
  'wr-fire2':      'jg-icon-hot',
  'wr-min':        'jg-icon-min',

  // 消息回复（与 wr-reply/huixing 语义相同）
  'wr-message-square': 'jg-icon-reply',

  // 收起
  'wr-shouqi':     'jg-icon-collapse',
};

// ─── 工具函数 ────────────────────────────────────────────────────────────────
function walkDir(dir, fileFilter) {
  const results = [];
  function _walk(d) {
    for (const entry of fs.readdirSync(d, { withFileTypes: true })) {
      const fp = path.join(d, entry.name);
      if (entry.isDirectory()) { _walk(fp); continue; }
      if (!fileFilter(entry.name)) continue;
      results.push(fp);
    }
  }
  _walk(dir);
  return results;
}

function getRelativePath(absPath) {
  return absPath.replace(/\\/g, '/').replace(SRC_DIR.replace(/\\/g, '/') + '/', '');
}

/** 扫描所有文件，统计 wr-* 类使用情况 */
function scanWrUsage() {
  const allFiles = walkDir(SRC_DIR, f => /\.(vue|css)$/.test(f));
  const usage = {};
  for (const fp of allFiles) {
    const content = fs.readFileSync(fp, 'utf8');
    const matches = content.match(/\bwr-[a-zA-Z][\w-]*\b/g) || [];
    const relPath = getRelativePath(fp);
    for (const cls of matches) {
      if (!usage[cls]) usage[cls] = { count: 0, files: new Set(), ext: path.extname(fp) };
      usage[cls].count++;
      usage[cls].files.add(relPath);
    }
  }
  return { usage, allFiles };
}

/** 对单个文件执行替换（返回替换次数） */
function applyToFile(filePath, mapping, dryRun) {
  let content = fs.readFileSync(filePath, 'utf8');
  let totalReplacements = 0;
  const changedEntries = [];

  for (const [oldCls, newCls] of Object.entries(mapping)) {
    const regex = new RegExp(`\\b${oldCls}\\b`, 'g');
    const matches = content.match(regex);
    if (!matches) continue;

    const count = matches.length;
    totalReplacements += count;
    changedEntries.push({ from: oldCls, to: newCls, count });
    content = content.replace(regex, newCls);
  }

  if (totalReplacements > 0 && !dryRun) {
    fs.writeFileSync(filePath, content, 'utf8');
  }

  return { totalReplacements, changedEntries };
}

// ─── 主要逻辑 ────────────────────────────────────────────────────────────────
function main() {
  const mode = DRY_RUN ? '--dry-run (预览模式)' : APPLY ? '--apply (执行模式)' : '分析模式';

  console.log('='.repeat(72));
  console.log('  wr-* → jg-icon-* 图标类名迁移工具');
  console.log(`  模式: ${mode}`);
  console.log('='.repeat(72));
  console.log();

  console.log('📊 扫描 src/ 下所有 .vue 和 .css 文件...');
  const { usage, allFiles } = scanWrUsage();
  const sorted = Object.entries(usage).sort((a, b) => b[1].count - a[1].count);

  // 分类：可映射 vs 未映射
  const mapped = [];
  const unmapped = [];

  for (const [cls, info] of sorted) {
    if (MAPPING[cls]) {
      mapped.push({
        class: cls,
        targetClass: MAPPING[cls],
        count: info.count,
        files: [...info.files],
        ext: info.ext,
      });
    } else {
      unmapped.push({ class: cls, count: info.count, files: [...info.files], ext: info.ext });
    }
  }

  // JSON 输出
  if (JSON_OUT) {
    console.log(JSON.stringify({
      summary: {
        totalFiles: allFiles.length,
        totalUniqueWrClasses: sorted.length,
        mappedCount: mapped.length,
        unmappedCount: unmapped.length,
        totalReplacements: mapped.reduce((s, m) => s + m.count, 0),
        mode,
      },
      mapping: mapped.map(m => ({ from: m.class, to: m.targetClass, count: m.count })),
      unmapped: unmapped.map(u => ({ class: u.class, count: u.count, ext: u.ext })),
    }, null, 2));
    return;
  }

  // ─── 报告 ─────────────────────────────────────────────────────────────────
  console.log(`\n📈 统计摘要:`);
  console.log(`   扫描文件数:        ${allFiles.length}`);
  console.log(`   wr-* 类总数:       ${sorted.length} 个唯一类`);
  console.log(`   可迁移类:          ${mapped.length} 个`);
  console.log(`   未映射类:          ${unmapped.length} 个`);
  console.log(`   预计替换次数:      ${mapped.reduce((s, m) => s + m.count, 0)}`);
  console.log(`   执行模式:          ${mode}`);
  console.log();

  // ─── 映射表 ───────────────────────────────────────────────────────────────
  if (mapped.length > 0) {
    console.log('┌' + '─'.repeat(70) + '┐');
    console.log('│  🔄 迁移映射表（按使用频次排序）                              │');
    console.log('├' + '─'.repeat(70) + '┤');
    console.log(`│ ${'源类名'.padEnd(24)} ${'目标类名'.padEnd(24)} ${'频次'.padStart(6)} │`);
    console.log('├' + '─'.repeat(70) + '┤');
    for (const m of mapped) {
      console.log(`│ ${m.class.padEnd(24)} ${m.targetClass.padEnd(24)} ${String(m.count).padStart(6)} │`);
    }
    console.log('└' + '─'.repeat(70) + '┘');
    console.log();
  }

  // ─── 未映射类 ─────────────────────────────────────────────────────────────
  if (unmapped.length > 0) {
    console.log('⚠️  未在映射表中的 wr-* 类（需手动确认）:');
    for (const u of unmapped) {
      console.log(`   ${u.class} (使用 ${u.count} 次, ${u.ext})`);
    }
    console.log();
  }

  // ─── Dry-run: 显示文件级变更 ───────────────────────────────────────────────
  if (DRY_RUN && mapped.length > 0) {
    console.log('📋 --dry-run: 将修改的文件预览\n');
    const fileChanges = {};

    for (const m of mapped) {
      for (const f of m.files) {
        if (!fileChanges[f]) fileChanges[f] = [];
        fileChanges[f].push({ from: m.class, to: m.targetClass });
      }
    }

    for (const [file, changes] of Object.entries(fileChanges)) {
      console.log(`  ${file} (${changes.length} 种类别)`);
      const fp = path.join(SRC_DIR, file);
      if (!fs.existsSync(fp)) continue;
      const content = fs.readFileSync(fp, 'utf8');
      const lines = content.split('\n');
      for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        let modifiedLine = line;
        for (const c of changes) {
          modifiedLine = modifiedLine.replace(new RegExp(`\\b${c.from}\\b`, 'g'), c.to);
        }
        if (modifiedLine !== line) {
          const preview = line.trim().substring(0, 80);
          const previewMod = modifiedLine.trim().substring(0, 80);
          console.log(`    L${String(i + 1).padStart(4)}: ${preview}`);
          if (preview !== previewMod) {
            console.log(`         → ${previewMod}`);
          }
        }
      }
      console.log();
    }
    console.log('💡 确认无误后，使用 --apply 执行实际替换');
  }

  // ─── Apply: 执行替换 ──────────────────────────────────────────────────────
  if (APPLY && mapped.length > 0) {
    console.log('🔧 执行替换...\n');
    const changedFiles = {};

    const filesToProcess = walkDir(SRC_DIR, f => /\.(vue|css)$/.test(f));
    for (const fp of filesToProcess) {
      const relPath = getRelativePath(fp);
      const result = applyToFile(fp, MAPPING, false);
      if (result.totalReplacements > 0) {
        changedFiles[relPath] = result.changedEntries;
        console.log(`  ✅ ${relPath}`);
        for (const entry of result.changedEntries) {
          console.log(`     ${entry.from} → ${entry.to} (${entry.count} 处)`);
        }
      }
    }

    // 生成迁移报告
    const reportLines = [];
    reportLines.push('迁移报告');
    reportLines.push('========');
    reportLines.push(`扫描文件数: ${allFiles.length}`);
    reportLines.push(`替换次数: ${mapped.reduce((s, m) => s + m.count, 0)}`);
    reportLines.push('涉及文件:');
    for (const [file, changes] of Object.entries(changedFiles)) {
      const total = changes.reduce((s, c) => s + c.count, 0);
      reportLines.push(`  - ${file} (${total}处)`);
    }

    const reportPath = path.join(__dirname, '..', 'migration-report.txt');
    if (!DRY_RUN) {
      fs.writeFileSync(reportPath, reportLines.join('\n'), 'utf8');
      console.log(`\n📄 迁移报告已保存至: ${reportPath}`);
    }

    console.log(`\n🎉 完成！共修改 ${Object.keys(changedFiles).length} 个文件`);
  }

  if (!DRY_RUN && !APPLY) {
    console.log('💡 下一步操作:');
    console.log('   预览替换:  node scripts/migrate-icons.js --dry-run');
    console.log('   执行替换:  node scripts/migrate-icons.js --apply');
  }
}

main();
