# 乐享 IM v1.0.0 - 即时通讯平台

> 乐享，让沟通更快乐。基于 JuggleIM 深度二开的全链路即时通讯平台，支持千人在线。

## 项目简介

乐享 IM 是一个面向年轻人的快乐社交平台，在 JuggleIM 开源即时通讯框架基础上进行了全链路品牌定制和功能扩展。项目采用单体集成架构，包含核心 IM 服务、业务服务、用户端前端和管理后台。

### 核心特性

- **品牌全链路定制**：客户端 + 管理后台全面乐享品牌化
- **应用内管理员体系**：支持管理员身份、多开账号、IP监控、IP变动通知
- **管理后台增强**：用户管理增删改查、角色体系（系统管理员唯一 + 应用管理员）
- **客户端架构升级**：Design Token + Headless UI + 虚拟滚动 + Web Worker
- **生产级部署**：Docker Compose + Nginx + Cloudflare Pages 混合方案
- **千人在线目标**：MySQL连接池优化、Nginx性能调优、系统参数优化

## 技术栈

| 层级 | 技术 | 说明 |
|------|------|------|
| 核心IM服务 | Go 1.22 + Gin | im-server，单体集成模式 |
| 业务服务 | Go 1.22 + Gin | jugglechat-server，集成在 im-server 中 |
| 用户端前端 | Vue 3.2 + Vite 4 + Reka-UI | jugglechat-web，支持 PWA |
| 管理后台 | Go + Vue 3 + Element UI | imserver-console，前后端一体 |
| 数据库 | MySQL 8.0 | jim_db，80+ 表 |
| 消息存储 | MySQL / MongoDB | 可配置，默认 MySQL |
| 缓存 | KVDB (badger) | 本地键值存储 |
| 实时通信 | WebSocket | 自定义 IM 协议 |
| 音视频 | ZegoExpress SDK | 即构科技音视频 |
| 容器化 | Docker + Docker Compose | 生产环境部署 |
| 前端托管 | Cloudflare Pages | 全球 CDN 加速 |

## 项目结构

```
lexiangim/
├── im-server/                    # 核心 IM 服务（Go）
│   ├── launcher/                 # 启动入口（单体集成模式）
│   │   ├── main.go              # 主程序，集成 jugglechat-server + imserver-console
│   │   ├── conf/config.yml      # 配置文件
│   │   └── im-server.exe        # 编译产物（gitignore）
│   ├── services/                 # 核心服务（消息/群组/好友/连接管理等）
│   ├── commons/                  # 公共库（配置/数据库/缓存/日志/工具）
│   ├── sql/                      # 数据库初始化脚本
│   └── go.mod
│
├── jugglechat-server/            # 业务服务（Go，集成在 im-server 中）
│   ├── apis/                     # API 处理器（登录/注册/管理员/邀请码）
│   ├── services/                 # 业务逻辑（用户/管理员/多开/IP监控）
│   ├── storages/                 # 数据访问层（DAO + Models）
│   ├── routers/                  # 路由注册 + Web 前端静态资源
│   ├── commons/                  # 公共库
│   └── go.mod
│
├── jugglechat-web/               # 用户端前端（Vue 3）
│   ├── src/
│   │   ├── components/           # 组件（聊天/联系人/管理员功能/交互组件）
│   │   ├── views/                # 页面（登录/聊天/联系人/设置/邀请）
│   │   ├── services/             # API 服务（request.js + admin.js）
│   │   ├── composables/          # 组合式函数（useToast/useDrag）
│   │   ├── assets/css/           # 样式（jg-tokens.css Design Token）
│   │   ├── workers/              # Web Worker（markdown.worker.js）
│   │   └── config.js             # 全局配置（appkey/API地址/环境变量）
│   ├── public/                   # 静态资源（PWA/字体/图片）
│   ├── scripts/                  # 自动化脚本（scan-tyn-to-jg.js）
│   ├── .env.development          # 开发环境变量
│   ├── .env.production           # 生产环境变量
│   ├── ARCHITECTURE_REFACTOR.md # 架构重构文档
│   └── package.json
│
├── imserver-console/             # 管理后台（Go + Vue 3）
│   ├── apis/                     # 后台 API（用户/应用/管理员/推送）
│   ├── services/                 # 后台业务逻辑
│   ├── dbs/                      # 数据访问层
│   ├── webconsole/web/           # 后台前端（Vue 3 + Element UI）
│   │   ├── src/views/            # 页面（登录/仪表盘/用户管理/应用管理）
│   │   ├── src/composables/      # 组合式函数（useToast）
│   │   └── src/locales/          # 国际化（zh-CN/en-US）
│   ├── webload.go                # embed 嵌入前端构建产物
│   ├── README.md                 # 乐享版后台 README
│   └── go.mod
│
├── .gitignore
└── README.md                      # 本文件
```

## 本地开发环境

### 环境要求

- Go 1.22+
- Node.js 18+
- Docker（用于 MySQL）
- Git

### 快速开始

#### 1. 启动 MySQL（Docker）

```bash
docker run -d \
  --name juggleim-mysql \
  -p 3306:3306 \
  -e MYSQL_ROOT_PASSWORD=juggleim \
  -e MYSQL_DATABASE=jim_db \
  mysql:8.0 \
  --character-set-server=utf8mb4 \
  --collation-server=utf8mb4_unicode_ci
```

#### 2. 编译并启动 im-server（单体集成模式）

```bash
cd im-server/launcher
go build -o im-server.exe .
./im-server.exe
```

启动后服务监听：
- `9001` - API 网关
- `9003` - WebSocket + 业务 API + Web 前端
- `8090` - 管理后台

#### 3. 启动用户端前端（开发模式）

```bash
cd jugglechat-web
npm install
npm run dev
```

访问 `http://localhost:5173`

#### 4. 启动管理后台前端（开发模式，可选）

```bash
cd imserver-console/webconsole/web
npm install
npm run dev
```

### 开发配置

- **前端 API 地址**：通过 `.env.development` 配置，默认 `127.0.0.1:9003`
- **appkey**：默认 `YFbrDwnGG3JVRubC`（乐享应用），可在前端设置中修改
- **数据库**：`im-server/launcher/conf/config.yml`，默认 `127.0.0.1:3306/jim_db`
- **测试管理员**：`admin / 123456`（管理后台），`testadmin01 / 123456`（客户端应用内管理员）

### 混合开发模式

项目采用 **Docker + 本地** 混合开发模式：
- MySQL 运行在 Docker 容器中
- Go 后端和前端在本地直接运行
- 通过 `go.mod` 的 `replace` 指令引用本地 `jugglechat-server` 和 `imserver-console`

修改 `jugglechat-server` 或 `imserver-console` 代码后，需要重新编译 `im-server` 才能生效。

## 生产环境部署

### 架构概览

```
用户 → Cloudflare CDN → 前端(www.lexiangim.com) Pages托管
                      → API(api.yefeng.us.cc) → Nginx → im-server容器(9003)
                      → 管理后台(admin.yefeng.us.cc) → Nginx → im-server容器(8090)
服务器内部: Docker Compose (im-server + MySQL)，数据卷持久化
```

### 仓库结构

乐享 IM 采用 **三仓库分离** 部署架构：

| 仓库 | 用途 | 部署方式 |
|------|------|----------|
| [lexiangim](https://github.com/AthenDrakomin-hub/lexiangim) | 源码仓库（monorepo） | 本地开发 + 手动构建产物推送 |
| [lexiang-deploy](https://github.com/AthenDrakomin-hub/lexiang-deploy) | 服务器容器化部署 | Docker Compose + 预编译二进制 |
| [lexiang-web-deploy](https://github.com/AthenDrakomin-hub/lexiang-web-deploy) | Cloudflare Pages 前端托管 | Git Push 自动部署 |

### 快速部署

#### 后端（服务器）

```bash
# 1. 克隆部署仓库
git clone https://github.com/AthenDrakomin-hub/lexiang-deploy.git
cd lexiang-deploy

# 2. 配置环境变量
cp .env.example .env
nano .env  # 修改所有密码和域名

# 3. 启动服务
docker compose up -d
```

#### 前端（Cloudflare Pages）

```bash
# 1. 在源码仓库构建
cd lexiangim/jugglechat-web
npm run build

# 2. 复制产物到部署仓库
cp -r dist/* ../lexiang-web-deploy/
cp public/config.js ../lexiang-web-deploy/

# 3. 提交并推送（触发 Cloudflare Pages 自动部署）
cd ../lexiang-web-deploy
git add .
git commit -m "deploy: v1.0.0"
git push
```

> 详细部署文档请参考 [DEPLOY.md](./DEPLOY.md) 和各部署仓库的 README。

## 管理员功能说明

### 管理后台角色体系

| 角色 | 标识 | 权限 | 数量限制 |
|------|------|------|----------|
| 系统管理员 | role_type=0 | 全局管理，所有权限 | 全局只能1个 |
| 应用管理员 | role_type=1 | 管理指定应用的用户和配置 | 可多个 |

### 客户端应用内管理员功能

| 功能 | 入口 | 说明 |
|------|------|------|
| 账号多开 | 设置 → 管理员 → 账号多开 | 快速切换多个账号，方案A快速切换 |
| IP监控 | 设置 → 管理员 → IP监控 | 查看所有用户的IP地址、地理位置、在线状态 |
| IP变动通知 | 设置 → 管理员 → IP变动通知 | 用户IP变动时自动通知管理员，支持未读计数 |

### 管理员身份指定

管理员身份由**管理后台手动指定**：
1. 登录管理后台 `admin.lexiang.com`
2. 用户管理 → 找到目标用户
3. 编辑 → 角色 → 选择「应用管理员」
4. 保存后该用户在客户端即可看到管理员功能菜单

## 品牌信息

- **品牌名**：乐享
- **Slogan**：乐享，让沟通更快乐
- **品牌色**：`#2563EB`（蓝色）
- **appkey**：`YFbrDwnGG3JVRubC`
- **定位**：年轻人的快乐社交平台

## 常见问题

### Q: 修改 jugglechat-server 代码后不生效？
A: im-server 是单体集成模式，修改后需要重新编译：
```bash
cd im-server/launcher && go build -o im-server.exe . && ./im-server.exe
```

### Q: 前端登录失败提示用户不存在？
A: 集成模式下使用 `jim_db` 数据库，不是 `app_db`。确保用户在 `jim_db.users` 表中。

### Q: WebSocket 连接失败？
A: 检查 Nginx 是否配置了 `Upgrade` 和 `Connection` header，参考 `deploy/nginx/lexiang.conf`。

### Q: 管理后台默认账号密码？
A: `admin / 123456`，首次登录后请立即修改密码。

## 版本信息

- **当前版本**: v1.0.0
- **发布日期**: 2026-09-03
- **基础框架**: JuggleIM (https://github.com/juggleim/im-server)

## 许可证

基于 JuggleIM 开源项目二次开发，遵循原项目许可证。

## 联系方式

- 项目仓库：https://github.com/AthenDrakomin-hub/lexiangim
- 问题反馈：提交 Issue
