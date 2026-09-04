# P2-3：图标字体按需加载 — 迁移指南

## 背景

项目当前通过 `src/assets/css/iconfont.css` 全量加载远程字体（阿里图标 CDN，约 40KB+），所有图标通过 `.wr.jg-icon-xxx` 类名使用。

目标：使用 `unplugin-icons` + `@iconify/ic`（Material Design Rounded）实现按需加载，只在用到某个图标时才加载对应 SVG。

---

## 已完成的基础设施

### 1. 依赖安装
```bash
npm install -D unplugin-icons @iconify-json/ic
```

### 2. Vite 配置 (`vite.config.js`)
```js
import Icons from 'unplugin-icons/vite';

export default defineConfig({
  plugins: [
    vue(), vueJsx(), legacy(),
    Icons({ compiler: 'vue3', autoInstall: true }),
  ],
});
```

### 3. 通用图标组件 (`src/components/JgIcon.vue`)
```vue
<script setup>
import { computed, defineAsyncComponent } from 'vue';
import { JG_ICON_MAP, JG_ICON_SPECIAL } from './jg-icon-map';

const props = defineProps({ name: String, class: String });
const isSpecial = computed(() => JG_ICON_SPECIAL.has(props.name));
const IconComponent = computed(() =>
  isSpecial.value ? null : defineAsyncComponent(() => import(`~icons/ic/round-${props.name}`))
);
</script>
<template>
  <span v-if="isSpecial" :class="['wr', `jg-icon-${name}`, class]" />
  <component v-else :is="IconComponent" :class="['jg-icon-svg', class]" />
</template>
```

### 4. 映射表 (`src/components/jg-icon-map.ts`)
72 个图标映射到 `@iconify/ic`，5 个特殊图标保留原 CSS 渲染。

### 5. 分析脚本 (`scripts/scan-jg-icons.js`)
```bash
node scripts/scan-jg-icons.js          # 分析报告
node scripts/scan-jg-icons.js --json   # JSON 格式
```

---

## 扫描结果

| 类别 | 数量 |
|------|------|
| 扫描 Vue 文件 | 95 |
| 唯一图标数量 | 78 |
| 可替换为 ic 图标 | 72 |
| 特殊保留（CSS） | 5 |
| 未找到映射 | 2 |

---

## 三阶段迁移方案

### Phase 1：高频图标（约 30 处替换）

优先替换使用频次 ≥ 3 的图标，覆盖核心 UI：

| jg-icon 名 | 频次 | IC 图标 | 涉及文件数 |
|---|---|---|---|
| close | 10 | ic/round-close | ~6 |
| delete | 9 | ic/round-delete | ~4 |
| message | 7 | ic/round-chat | ~3 |
| success-square | 5 | ic/round-check-box | ~3 |
| square | 5 | ic/round-square-root-alt | ~3 |
| circle | 5 | ic/round-radio-button-unchecked | ~3 |
| check | 5 | ic/round-check | ~3 |
| retry | 5 | ic/round-refresh | ~3 |
| add | 4 | ic/round-add | ~3 |
| search | 3 | ic/round-search | ~2 |
| file | 3 | ic/round-insert-drive-file | ~2 |
| circle-add | 3 | ic/round-add-circle | ~2 |
| circle-remove | 3 | ic/round-remove-circle | ~2 |
| arrow-right | 3 | ic/round-arrow-right | ~2 |

**替换示例：**
```html
<!-- 之前 -->
<i class="wr jg-icon-close"></i>
<button class="btn wr jg-icon-search"></button>

<!-- 之后 -->
<JgIcon name="close" />
<button class="btn"><JgIcon name="search" /></button>
```

### Phase 2：中频图标（约 20 处替换）

| jg-icon 名 | 频次 | IC 图标 |
|---|---|---|
| top / untop / pin / top-s | 6 | ic/round-push-pin |
| favorite | 2 | ic/round-favorite |
| settings | 2 | ic/round-settings |
| edit / edit-pen | 3 | ic/round-edit |
| emoji | 2 | ic/round-mood |
| video | 2 | ic/round-videocam |
| call-end / call-hangup | 3 | ic/round-call-end |
| mic-mute | 1 | ic/round-mic-off |
| camera-mute | 1 | ic/round-videocam-off |
| rtc-add | 1 | ic/round-add-call |
| speaker | 1 | ic/round-volume-up |
| forward / forward-merge | 2 | ic/round-forward / ic/round-merge-type |
| window-maximize/minimize/hide/close | 4 | ic/round-crop-square/minimize/visibility-off/close |
| user-add | 1 | ic/round-person-add |
| group | 1 | ic/round-group |
| subtract | 1 | ic/round-remove |
| dot | 1 | ic/round-remove |
| sound-off | 1 | ic/round-volume-off |
| edit-pen | 1 | ic/round-edit |
| tag | 1 | ic/round-label |
| more-list | 1 | ic/round-morevert |
| menu-left / menu-right / menu-edit | 3 | ic/round-menu-open/close/edit |
| mic | 1 | ic/round-mic |
| camera | 1 | ic/round-videocam |
| more-dot / more | 2 | ic/round-more-horiz |
| reply | 1 | ic/round-reply |
| send | 1 | ic/round-send |
| arrow-left | 2 | ic/round-arrow-left |
| collapse | 1 | ic/round-unfold-less |

### Phase 3：低频及特殊图标

**特殊图标（保持原有 `.wr.jg-icon-*` 渲染）：**
- `jg-icon-ai` — 彩虹渐变效果
- `jg-icon-hot` — 红色火焰（双层内容）
- `jg-icon-failed` — 红色错误（自定义 content）
- `jg-icon-success` — 绿色成功（自定义 content）
- `jg-icon-error` / `jg-icon-warning` / `jg-icon-disabled`

**未找到映射的图标（需手动确认）：**
- `jg-icon-svg` — 可能是误匹配，检查实际使用
- `jg-icon-map` — 未在扫描结果中，确认是否实际使用

---

## 迁移后的项目结构

```
src/
├── components/
│   ├── JgIcon.vue              ← 新增：通用图标组件
│   └── jg-icon-map.ts          ← 新增：图标映射表
├── assets/
│   └── css/
│       ├── iconfont.css        ← 保留（用于特殊图标降级）
│       └── jg-icon-aliases.css ← 保留（过渡期兼容）
vite.config.js                  ← 已更新：添加 unplugin-icons 插件
package.json                    ← 已更新：添加 unplugin-icons, @iconify-json/ic
```

---

## 注意事项

1. **渐进迁移**：无需一次性替换所有图标，可分 Phase 逐步进行
2. **特殊图标**：带渐变色/自定义 content 的图标（ai/hot/failed/success/error/warning/disabled）继续使用 `.wr.jg-icon-*` 类
3. **图标大小**：`<JgIcon name="xxx" class="jg-size-lg" />` 可通过 CSS 类控制大小
4. **图标颜色**：`<JgIcon name="xxx" />` 继承 `currentColor`，可通过 CSS `color` 控制
5. **移除 iconfont.css**：全部迁移完成后，可移除 `iconfont.css` 的 CDN 引用，进一步减少网络请求
