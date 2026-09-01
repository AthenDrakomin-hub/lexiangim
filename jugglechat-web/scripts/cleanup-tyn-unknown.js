#!/usr/bin/env node
/**
 * 自动重命名剩余 tyn-* 类为 jg-*（批量补全）
 *
 * 规则：
 *   1. 在 Vue 模板和 CSS 中同时出现的类 → 双向替换（CSS 选择器 + Vue class）
 *   2. 仅在 CSS 中出现的工具类 → 只重命名 CSS 定义（无 Vue 引用）
 *   3. 未在映射表中的高频结构类（>= 5 次使用）→ 加入 STRUCTURAL_CLASSES
 *
 * 用法:
 *   node scripts/cleanup-tyn-unknown.js
 */

const fs = require('fs');
const path = require('path');

const SRC_DIR = path.join(__dirname, '..', 'src');

// ─── 待处理的类（来自 unknown 列表，按规则分类）───
// 每组: [oldName, newName, type]
//   type: 'both' = Vue + CSS 同时存在，需要双向替换
//   type: 'css-only' = 只在 CSS 定义，无 Vue 引用
const CLASSES_TO_FIX = [
  // --- 双向替换（Vue + CSS）---
  ['tyn-file',       'jg-file',       'both'],
  ['tyn-footer',     'jg-footer',     'both'],
  ['tyn-header-create-list', 'jg-header-create-list', 'both'],
  ['tyn-message-refer', 'jg-message-refer', 'both'],
  ['tyn-topitem-avatar', 'jg-topitem-avatar', 'both'],
  ['tyn-topitem-name',   'jg-topitem-name',   'both'],
  ['tyn-conversation-input', 'jg-conversation-input', 'both'],
  ['tyn-media-option-list', 'jg-media-option-list', 'both'],
  ['tyn-content-active', 'jg-content-active', 'both'],
  ['tyn-reply-link-thumb', 'jg-reply-link-thumb', 'both'],
  ['tyn-aside-button', 'jg-aside-button', 'both'],
  ['tyn-chat-none-bg', 'jg-chat-none-bg', 'both'],
  // --- CSS only（无 Vue 引用，纯样式工具类）---
  ['tyn-media-1x1_1',  'jg-media-1x1-1',  'css-only'],
  ['tyn-media-1_1x1',  'jg-media-1x1-1',  'css-only'],
  ['tyn-media-1x1_2',  'jg-media-1x2-1',  'css-only'],
  ['tyn-media-1_2x1',  'jg-media-2x1-1',  'css-only'],
  ['tyn-media-1x1_3',  'jg-media-1x3-1',  'css-only'],
  ['tyn-media-1_3x1',  'jg-media-3x1-1',  'css-only'],
  ['tyn-aside-item-bubbly', 'jg-aside-item-bubbly', 'css-only'],
];

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

function relPath(fp) {
  return fp.replace(/\\/g, '/').replace(SRC_DIR.replace(/\\/g, '/') + '/', '');
}

function main() {
  console.log('='.repeat(60));
  console.log('  清理剩余 tyn-* 未知类 → jg-*');
  console.log('='.repeat(60));
  console.log();

  const allFiles = walkDir(SRC_DIR, f => /\.(vue|css)$/.test(f));
  let totalChanges = 0;

  for (const [oldName, newName, type] of CLASSES_TO_FIX) {
    let fileChanges = 0;
    for (const fp of allFiles) {
      const content = fs.readFileSync(fp, 'utf8');
      if (!content.includes(oldName)) continue;

      // 对于 'both' 类型：替换 Vue 模板中的 class 和 CSS 中的选择器
      // 对于 'css-only' 类型：同样替换（只是没有 Vue 引用）
      // CSS 选择器替换: .tyn-xxx → .jg-xxx
      // Vue class 引用替换: class="... tyn-xxx ..." → class="... jg-xxx ..."
      const newContent = content
        .replace(new RegExp(`\\b${oldName}\\b`, 'g'), newName);

      if (newContent === content) continue;

      const changes = (content.match(new RegExp(`\\b${oldName}\\b`, 'g')) || []).length;
      fs.writeFileSync(fp, newContent, 'utf8');
      console.log(`  ✅ ${relPath(fp)}: ${oldName} → ${newName} (${changes} 处)`);
      fileChanges += changes;
      totalChanges++;
    }
    if (fileChanges === 0) {
      console.log(`  ⏭ ${oldName} → ${newName}: 未找到引用（可能是 CSS-only 且已迁移）`);
    }
  }

  // 更新 scan-tyn-to-jg.js 的 STRUCTURAL_CLASSES 列表，加入已知的结构类
  const structClassesToAdd = [
    'tyn-file', 'tyn-footer', 'tyn-header-create-list', 'tyn-message-refer',
    'tyn-topitem-avatar', 'tyn-topitem-name', 'tyn-conversation-input',
    'tyn-media-option-list', 'tyn-content-active', 'tyn-reply-link-thumb',
    'tyn-aside-button', 'tyn-chat-none-bg', 'tyn-aside-item-bubbly',
  ];
  const scriptPath = path.join(__dirname, 'scan-tyn-to-jg.js');
  let scriptContent = fs.readFileSync(scriptPath, 'utf8');

  let updatedStruct = false;
  for (const cls of structClassesToAdd) {
    if (!scriptContent.includes(`'${cls}'`)) {
      // 在 STRUCTURAL_CLASSES 末尾添加
      scriptContent = scriptContent.replace(
        /('tyn-chat-none-bg'\s*,\n\s*\])/,
        `'tyn-chat-none-bg',\n  '${cls}',\n]);`
      );
      updatedStruct = true;
    }
  }

  if (updatedStruct) {
    fs.writeFileSync(scriptPath, scriptContent, 'utf8');
    console.log(`\n  ✅ 已更新 scan-tyn-to-jg.js: 将 ${structClassesToAdd.length} 个类加入 STRUCTURAL_CLASSES`);
  } else {
    console.log(`\n  ⏭ scan-tyn-to-jg.js: STRUCTURAL_CLASSES 已包含所有目标类`);
  }

  console.log(`\n🎉 完成！共处理 ${totalChanges} 处文件变更`);
}

main();
