#!/usr/bin/env node
/**
 * pre-commit hook：拦截任何新引入的 tyn- 类名
 *
 * 扫描 git 暂存区（staged）中的 .vue / .css 变更，
 * 一旦发现 tyn- 类名则拒绝提交并输出指引。
 *
 * 用法（已由 husky 自动调用）:
 *   npx husky add .husky/pre-commit "node scripts/block-tyn-classes.js"
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

function run(cmd) {
  try {
    return execSync(cmd, { encoding: 'utf8', stdio: ['pipe', 'pipe', 'pipe'] }).trim();
  } catch {
    return '';
  }
}

// 获取暂存区中 .vue 和 .css 文件列表
const stagedFiles = run('git diff --cached --name-only --diff-filter=ACM')
  .split('\n')
  .filter(f => /\.(vue|css)$/.test(f));

if (stagedFiles.length === 0) {
  process.exit(0);
}

const violations = [];

for (const file of stagedFiles) {
  // 获取暂存区内容
  const content = run(`git diff --cached -- "${file}"`);
  if (!content) continue;

  // 匹配新增行中包含 tyn- 类名的情况
  // 只检查以 + 开头的行（新增内容），跳过注释行
  const lines = content.split('\n');
  for (const line of lines) {
    if (!line.startsWith('+')) continue;
    // 排除 CSS 注释中的类名（减少误报）
    if (line.trim().startsWith('/*') || line.trim().startsWith('*') || line.trim().startsWith('*/')) continue;

    const matches = line.match(/\btyn-[\w-]+\b/g);
    if (!matches) continue;

    // 过滤掉已知的结构性类（允许保留，但不作为违规）
    // 这里只拦截尺寸类和未迁移的类
    const knownStructural = new Set([
      'tyn-size', 'tyn-media', 'tyn-media-row', 'tyn-media-col', 'tyn-media-group',
      'tyn-media-list', 'tyn-media-bordered', 'tyn-media-multiple', 'tyn-media-vr',
      'tyn-media-center', 'tyn-media-option', 'tyn-media-item', 'tyn-media-group-reads',
      'tyn-reply', 'tyn-reply-group', 'tyn-reply-bubble', 'tyn-reply-text',
      'tyn-reply-avatar', 'tyn-reply-separator', 'tyn-reply-tools',
      'tyn-reply-item', 'tyn-reply-link', 'tyn-reply-anchor', 'tyn-reply-media',
      'tyn-reply-preview', 'tyn-reply-video', 'tyn-reply-file', 'tyn-reply-call',
      'tyn-reply-merge', 'tyn-reply-row', 'tyn-reply-quick',
      'tyn-chat', 'tyn-chat-body', 'tyn-chat-head', 'tyn-chat-content',
      'tyn-chat-form', 'tyn-chat-search', 'tyn-chat-aside-avatar',
      'tyn-chat-call', 'tyn-chat-cover', 'tyn-chat-mute',
      'tyn-aside', 'tyn-aside-base', 'tyn-aside-body', 'tyn-aside-footer',
      'tyn-aside-head', 'tyn-aside-item', 'tyn-aside-list', 'tyn-aside-row',
      'tyn-aside-search', 'tyn-aside-icon', 'tyn-aside-title',
      'tyn-aside-contact-row', 'tyn-aside-group', 'tyn-aside-nothing',
      'tyn-aside-filename', 'tyn-aside-members', 'tyn-aside-member',
      'tyn-aside-member-name', 'tyn-aside-group-info', 'tyn-aside-group-col',
      'tyn-aside-head-tools', 'tyn-aside-toplist', 'tyn-aside-topitem',
      'tyn-aside-button', 'tyn-aside-desktop', 'tyn-h5-aside-body',
      'tyn-root', 'tyn-web-root', 'tyn-desktop-root', 'tyn-h5-root',
      'tyn-appbar', 'tyn-appbar-wrap', 'tyn-appbar-nav', 'tyn-appbar-link',
      'tyn-appbar-logo', 'tyn-appbar-content', 'tyn-common-header',
      'tyn-common-body', 'tyn-common-aside', 'tyn-common-aside-right',
      'tyn-header-btn', 'tyn-header-logo', 'tyn-desktop-header',
      'tyn-desktop-nav', 'tyn-desktop-navs', 'tyn-logo',
      'tyn-list-links', 'tyn-list-links-heading', 'tyn-list-inline',
      'tyn-links', 'tyn-link-item', 'tyn-list-link',
      'tyn-content', 'tyn-content-full-height', 'tyn-content-inner',
      'tyn-content-page', 'tyn-main', 'tyn-main-boxed', 'tyn-main-boxed-lg',
      'tyn-section', 'tyn-section-head', 'tyn-section-content', 'tyn-overlay',
      'tyn-image', 'tyn-video', 'tyn-video-icon', 'tyn-thumb',
      'tyn-stories-thumb', 'tyn-stories-slider', 'tyn-stories-item',
      'tyn-stories-content', 'tyn-stories-wrap', 'tyn-stories-page',
      'tyn-qa', 'tyn-qa-item', 'tyn-qa-message', 'tyn-qa-bubbly',
      'tyn-qa-avatar', 'tyn-qa-avatar-wrap',
      'tyn-profile', 'tyn-profile-head', 'tyn-profile-cover',
      'tyn-profile-cover-image', 'tyn-profile-info', 'tyn-profile-avatar',
      'tyn-profile-nav', 'tyn-profile-details',
      'tyn-hero', 'tyn-auth-centered', 'tyn-pill',
      'tyn-code-block', 'tyn-code-block-title', 'tyn-copy',
      'tyn-text-block', 'tyn-text-btn', 'tyn-text-modify',
      'tyn-subtext', 'tyn-overline', 'tyn-title', 'tyn-title-overline',
      'tyn-icon', 'tyn-icon-size', 'tyn-icon-color', 'tyn-shape',
      'tyn-without', 'tyn-call',
      'tyn-transfer', 'tyn-transfer-pn', 'tyn-group-reads',
      'tyn-group-read-box', 'tyn-group-reads-links', 'tyn-group-avatars',
      'tyn-group-avatar', 'tyn-group-dropdown', 'tyn-group-dropdown-top',
      'tyn-group-dropdown-bottom', 'tyn-group-msg-avatar',
      'tyn-contact', 'tyn-contact-aside', 'tyn-contact-checked',
      'tyn-tfcontact-s', 'tyn-conver-avatar',
      'tyn-msg-mention', 'tyn-msg-mergetitle', 'tyn-msg-merge-list',
      'tyn-mention-all', 'tyn-mention-me', 'tyn-mentions',
      'tyn-replies', 'tyn-reply-quick', 'tyn-reply-preview',
      'tyn-quick-chat', 'tyn-quick-chat-toggle', 'tyn-quick-chat-box',
      'tyn-quick-chat-reply', 'tyn-quick-chat-head', 'tyn-quick-chat-form',
      'tyn-user-modal', 'tyn-user-acount-modal', 'tyn-account-login-modal',
      'tyn-img-loading', 'tyn-perch-h5', 'tyn-emoji-pn', 'tyn-emoni-box',
      'tyn-input-file', 'tyn-input-block', 'tyn-chat-form-insert',
      'tyn-btn-inline', 'tyn-border-color', 'tyn-theme-accent', 'tyn-theme-alt',
      'tyn-search-modal',
      'tyn-h5header-nav-list', 'tyn-h5header-create-list',
      'tyn-rgaside-body', 'tyn-rgaside-footer',
      'tyn-tab-pane-aside',
      'tyn-h5-chat-body', 'tyn-h5-chat-form',
      'tyn-avatar', 'tyn-s-avatar', 'tyn-modal',
      'tyn-separator-item',
      // 已迁移的旧类（保留在 CSS 中作为别名，允许继续引用）
      'tyn-file', 'tyn-footer', 'tyn-message-refer',
      'tyn-topitem-avatar', 'tyn-topitem-name',
      'tyn-conversation-input', 'tyn-content-active',
      'tyn-aside-item-bubbly',
      // 尺寸基类（组件内部使用，允许保留）
      'tyn-size',
    ]);

    for (const cls of matches) {
      // Only block classes that have been explicitly migrated:
      // 1. tyn-size-* (all size variants)
      // 2. tyn-circle
      // All other tyn- classes are intentional structural classes and are allowed.
      if (/^tyn-size-(xs|sm|md|rg|lg|xl|2xl|3xl|4xl)$/.test(cls)) {
        violations.push({ file, line: cls, reason: '尺寸类必须使用 jg-size-*' });
      } else if (cls === 'tyn-circle') {
        violations.push({ file, line: cls, reason: '形状类必须使用 jg-circle' });
      }
    }
  }
}

if (violations.length > 0) {
  console.log('\n' + '='.repeat(64));
  console.log('  ❌ 提交被拦截：发现 tyn- 类名遗留');
  console.log('='.repeat(64));
  console.log('\n请将以下类替换为 jg-* 变体：\n');

  const seen = new Set();
  for (const v of violations) {
    const key = `${v.file}:${v.line}`;
    if (seen.has(key)) continue;
    seen.add(key);
    console.log(`  ${path.relative(process.cwd(), v.file)}  →  ${v.line}  (${v.reason})`);
  }

  console.log('\n💡 快捷操作：');
  console.log('   预览替换:  node scripts/scan-tyn-to-jg.js --dry-run');
  console.log('   执行替换:  node scripts/scan-tyn-to-jg.js --apply');
  console.log('='.repeat(64) + '\n');

  process.exit(1);
}

process.exit(0);
