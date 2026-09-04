# DESIGN.md - 乐享 IM (Discord 风格)

> 基于 Discord 设计系统重新设计的乐享 IM Web 客户端规范。
> 核心变化：主色从橙色 #FF6B35 改为 Blurple #5865f2，全面拥抱深色优先策略。

## 1. Visual Theme & Atmosphere

乐享 IM 是面向多租户的即时通讯平台，UI 风格对标 Discord——**深色优先、紧凑密度、Blurple 强调**。整体氛围：专业、沉浸、高效，适合长时间聊天场景。

**关键特征：**
- 深色优先：默认暗色主题，降低眼睛疲劳
- 三阶深度背景：服务器/侧边栏/聊天区有明确层级区分
- Blurple 作为唯一饱和强调色，用于品牌标志、CTA、@提及
- 紧凑行间距：消息列表 4-8px 间距，快速滚动不疲劳
- 圆角适中：卡片 8px，按钮 4px，状态徽章全圆角

## 2. Color Palette & Roles

### Primary（品牌色）

| Token | Hex | 用途 |
|-------|-----|------|
| `--jg-primary` | `#5865f2` | 品牌主色、主 CTA、@提及高亮 |
| `--jg-primary-hover` | `#4752c4` | 主按钮悬停态 |
| `--jg-primary-soft` | `#7289da` | 次要强调（营销页） |
| `--jg-primary-light` | `rgba(88,101,242,0.1)` | @提及行背景 |

### Surface（深色主题 - 默认）

| Token | Hex | 用途 |
|-------|-----|------|
| `--jg-bg-tertiary` | `#1e1f22` | 服务器栏、最深背景 |
| `--jg-bg-secondary` | `#2b2d31` | 频道侧边栏、设置面板 |
| `--jg-bg-primary` | `#313338` | 聊天区主背景 |
| `--jg-bg-floating` | `#111214` | 悬浮弹窗、tooltip |
| `--jg-bg-hover` | `rgba(78,80,88,0.3)` | 行悬停覆盖层 |
| `--jg-bg-selected` | `rgba(78,80,88,0.6)` | 行选中态 |

### Surface（浅色主题）

| Token | Hex | 用途 |
|-------|-----|------|
| `--jg-bg-light-primary` | `#ffffff` | 浅色聊天区 |
| `--jg-bg-light-secondary` | `#f2f3f5` | 浅色侧边栏 |
| `--jg-bg-light-tertiary` | `#e3e5e8` | 浅色最深背景 |

### Text（文字色）

| Token | Hex | 用途 |
|-------|-----|------|
| `--jg-text-header` | `#f2f3f5` | 标题、模态框标题（暗色） |
| `--jg-text-body` | `#dbdee1` | 正文、消息内容（暗色） |
| `--jg-text-muted` | `#949ba4` | 时间戳、服务器名、元数据 |
| `--jg-text-meta` | `#80848e` | 次要元数据 |
| `--jg-text-link` | `#00a8fc` | 消息链接（天蓝色，区别于 blurple） |
| `--jg-text-placeholder` | `#b5bac1` | 输入框占位符 |

### Status & Semantic（语义色）

| Token | Hex | 用途 |
|-------|-----|------|
| `--jg-success` | `#23a55a` | 在线状态、确认操作 |
| `--jg-warning` | `#f0b232` | 空闲状态、警告 |
| `--jg-danger` | `#f23f43` | 勿扰、删除操作、错误 |
| `--jg-streaming` | `#593695` | 直播状态 |
| `--jg-offline` | `#80848e` | 离线状态 |
| `--jg-muted` | `#949ba4` | 禁用态、非活跃元素 |

### Border & Divider（边框）

| Token | Hex | 用途 |
|-------|-----|------|
| `--jg-border-subtle` | `rgba(255,255,255,0.06)` | 暗色分隔线 |
| `--jg-border-default` | `#3f4147` | 默认边框 |
| `--jg-border-focus` | `#5865f2` | 焦点边框 |

## 3. Typography Rules

### Font Family

```css
--jg-font-primary: "gg sans", "Helvetica Neue", Helvetica, Arial, sans-serif;
--jg-font-mono: "gg mono", Consolas, "Andale Mono", Courier New, monospace;
```

### Type Scale

| 角色 | 字号 | 字重 | 行高 | 用途 |
|------|------|------|------|------|
| Display Hero | 56px | 800 | 1.1 | 营销页大标题 |
| Page Heading | 24px | 700 | 1.25 | 设置页标题 |
| Channel Name | 16px | 600 | 1.25 | 频道名、群名 |
| Message Body | 16px | 400 | 1.375 | 消息正文 |
| Username | 16px | 500 | 1.25 | 消息发送者 |
| Timestamp | 12px | 500 | 1.25 | 时间戳 |
| Caption | 12px | 400 | 1.3 | 状态文字、编辑标签 |
| Code Inline | 14px | 400 | 1.375 | 行内代码 |
| Code Block | 14px | 400 | 1.5 | 代码块 |

### Typography Principles

- **友好几何感**：使用无衬线字体，圆角终端提升亲和力
- **字重对比**：层级通过 400→500→600→700→800 区分，而非颜色
- **16px 正文**：消息不缩小到 16px 以下，通过行高控制密度

## 4. Component Stylings

### Buttons

**Primary**
- 背景：`#5865f2`
- 文字：`#ffffff`
- 内边距：8px 16px
- 圆角：4px
- Hover：`#4752c4`

**Secondary**
- 背景：`#4e5058`
- 文字：`#ffffff`
- Hover：`#6d6f78`

**Danger**
- 背景：`#da373c`
- Hover：`#a12d2f`

**Ghost/Link**
- 背景：透明
- 文字：`#dbdee1`
- Hover：文字加下划线

### Inputs

- 背景：`#1e1f22`
- 文字：`#dbdee1`
- 边框：1px solid `#1e1f22`
- 圆角：4px
- 内边距：10px 12px
- Focus：边框 `#5865f2`

### Cards / Embeds

- 背景：`#2b2d31`（暗色）
- 左边框：4px 强调色
- 圆角：4px
- 内边距：8px 16px

### Status Dots

- 尺寸：10×10px
- 边框：3px solid 背景色（创建"缺口"效果）
- 位置：头像右下角

### Mentions

- 背景：`rgba(88,101,242,0.3)`
- 文字：`#c9cdfb`
- 内边距：0 2px
- 圆角：3px

## 5. Layout Principles

- **基础单位**：4px，比例：4, 8, 12, 16, 20, 24, 32, 40
- **服务器栏**：72px 宽，固定
- **频道侧边栏**：240px 宽
- **成员列表**：240px 宽（桌面端）
- **聊天列**：流体宽度，最小 380px

## 6. Elevation & Depth

| 级别 | 阴影 |
|------|------|
| Flat | none |
| Ring | `0 0 0 1px rgba(255,255,255,0.06)` |
| Raised | `rgba(0,0,0,0.4) 0px 2px 4px, 0 0 0 1px rgba(255,255,255,0.06)` |

## 7. Do's and Don'ts

### ✅ 应该做
- 保持深色外壳、紧凑密度、Blurple 行动层级
- 导航面围绕栏、侧边栏、聊天列结构
- 使用圆角方形头像（16px 圆角）和状态点语言
- 消息行间距 4-8px，保持可扫描性

### ❌ 不应该做
- 不要在浅色营销布局中使用 Blurple（会破坏 Discord 风格）
- 不要用过多装饰性卡片替代导航结构
- 不要将正文缩小到 16px 以下
- 不要使用与 Blurple 竞争的饱和色

## 8. Responsive Behavior

- **移动端**：隐藏服务器栏，单列布局，侧边栏可滑出
- **平板**：折叠成员列表，保留频道侧边栏
- **桌面**：三栏完整布局（服务器栏 | 频道侧边栏 | 聊天区）

---

*本规范基于 Discord 公开设计系统整理，适用于乐享 IM v2.0 Web 客户端视觉升级。*
