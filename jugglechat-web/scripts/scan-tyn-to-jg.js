#!/usr/bin/env node
/**
 * tyn- → jg-* 重构分析与自动替换工具
 *
 * 扫描 src/ 下所有 .vue 和 .css 文件，统计 tyn- 类名使用频率，
 * 建立 tyn- → jg-* 映射表，并支持 --dry-run / --apply 自动替换。
 *
 * 用法:
 *   node scripts/scan-tyn-to-jg.js                      # 分析 + 生成报告
 *   node scripts/scan-tyn-to-jg.js --dry-run             # 预览所有替换（不写入）
 *   node scripts/scan-tyn-to-jg.js --apply               # 执行替换
 *   node scripts/scan-tyn-to-jg.js --json                # 输出 JSON 格式
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
const TOKENS_FILE = path.join(CSS_DIR, 'jg-tokens.css');

// ─── 完整映射表 ──────────────────────────────────────────────────────────────
/**
 * tyn- 尺寸/形状类 → jg-* token 映射
 * key: 类名（不含点号），value: { targetVar, tokenValue, targetClass, note }
 */
const TYN_TO_JG_MAP = {
  // ── 尺寸类：tyn-size-* → jg-size-*（对应 --jg-avatar-size-*） ─────────────
  'tyn-size-xs':  { targetVar: '--jg-avatar-size-xs',  tokenValue: 'var(--jg-avatar-size-xs)',   targetClass: 'jg-size-xs',  note: '1.5rem 头像小' },
  'tyn-size-sm':  { targetVar: '--jg-avatar-size-sm',  tokenValue: 'var(--jg-avatar-size-sm)',   targetClass: 'jg-size-sm',  note: '1.75rem 头像较小' },
  'tyn-size-md':  { targetVar: '--jg-avatar-size-md',  tokenValue: 'var(--jg-avatar-size-md)',   targetClass: 'jg-size-md',  note: '2rem 头像默认' },
  'tyn-size-rg':  { targetVar: '--jg-avatar-size-lg',  tokenValue: 'var(--jg-avatar-size-lg)',   targetClass: 'jg-size-rg',  note: '2.5rem 头像中大（原 bs-size-rg）' },
  'tyn-size-lg':  { targetVar: '--jg-avatar-size-xl',  tokenValue: 'var(--jg-avatar-size-xl)',   targetClass: 'jg-size-lg',  note: '3rem 头像大（原硬编码 48px）' },
  'tyn-size-xl':  { targetVar: '--jg-avatar-size-2xl', tokenValue: 'var(--jg-avatar-size-2xl)',  targetClass: 'jg-size-xl',  note: '3.75rem 头像特大' },
  'tyn-size-2xl': { targetVar: '--jg-avatar-size-2xl', tokenValue: 'var(--jg-avatar-size-2xl)',  targetClass: 'jg-size-2xl', note: '4.5rem 头像超大（原 bs-size-2xl）' },
  'tyn-size-3xl': { targetVar: '--jg-avatar-size-3xl', tokenValue: 'var(--jg-avatar-size-3xl)',  targetClass: 'jg-size-3xl', note: '6rem 头像巨（原 bs-size-3xl）' },
  'tyn-size-4xl': { targetVar: '--jg-avatar-size-3xl', tokenValue: 'var(--jg-avatar-size-3xl)',  targetClass: 'jg-size-4xl', note: '9rem 头像最大（原 bs-size-4xl，上限 3xl）' },
  // ── 形状类 ────────────────────────────────────────────────────────────────
  'tyn-circle':   { targetVar: '--jg-radius-circle',   tokenValue: 'var(--jg-radius-circle)',    targetClass: 'jg-circle',   note: '50% 圆形' },
};

// ─── 结构性类（保留，不做替换）── 高频布局/组件封装 ─────────────────────────
const STRUCTURAL_CLASSES = new Set([
  // Flex 布局容器
  'tyn-media-group', 'tyn-media-row', 'tyn-media-col', 'tyn-media-list',
  'tyn-media', 'tyn-media-bordered', 'tyn-media-multiple', 'tyn-media-vr',
  'tyn-media-center', 'tyn-media-option', 'tyn-media-item',
  // 消息气泡组件
  'tyn-reply', 'tyn-reply-group', 'tyn-reply-bubble', 'tyn-reply-text',
  'tyn-reply-avatar', 'tyn-reply-separator', 'tyn-reply-tools',
  'tyn-reply-item', 'tyn-reply-link', 'tyn-reply-link-title', 'tyn-reply-anchor',
  'tyn-reply-media', 'tyn-reply-preview', 'tyn-reply-video', 'tyn-reply-file',
  'tyn-reply-call', 'tyn-reply-call-text', 'tyn-reply-meida-img',
  'tyn-reply-merge', 'tyn-reply-row', 'tyn-reply-quick',
  // 聊天区域
  'tyn-chat', 'tyn-chat-body', 'tyn-chat-head', 'tyn-chat-content',
  'tyn-chat-form', 'tyn-chat-form-input', 'tyn-chat-form-enter',
  'tyn-chat-search', 'tyn-chat-aside-avatar', 'tyn-chat-cover',
  'tyn-chat-call', 'tyn-chat-call-cover', 'tyn-chat-call-stack',
  'tyn-chat-call-video', 'tyn-chat-has-content', 'tyn-chat-none-box',
  'tyn-chat-theme-list', 'tyn-chat-theme-btn', 'tyn-chat-mute',
  'tyn-chat-cover-bg', 'tyn-chat-none-bg', 'tyn-chat-file',
  'tyn-chat-content-aside',
  // 侧边栏
  'tyn-aside', 'tyn-aside-base', 'tyn-aside-body', 'tyn-aside-footer',
  'tyn-aside-head', 'tyn-aside-item', 'tyn-aside-list', 'tyn-aside-row',
  'tyn-aside-search', 'tyn-aside-icon', 'tyn-aside-title',
  'tyn-aside-contact-row', 'tyn-aside-group', 'tyn-aside-nothing',
  'tyn-aside-filename', 'tyn-aside-members', 'tyn-aside-member',
  'tyn-aside-member-name', 'tyn-aside-group-info', 'tyn-aside-group-col',
  'tyn-aside-head-tools', 'tyn-aside-toplist', 'tyn-aside-topitem',
  'tyn-aside-button', 'tyn-aside-desktop', 'tyn-h5-aside-body',
  'tyn-aside-video',
  // 导航 / 头部
  'tyn-root', 'tyn-web-root', 'tyn-desktop-root', 'tyn-h5-root',
  'tyn-appbar', 'tyn-appbar-wrap', 'tyn-appbar-nav', 'tyn-appbar-link',
  'tyn-appbar-logo', 'tyn-appbar-content', 'tyn-common-header',
  'tyn-common-body', 'tyn-common-aside', 'tyn-common-aside-right',
  'tyn-header-btn', 'tyn-header-logo', 'tyn-desktop-header',
  'tyn-desktop-nav', 'tyn-desktop-navs', 'tyn-logo',
  // 列表 / 链接
  'tyn-list-links', 'tyn-list-links-heading', 'tyn-list-inline',
  'tyn-links', 'tyn-link-item',
  'tyn-content', 'tyn-content-full-height', 'tyn-content-inner',
  'tyn-content-page', 'tyn-content-active', 'tyn-main', 'tyn-main-boxed',
  'tyn-main-boxed-lg', 'tyn-section', 'tyn-section-head',
  'tyn-section-content', 'tyn-overlay',
  // 图片/视频/媒体
  'tyn-image', 'tyn-video', 'tyn-video-icon', 'tyn-thumb',
  'tyn-stories-thumb', 'tyn-stories-slider', 'tyn-stories-item',
  'tyn-stories-content', 'tyn-stories-wrap', 'tyn-stories-page',
  // 组件
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
  'tyn-media-group-reads', 'tyn-media-option',
  'tyn-list-link',
  'tyn-size',   // base size mixin（无后缀的基类）
  'tyn-avatar', 'tyn-s-avatar',
  'tyn-modal',
  'tyn-separator-item',
]);

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

/** 扫描所有 .vue/.css 文件，统计 tyn- 类使用频次 */
function scanClassUsage() {
  const allFiles = walkDir(SRC_DIR, f => /\.(vue|css)$/.test(f));
  const usage = {};
  for (const fp of allFiles) {
    const content = fs.readFileSync(fp, 'utf8');
    const lines = content.split('\n');
    for (let i = 0; i < lines.length; i++) {
      const matches = lines[i].match(/\btyn-[\w-]+\b/g);
      if (!matches) continue;
      const relPath = fp.replace(/\\/g, '/').replace(SRC_DIR.replace(/\\/g, '/') + '/', '');
      for (const cls of matches) {
        if (!usage[cls]) usage[cls] = { count: 0, files: new Set(), ext: path.extname(fp) };
        usage[cls].count++;
        usage[cls].files.add(relPath);
      }
    }
  }
  return usage;
}

/** 从 CSS 文件中提取 .tyn-size-* 类的属性定义 */
function extractSizeClassDefinitions() {
  const cssFiles = walkDir(CSS_DIR, f => /\.css$/.test(f));
  const defs = {};
  for (const fp of cssFiles) {
    const content = fs.readFileSync(fp, 'utf8');
    const lines = content.split('\n');
    let currentClass = null, currentProps = {}, depth = 0;
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const trimmed = line.trim();
      // 检测类选择器开始
      const clsMatch = trimmed.match(/^\.([a-zA-Z][\w-]*)\s*\{/);
      if (clsMatch) {
        // 保存上一个类
        if (currentClass && Object.keys(currentProps).length > 0) {
          defs[currentClass] = { props: currentProps, source: fp.replace(/\\/g, '/') };
        }
        currentClass = clsMatch[1];
        currentProps = {};
        depth = (trimmed.match(/\{/g) || []).length - (trimmed.match(/\}/g) || []).length;
        continue;
      }
      if (currentClass && depth > 0) {
        const pm = trimmed.match(/^([\w-]+)\s*:\s*([^;{}]+);/);
        if (pm) currentProps[pm[1]] = pm[2].trim();
        depth += (trimmed.match(/\{/g) || []).length - (trimmed.match(/\}/g) || []).length;
        if (depth <= 0) {
          if (Object.keys(currentProps).length > 0) {
            defs[currentClass] = { props: currentProps, source: fp.replace(/\\/g, '/') };
          }
          currentClass = null;
          currentProps = {};
        }
      }
    }
    // 处理最后一个类
    if (currentClass && Object.keys(currentProps).length > 0) {
      defs[currentClass] = { props: currentProps, source: fp.replace(/\\/g, '/') };
    }
  }
  return defs;
}

// ─── 主要逻辑 ────────────────────────────────────────────────────────────────

function main() {
  console.log('='.repeat(72));
  console.log('  tyn- → jg-* 重构分析工具');
  const mode = DRY_RUN ? ' --dry-run (预览模式)' : APPLY ? ' --apply (执行模式)' : ' 分析模式';
  console.log('  模式:' + mode);
  console.log('='.repeat(72));
  console.log();

  // 1. 扫描所有 tyn- 类使用
  console.log('📊 扫描 src/ 下所有 .vue 和 .css 文件...');
  const allFiles = walkDir(SRC_DIR, f => /\.(vue|css)$/.test(f));
  const usage = scanClassUsage();
  const sorted = Object.entries(usage).sort((a, b) => b[1].count - a[1].count);

  // 2. 提取 CSS 属性
  console.log('🔍 提取 CSS 属性定义...');
  const classDefs = extractSizeClassDefinitions();

  // 3. 分类：可替换 vs 结构性
  const tokenizable = [];
  const structural = [];

  for (const [cls, info] of sorted) {
    if (STRUCTURAL_CLASSES.has(cls)) {
      structural.push({ class: cls, usageCount: info.count, files: [...info.files], ext: info.ext });
      continue;
    }
    const mapEntry = TYN_TO_JG_MAP[cls];
    if (mapEntry) {
      const props = classDefs[cls]?.props || {};
      const reasons = [];
      for (const [prop, val] of Object.entries(props)) {
        if (['--tyn-size', '--tyn-icon-size', 'height', 'width', 'font-size', 'border-radius'].includes(prop)) {
          reasons.push(`${prop}: ${val}`);
        }
      }
      tokenizable.push({
        class: cls,
        targetClass: mapEntry.targetClass,
        targetVar: mapEntry.targetVar,
        tokenValue: mapEntry.tokenValue,
        note: mapEntry.note,
        usageCount: info.count,
        files: [...info.files],
        ext: info.ext,
        cssProps: reasons.length > 0 ? reasons : null,
        priority: info.count >= 10 ? 'high' : info.count >= 5 ? 'medium' : 'low',
      });
    } else {
      // 不在映射表中且不在 structural 中的类 → 未知类
      structural.push({ class: cls, usageCount: info.count, files: [...info.files], ext: info.ext, unknown: true });
    }
  }

  // 按优先级和使用频次排序
  const priorityOrder = { high: 0, medium: 1, low: 2 };
  tokenizable.sort((a, b) =>
    (priorityOrder[a.priority] ?? 2) - (priorityOrder[b.priority] ?? 2)
    || b.usageCount - a.usageCount
  );
  structural.sort((a, b) => b.usageCount - a.usageCount);

  // JSON 输出
  if (JSON_OUT) {
    console.log(JSON.stringify({
      summary: {
        totalFiles: allFiles.length,
        totalUniqueClasses: sorted.length,
        tokenizableCount: tokenizable.length,
        structuralCount: structural.length,
        unknownCount: structural.filter(s => s.unknown).length,
      },
      mapping: tokenizable.map(m => ({
        from: m.class,
        to: m.targetClass,
        targetVar: m.targetVar,
        tokenValue: m.tokenValue,
        note: m.note,
        usageCount: m.usageCount,
        priority: m.priority,
        files: m.files.slice(0, 10),
      })),
      structural: structural.filter(s => s.unknown).slice(0, 30).map(s => ({
        class: s.class,
        usageCount: s.usageCount,
        ext: s.ext,
        files: s.files.slice(0, 5),
      })),
      stats: sorted.map(([cls, info]) => ({ class: cls, count: info.count, ext: info.ext })),
    }, null, 2));
    return;
  }

  // ─── 报告 ─────────────────────────────────────────────────────────────────
  const unknownStructural = structural.filter(s => s.unknown);
  const knownStructural = structural.filter(s => !s.unknown);

  console.log(`\n📈 统计摘要:`);
  console.log(`   扫描文件数:       ${allFiles.length}`);
  console.log(`   tyn- 类总数:      ${sorted.length} 个唯一类`);
  console.log(`   可替换为 jg-*:    ${tokenizable.length} 个（尺寸/形状工具类）`);
  console.log(`   结构性类（保留）: ${knownStructural.length} 个`);
  console.log(`   未知类:           ${unknownStructural.length} 个`);
  console.log(`   执行模式:         ${DRY_RUN ? '预览（--dry-run）' : APPLY ? '写入（--apply）' : '分析'}`);
  console.log();

  // ─── 映射表 ───────────────────────────────────────────────────────────────
  if (tokenizable.length > 0) {
    console.log('┌' + '─'.repeat(70) + '┐');
    console.log('│  🔄 可替换的 tyn- → jg-* 映射表（按优先级和使用频次排序）            │');
    console.log('├' + '─'.repeat(70) + '┤');
    console.log(`│ ${'源类名'.padEnd(18)} ${'目标类名'.padEnd(18)} ${'目标变量'.padEnd(26)} ${'频次'.padStart(5)} │`);
    console.log('├' + '─'.repeat(70) + '┤');
    for (const m of tokenizable) {
      console.log(`│ ${m.class.padEnd(18)} ${m.targetClass.padEnd(18)} ${m.targetVar.padEnd(26)} ${String(m.usageCount).padStart(5)} │`);
    }
    console.log('└' + '─'.repeat(70) + '┘');
    console.log();

    // 详细备注
    console.log('📝 映射备注:');
    for (const m of tokenizable) {
      const tag = m.priority === 'high' ? '【高】' : m.priority === 'medium' ? '【中】' : '【低】';
      console.log(`   ${tag} ${m.class} → ${m.targetClass}  (${m.note})`);
    }
    console.log();
  }

  // ─── Dry-run: 显示文件级变更 ───────────────────────────────────────────────
  if (DRY_RUN && tokenizable.length > 0) {
    console.log('📋 --dry-run: 将修改的文件和行预览\n');
    for (const m of tokenizable) {
      console.log(`  ${m.class} → ${m.targetClass}  (${m.usageCount} 处)`);
      for (const f of m.files) {
        const fp = path.join(SRC_DIR, f);
        if (!fs.existsSync(fp)) continue;
        const content = fs.readFileSync(fp, 'utf8');
        const lines = content.split('\n');
        for (let i = 0; i < lines.length; i++) {
          if (!lines[i].includes(m.class)) continue;
          const replaced = lines[i]
            .split(m.class)
            .join(m.targetClass);
          const preview = lines[i].trim().substring(0, 90);
          const previewR = replaced.trim().substring(0, 90);
          console.log(`    ${f.replace('src/', '')}:L${i + 1}`);
          console.log(`      原文: ${preview}`);
          if (preview !== previewR) {
            console.log(`      替换: ${previewR}`);
          }
        }
      }
      console.log();
    }
    console.log('💡 确认无误后，使用 --apply 执行实际替换');
  }

  // ─── 结构性类高频示例 ─────────────────────────────────────────────────────
  if (knownStructural.length > 0) {
    const topStructural = knownStructural.filter(s => s.usageCount >= 3).slice(0, 20);
    console.log('📋 结构性类（需保留，高频示例）:');
    for (const s of topStructural) {
      console.log(`   ${s.class.padEnd(28)} (使用 ${String(s.usageCount).padStart(4)} 次)`);
    }
    if (knownStructural.length > 20) {
      console.log(`   ... 共 ${knownStructural.length} 个结构性类`);
    }
    console.log();
  }

  // ─── 未知类提示 ───────────────────────────────────────────────────────────
  if (unknownStructural.length > 0) {
    console.log('⚠️  未在映射表中，也不在保留结构类列表中的类（建议人工审查）:');
    for (const s of unknownStructural.slice(0, 15)) {
      console.log(`   ${s.class.padEnd(28)} (使用 ${String(s.usageCount).padStart(4)} 次, ${s.ext})`);
    }
    if (unknownStructural.length > 15) {
      console.log(`   ... 共 ${unknownStructural.length} 个未知类`);
    }
    console.log();
  }

  // ─── Apply: 执行替换 ──────────────────────────────────────────────────────
  if (APPLY && tokenizable.length > 0) {
    console.log('🔧 执行替换...\n');
    let fileChanges = 0;
    const changedFiles = new Set();

    for (const m of tokenizable) {
      for (const fileRel of m.files) {
        const fp = path.join(SRC_DIR, fileRel);
        if (!fs.existsSync(fp)) continue;
        const content = fs.readFileSync(fp, 'utf8');
        if (!content.includes(m.class)) continue;

        const newContent = content.replace(
          new RegExp(`\\b${m.class}\\b`, 'g'),
          m.targetClass
        );
        const changeCount = (newContent.match(new RegExp(`\\b${m.targetClass}\\b`, 'g')) || [])
          .length - (content.match(new RegExp(`\\b${m.targetClass}\\b`, 'g')) || []).length;

        if (changeCount > 0) {
          fs.writeFileSync(fp, newContent, 'utf8');
          changedFiles.add(fileRel);
          console.log(`  ✅ ${fileRel}: ${m.class} → ${m.targetClass} (+${changeCount} 处)`);
          fileChanges++;
        }
      }
    }

    // 在 jg-tokens.css 末尾追加 jg-size-* 和 jg-circle 别名类
    const tokensContent = fs.readFileSync(TOKENS_FILE, 'utf8');
    let aliasCSS = '\n\n/* ── jg-* 别名类（tyn- 迁移，对应原 Bootstrap size 体系）──────────── */\n';
    for (const m of tokenizable) {
      const comment = `/* ${m.class} → ${m.targetClass} (${m.note}) */`;
      if (m.class.startsWith('tyn-size-')) {
        aliasCSS += `${comment}\n.${m.targetClass} {\n  --tyn-size: ${m.tokenValue};\n  --tyn-icon-size: var(${m.targetVar.replace('--jg-avatar-size', '--jg-font-size-icon')});\n}\n\n`;
      } else if (m.class === 'tyn-circle') {
        aliasCSS += `${comment}\n.${m.targetClass} {\n  --tyn-shape: ${m.tokenValue};\n}\n\n`;
      }
    }

    if (!tokensContent.includes('jg-size-xs') && !tokensContent.includes('jg-circle')) {
      fs.writeFileSync(TOKENS_FILE, tokensContent + aliasCSS, 'utf8');
      console.log(`  ✅ jg-tokens.css: 追加 ${tokenizable.length} 个 jg-* 别名类定义`);
    } else {
      console.log(`  ⏭  jg-tokens.css: 别名类已存在，跳过追加`);
    }

    console.log(`\n🎉 完成！共修改 ${changedFiles.size} 个文件，涉及 ${fileChanges} 处替换`);
  }

  if (!DRY_RUN && !APPLY) {
    console.log('💡 下一步操作:');
    console.log('   预览替换:  node scripts/scan-tyn-to-jg.js --dry-run');
    console.log('   执行替换:  node scripts/scan-tyn-to-jg.js --apply');
  }
}

main();
