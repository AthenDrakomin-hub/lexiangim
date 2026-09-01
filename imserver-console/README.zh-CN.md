<div align="center">
  <img src="webconsole/web/src/assets/images/header/logo-mark.png" alt="乐享" width="120" />

  <h1>乐享管理后台</h1>

  <p><strong>乐享 · 让沟通更快乐 — 即时通讯管理控制台</strong></p>
  <p>基于 JuggleIM 开源项目深度定制，用一个 Web 后台统一管理应用、用户、群组、消息、机器人、第三方服务、监控与数据分析。</p>

  <p>
    <img src="https://img.shields.io/badge/版本-v2.0.0%20乐享版-2563EB?style=flat-square" alt="版本" />
    <img src="https://img.shields.io/badge/Go-1.25+-00ADD8?style=flat-square&logo=go&logoColor=white" alt="Go 1.25+" />
    <img src="https://img.shields.io/badge/Vue-3-42b883?style=flat-square&logo=vuedotjs&logoColor=white" alt="Vue 3" />
    <img src="https://img.shields.io/badge/MySQL-8.0-4479A1?style=flat-square&logo=mysql&logoColor=white" alt="MySQL 8.0" />
  </p>

  <p>
    <a href="README.md">English</a> ·
    <a href="https://www.juggle.im/">JuggleIM 官网</a> ·
    <a href="https://github.com/juggleim/im-server">IM 服务端</a>
  </p>
</div>

---

乐享管理后台是 [JuggleIM](https://github.com/juggleim/im-server) 自托管即时通讯系统的运维管理层，在开源版本基础上进行了**品牌定制、角色体系升级、用户管理能力增强、前端工程化改进**等全面升级。项目将 Vue 3 管理后台、Go 管理 API 和 API 网关打包为一个可部署服务。

## 乐享版特性升级

### 品牌全链路定制

- **品牌识别**：Logo、标题、Slogan（"乐享，让沟通更快乐"）、版权信息全部品牌化
- **登录页重写**：桌面端左右分栏布局（左侧蓝色品牌横幅 + 右侧白色登录卡片），修复 HTML 结构嵌套错乱、定位异常、输入框重复文字等问题
- **字段优化**："别名"→"组织代码"，移除冗余的邀请码管理功能
- **PWA 配置**：manifest.json 品牌化，favicon 多尺寸适配

### 管理员角色体系升级

| 角色 | 标识 | 数量限制 | 权限范围 |
|------|------|----------|----------|
| 系统管理员 | `RoleType=0` | **全局仅 1 个** | 所有功能，包括管理员角色管理 |
| 应用管理员 | `RoleType=1` | 无限制 | 应用级管理，不可修改系统管理员 |

- 新增 `POST /admingateway/accounts/updaterole` 接口，支持修改管理员角色
- 后端强制约束：不能修改自己角色、系统管理员全局只能 1 个、修改后自动清除缓存
- 账户管理页面新增"修改角色"按钮和弹窗，角色徽章可视化（系统管理员黄色 / 应用管理员蓝色）

### 用户管理增删改查能力增强

在原有查询/封禁基础上，新增完整的用户生命周期管理：

| 操作 | 接口 | 说明 |
|------|------|------|
| 编辑昵称 | `POST /admingateway/apps/users/updateprofile` | 修改用户昵称 |
| 删除用户 | `POST /admingateway/apps/users/delete` | 删除用户及本地数据 |
| 重置密码 | `POST /admingateway/apps/users/resetpassword` | 重置用户登录密码 |

- 用户管理页面操作列新增：编辑、重置密码、封禁/解封、删除
- 所有操作均有弹窗确认和错误提示，删除操作二次确认

### 前端工程化改进

- **useToast 组合函数**：新增 `src/composables/useToast.js`，替代 `getCurrentInstance().proxy.$toast` 非官方写法，提供 `toast/success/error/info` 统一 API
- **Meta 标签修复**：将弃用的 `apple-mobile-web-app-capable` 替换为标准 `mobile-web-app-capable`，删除重复 meta 标签
- **i18n 完善**：新增 `login.feedback.networkError` 网络错误提示（中英文），错误码映射完善
- **登录页修复**：修复语言选择器定位异常、重复 logo/标题渲染、输入框双重文字等问题

## 核心功能

| 模块 | 能力 |
| --- | --- |
| 应用管理 | 创建/导入应用、服务开关、回调地址和应用凭证配置、组织代码管理 |
| 用户与账号 | 双角色管理员体系、用户查询/编辑/删除/重置密码/封禁、群组和机器人管理 |
| 消息治理 | 会话查询、历史消息查询与撤回/删除、敏感词和自定义拦截规则 |
| 推送与存储 | APNs、FCM/Android 推送、文件存储服务和客户端日志收集 |
| 通信服务 | Agora、ZEGO、LiveKit RTC，以及短信、邮件和翻译配置 |
| 统计与监控 | 用户活跃、单聊/群聊/聊天室消息、连接数和节点性能 |
| 开发者工具 | 在控制台调试 IM API、检查连接状态 |
| 国际化 | 内置简体中文和英文界面 |

## 快速开始

### 环境要求

- Go 1.25+
- MySQL 8.0+
- Node.js 16+（前端开发时需要）
- 已运行的 [JuggleIM 服务端](https://github.com/juggleim/im-server)

### 1. 克隆项目

```bash
git clone <your-repo-url>
cd imserver-console
```

### 2. 创建数据库

```sql
CREATE DATABASE jim_db
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_general_ci;
```

服务启动时会自动执行数据表迁移。

### 3. 修改配置

编辑 [`conf/config.yml`](conf/config.yml)：

```yaml
port: 8091

log:
  logPath: ./logs
  logName: imserver-console

mysql:
  user: root
  password: 你的数据库密码
  address: 127.0.0.1:3306
  name: jim_db

imApiDomain: http://127.0.0.1:9001
imAdminDomain: http://127.0.0.1:8090
```

`imApiDomain` 是 IM 服务 API 地址，`imAdminDomain` 是 JuggleIM 管理 API 地址。

> **乐享集成模式**：在 im-server 单体集成部署时，管理后台通过 im-server 的 8090 端口对外提供服务，无需单独启动 imserver-console。

### 4. 启动服务

```bash
go run .
```

浏览器访问 **http://127.0.0.1:8091**，首次登录账号为：

```text
账号：admin
密码：123456
```

> 首次登录后系统管理员（admin）拥有全部权限，可在"账户信息 → 用户管理"中创建应用管理员并分配角色。非本地环境务必立即修改默认密码，请勿将生产环境密码提交到配置文件。

## 前端开发

生产所需前端资源已经内嵌在 Go 服务中。仅在开发管理界面时，才需要单独启动 Vue 项目：

```bash
cd webconsole/web
npm install
npm run dev
```

Vite 开发服务器默认将 `/admingateway` 代理到 `http://127.0.0.1:8090`。完成前端修改后重新构建内嵌资源：

```bash
npm run build
```

构建产物在 `webconsole/web/dist/` 目录，通过 Go embed 机制内嵌到二进制中，修改后需重新编译 Go 服务生效。

## 架构

```text
浏览器
   │
   ▼
Vue 3 管理后台（内嵌，桌面端左右分栏布局）
   │  /admingateway
   ▼
Gin API + JWT 鉴权 + API 网关
   ├── MySQL（控制台配置、管理员账号、用户数据）
   └── JuggleIM API（IM 管理操作与运行数据）
```

### 管理员角色权限模型

```text
系统管理员 (RoleType=0, 全局仅1个)
  ├── 所有应用管理功能
  ├── 管理员账号管理（增删改查）
  ├── 修改管理员角色（含降级其他系统管理员）
  └── 系统配置

应用管理员 (RoleType=1, 可多个)
  ├── 应用级用户管理（编辑/删除/重置密码/封禁）
  ├── 应用配置管理
  └── 不可修改系统管理员角色
```

## 项目结构

```text
.
├── apis/                  # HTTP 接口和请求模型
│   ├── account.go         # 管理员账号（含修改角色）
│   └── user.go            # 用户管理（含编辑/删除/重置密码）
├── services/              # 业务逻辑
│   ├── accountservice.go  # 管理员服务（系统管理员唯一约束）
│   └── userservice.go     # 用户服务
├── dbs/                   # GORM 数据访问层
│   ├── accountdao.go      # 管理员 DAO
│   └── userdao.go         # 用户 DAO
├── commons/               # 配置、鉴权、日志、数据库迁移和工具包
├── routers/               # Gin 路由注册
├── webconsole/            # Vue 3 + Vite 控制台及 Go 内嵌加载器
│   └── web/src/
│       ├── composables/   # 组合函数（useToast 等）
│       ├── views/login/   # 登录页（乐享品牌定制）
│       ├── views/user/    # 账户管理（角色体系）
│       ├── views/argument/# 应用管理（用户管理增删改查）
│       ├── locales/       # i18n 中英文
│       └── assets/        # 品牌素材（Logo、favicon等）
├── conf/                  # 运行配置
└── main.go                # 应用入口
```

## API 接口速查

### 管理员账号

| 方法 | 路径 | 说明 |
|------|------|------|
| POST | `/admingateway/login` | 管理员登录 |
| GET | `/admingateway/accounts/list` | 获取管理员列表 |
| POST | `/admingateway/accounts/add` | 创建管理员 |
| POST | `/admingateway/accounts/delete` | 删除管理员 |
| POST | `/admingateway/accounts/disable` | 禁用/启用管理员 |
| POST | `/admingateway/accounts/updaterole` | 修改管理员角色（乐享版新增） |

### 用户管理

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/admingateway/apps/users/list` | 获取用户列表 |
| POST | `/admingateway/apps/users/ban` | 封禁用户 |
| POST | `/admingateway/apps/users/unban` | 解封用户 |
| POST | `/admingateway/apps/users/updateprofile` | 编辑用户昵称（乐享版新增） |
| POST | `/admingateway/apps/users/delete` | 删除用户（乐享版新增） |
| POST | `/admingateway/apps/users/resetpassword` | 重置用户密码（乐享版新增） |

## JuggleIM 生态

- [im-server](https://github.com/juggleim/im-server)：高性能、自托管的开源 IM 服务端
- [官方文档](https://www.juggle.im/docs/guide/intro/)：部署、集成、客户端 SDK 和服务端指南
- [服务端 API](https://www.juggle.im/docs/server/api/)：用户、群组、消息、聊天室等接口文档

## 参与贡献

欢迎提交 Issue 和 Pull Request。适合作为首次贡献的内容包括：Bug 修复、文档完善、新增第三方服务适配、测试补充和界面体验优化。

1. Fork 本仓库。
2. 创建功能分支。
3. 补充必要测试，并验证前后端构建。
4. 提交说明清晰的 Pull Request；界面改动请附截图。

## 开源协议

本项目基于 [Apache License 2.0](LICENSE) 开源。乐享品牌定制部分在开源协议基础上附加品牌标识，二次分发时请保留品牌归属说明。

---

<div align="center">
  <strong>乐享 · 让沟通更快乐</strong><br />
  <sub>基于 JuggleIM 开源项目深度定制，v2.0.0 乐享版</sub>
</div>
