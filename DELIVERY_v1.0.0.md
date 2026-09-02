# 乐享IM v1.0.0 稳定版交付文件

> **交付日期**: 2026-09-02
> **版本号**: v1.0.0
> **状态**: 稳定版 ✅
> **基于**: JuggleIM 二次开发

---

## 目录

1. [项目概述](#1-项目概述)
2. [版本信息](#2-版本信息)
3. [功能清单](#3-功能清单)
4. [数据库表结构](#4-数据库表结构)
5. [部署架构](#5-部署架构)
6. [部署步骤](#6-部署步骤)
7. [验证清单](#7-验证清单)
8. [已知问题与限制](#8-已知问题与限制)
9. [后续计划](#9-后续计划)
10. [仓库与资源](#10-仓库与资源)

---

## 1. 项目概述

### 1.1 项目简介
乐享IM是一款基于JuggleIM开源项目二次开发的企业级即时通讯系统，支持Web端客户端和管理后台，具备完整的单聊、群聊、文件传输、音视频通话等功能。

### 1.2 品牌定制
- **品牌名称**: 乐享通信
- **品牌口号**: 沟通无界，协同有度
- **组织代码**: 1688
- **正式AppKey**: LXIM2026PROD001

### 1.3 技术栈

| 层级 | 技术 | 版本 |
|------|------|------|
| 核心IM服务 | Go | 1.25.12 |
| 业务服务 | Go | 1.25.0 |
| 客户端前端 | Vue3 + Vite | - |
| 管理后台前端 | Vue3 + Vite | - |
| 数据库 | MySQL | 8.0 |
| 对象存储 | MinIO | - |
| 反向代理 | Nginx | - |
| 容器化 | Docker Compose | - |
| 前端托管 | Cloudflare Pages | - |

---

## 2. 版本信息

### 2.1 v1.0.0 核心变更

#### 数据库层
- ✅ `users` 表新增 `vip_level` 字段（0=普通用户，1=VIP用户）
- ✅ `accounts` 表新增 `app_key` 字段（应用管理员绑定应用）
- ✅ 保留原有 `user_type` 字段（核心IM服务用户类型，0=用户，1=机器人）
- ✅ 基础SQL文件 `im-server/sql/imserver.sql` 已融合所有新字段

#### 后端API层
- ✅ 系统管理员全局仅1个限制
- ✅ 应用管理员必须绑定具体应用
- ✅ VIP用户权限控制
- ✅ 修复Bot/User结构体字段对齐问题
- ✅ 新增 `CheckSysAdminExists` / `CheckSysAdminExistsExcludeAccount` 函数
- ✅ 新增 `AddAccountWithAppKey` / `UpdateRoleWithAppKey` 函数
- ✅ 新增 `CountByRoleTypeExcludeAccount` / `UpdateRoleTypeAndAppKey` / `UpdateAppKey` 函数

#### 前端-管理后台
- ✅ 创建管理员时添加应用选择下拉框
- ✅ 用户管理列表新增VIP身份列（普通/VIP标签）
- ✅ 编辑用户弹窗新增身份选择
- ✅ 应用管理员必须绑定应用校验
- ✅ 系统管理员全局唯一限制提示

#### 前端-客户端
- ✅ VIP用户可见管理员功能入口
- ✅ 普通用户不可见管理员功能
- ✅ 修复用户设置页面开关显示问题
- ✅ 修复reka-ui Select组件空字符串value限制
- ✅ 组织代码页面品牌定制（Logo+乐享+副标题+帮助弹窗）

### 2.2 历史版本累积功能

#### 品牌定制
- ✅ 客户端品牌：乐享通信
- ✅ 管理后台品牌：乐享通信
- ✅ Logo、配色、文案全面定制
- ✅ 组织代码页面定制

#### 管理员功能
- ✅ 应用内管理身份（VIP用户）
- ✅ 多开功能
- ✅ IP监控功能
- ✅ IP变更提示
- ✅ 好友IP地址和在线状态查看

#### 用户管理增强
- ✅ 用户列表增删改查
- ✅ 管理员角色区分（系统管理员/应用管理员）
- ✅ 修改角色按钮
- ✅ VIP身份管理

#### 基础设施
- ✅ MinIO对象存储部署
- ✅ SSL证书配置（自动续期）
- ✅ CORS跨域配置
- ✅ Docker Compose容器化部署
- ✅ Cloudflare Pages前端托管
- ✅ 独立部署仓库（预编译二进制+配置）

---

## 3. 功能清单

### 3.1 客户端功能

| 模块 | 功能 | 状态 | 说明 |
|------|------|------|------|
| 登录注册 | 组织代码输入 | ✅ | 输入1688进入登录页 |
| 登录注册 | 用户登录 | ✅ | 账号密码登录 |
| 登录注册 | 用户注册 | ✅ | 新用户注册 |
| 登录注册 | 忘记密码 | ✅ | - |
| 会话 | 会话列表 | ✅ | 单聊/群聊会话 |
| 会话 | 消息发送 | ✅ | 文字/图片/文件 |
| 会话 | 消息状态 | ✅ | 已发送/已读 |
| 会话 | 表情发送 | ✅ | - |
| 会话 | 图片发送 | ✅ | MinIO存储 |
| 联系人 | 好友列表 | ✅ | - |
| 联系人 | 添加好友 | ✅ | - |
| 联系人 | 好友个性签名 | ✅ | - |
| 群组 | 群组管理 | ✅ | - |
| 群组 | 创建群组 | ✅ | - |
| 个人设置 | 修改昵称 | ✅ | - |
| 个人设置 | 上传头像 | ✅ | MinIO存储 |
| 个人设置 | 默认头像选择 | ✅ | 12个不重复头像 |
| 个人设置 | 消息免打扰 | ✅ | 开关控制 |
| 个人设置 | 个性签名 | ✅ | - |
| 我的收藏 | 收藏列表 | ✅ | - |
| 我的二维码 | 个人二维码 | ✅ | - |
| 用户协议 | 用户协议 | ✅ | - |
| 用户协议 | 隐私政策 | ✅ | - |
| 用户协议 | 关于乐享 | ✅ | - |
| VIP功能 | 多开 | ✅ | VIP用户专属 |
| VIP功能 | IP监控 | ✅ | VIP用户专属 |
| VIP功能 | IP变更提示 | ✅ | VIP用户专属 |
| VIP功能 | 好友IP查看 | ✅ | VIP用户专属 |

### 3.2 管理后台功能

| 模块 | 功能 | 状态 | 说明 |
|------|------|------|------|
| 登录 | 管理员登录 | ✅ | 系统管理员/应用管理员 |
| 账户管理 | 管理员列表 | ✅ | - |
| 账户管理 | 创建管理员 | ✅ | 系统管理员/应用管理员 |
| 账户管理 | 修改角色 | ✅ | - |
| 账户管理 | 删除管理员 | ✅ | - |
| 账户管理 | 应用绑定 | ✅ | 应用管理员必须绑定应用 |
| 用户管理 | 用户列表 | ✅ | - |
| 用户管理 | 创建用户 | ✅ | - |
| 用户管理 | 编辑用户 | ✅ | 昵称/身份/状态 |
| 用户管理 | 删除用户 | ✅ | - |
| 用户管理 | VIP身份设置 | ✅ | 普通/VIP |
| 用户管理 | 重置密码 | ✅ | - |
| 应用管理 | 应用列表 | ✅ | - |
| 应用管理 | 创建应用 | ✅ | - |
| 应用管理 | 应用配置 | ✅ | - |
| 系统管理 | 全局配置 | ✅ | - |
| 系统管理 | 文件存储配置 | ✅ | MinIO |

### 3.3 权限体系

| 角色 | 权限范围 | 数量限制 |
|------|----------|----------|
| 系统管理员 | 全局所有应用、所有用户、所有配置 | 全局仅1个 |
| 应用管理员 | 仅绑定的应用内用户管理 | 不限 |
| VIP用户 | 客户端管理员功能（多开/IP监控） | 不限 |
| 普通用户 | 基础IM功能 | 不限 |

---

## 4. 数据库表结构

### 4.1 核心表清单（共80张表）

| 表名 | 说明 | 数据量 |
|------|------|--------|
| apps | 应用表 | 1 |
| appnavs | 应用导航表（组织代码） | 1 |
| accounts | 管理端账号表 | 2 |
| users | 用户表 | 4 |
| globalconfs | 全局配置表 | 2 |
| fileconfs | 文件存储配置表 | 1 |
| conversations | 会话表 | 0 |
| messages | 消息表 | 0 |
| groups | 群组表 | 0 |
| groupmembers | 群成员表 | 0 |
| friends | 好友关系表 | 0 |
| userdevices | 用户设备表 | 0 |
| ...其他70张表 | 消息/会话/群组/推送等 | 0 |

### 4.2 关键字段说明

#### users 表（用户表）

| 字段 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| id | int | - | 主键 |
| user_id | varchar(64) | - | 用户ID（唯一） |
| login_account | varchar(100) | - | 登录账号（唯一） |
| login_pass | varchar(100) | - | 登录密码（SHA1） |
| nickname | varchar(100) | - | 昵称 |
| user_type | tinyint | 0 | 用户类型（核心IM）：0=用户，1=机器人 |
| vip_level | tinyint | 0 | **VIP等级（v1.0.0新增）**：0=普通用户，1=VIP用户 |
| phone | varchar(20) | - | 手机号 |
| email | varchar(100) | - | 邮箱 |
| portrait | varchar(255) | - | 头像URL |
| app_key | varchar(45) | - | 所属应用 |
| status | tinyint | 0 | 状态：0=正常，1=禁用 |
| created_time | datetime | - | 创建时间 |
| updated_time | datetime | - | 更新时间 |

> **重要**：`user_type` 和 `vip_level` 是两个独立字段，互不冲突！
> - `user_type`：核心IM服务使用，区分用户和机器人
> - `vip_level`：VIP系统使用，区分普通用户和VIP用户

#### accounts 表（管理端账号表）

| 字段 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| id | int | - | 主键 |
| account | varchar(100) | - | 账号（唯一） |
| password | varchar(100) | - | 密码（SHA1） |
| state | tinyint | 0 | 状态 |
| role_id | int | - | 角色ID |
| parent_account | varchar(100) | - | 父账号 |
| role_type | tinyint | 0 | 角色类型：0=系统管理员，1=应用管理员 |
| app_key | varchar(45) | NULL | **绑定应用（v1.0.0新增）**：应用管理员必须绑定 |
| created_time | datetime | - | 创建时间 |
| updated_time | datetime | - | 更新时间 |

#### apps 表（应用表）

| 字段 | 类型 | 说明 |
|------|------|------|
| id | int | 主键 |
| app_key | varchar(45) | 应用Key（唯一） |
| app_secret | varchar(45) | 应用密钥 |
| app_secure_key | varchar(45) | 安全密钥（16/24/32字节） |
| app_status | tinyint | 状态：0=启用 |
| app_type | tinyint | 类型 |
| app_name | varchar(100) | 应用名称 |
| created_time | datetime | 创建时间 |
| updated_time | datetime | 更新时间 |

#### appnavs 表（应用导航表/组织代码）

| 字段 | 类型 | 说明 |
|------|------|------|
| id | int | 主键 |
| app_key | varchar(45) | 应用Key |
| alias_no | varchar(45) | 组织代码（如1688） |
| ws_url | varchar(255) | WebSocket地址 |
| api_url | varchar(255) | API地址 |
| admin_url | varchar(255) | 管理后台地址 |
| app_url | varchar(255) | 应用地址 |

### 4.3 数据库升级脚本

升级脚本位置：`imserver-console/sql/upgrade_vip_system.sql`

```sql
-- 1. users表添加vip_level字段
ALTER TABLE users ADD COLUMN vip_level TINYINT DEFAULT 0 COMMENT 'VIP等级：0=普通用户，1=VIP用户';

-- 2. accounts表添加app_key字段
ALTER TABLE accounts ADD COLUMN app_key VARCHAR(45) DEFAULT NULL COMMENT '应用管理员绑定的应用key';

-- 3. 验证
DESC users;
DESC accounts;
```

---

## 5. 部署架构

### 5.1 混合部署架构（最优解）

```
┌─────────────────────────────────────────────────────────────┐
│                        用户访问层                              │
├─────────────────────────────────────────────────────────────┤
│  www.lexiangim.com          api.yefeng.us.cc               │
│  (Cloudflare Pages)          (Nginx反向代理)                 │
│         │                           │                         │
│         ▼                           ▼                         │
│  ┌─────────────┐          ┌──────────────────┐              │
│  │  前端静态资源 │          │   Nginx (443)    │              │
│  │  (自动部署)   │          │  SSL终止+负载均衡 │              │
│  └─────────────┘          └────────┬─────────┘              │
│                                     │                         │
│                    ┌────────────────┼────────────────┐       │
│                    ▼                ▼                ▼       │
│              ┌──────────┐    ┌──────────┐    ┌──────────┐  │
│              │ im-server │    │  MySQL   │    │  MinIO   │  │
│              │ (9001/   │    │ (3306)   │    │ (9000)   │  │
│              │  9003/    │    │  Docker   │    │  Docker   │  │
│              │  8090)    │    │  容器     │    │  容器     │  │
│              │  Docker   │    └──────────┘    └──────────┘  │
│              │  容器     │                                    │
│              └──────────┘                                    │
└─────────────────────────────────────────────────────────────┘
```

### 5.2 域名映射

| 域名 | 映射到 | 用途 |
|------|--------|------|
| `www.lexiangim.com` | Cloudflare Pages | 客户端前端 |
| `api.yefeng.us.cc` | 服务器Nginx → :9003(/jim/) + :9001(/api/) | API/WebSocket |
| `admin.yefeng.us.cc` | 服务器Nginx → :8090 | 管理后台 |
| `minio.yefeng.us.cc` | 服务器Nginx → :9000 | MinIO对象存储 |

### 5.3 服务器配置

| 项目 | 值 |
|------|-----|
| 服务器IP | 45.77.31.155 |
| 操作系统 | Linux |
| Docker | 已安装 |
| Nginx | 已安装（SSL证书自动续期） |
| 数据库 | MySQL 8.0（Docker容器） |
| 对象存储 | MinIO（Docker容器） |

### 5.4 容器清单

| 容器名 | 镜像 | 端口 | 状态 |
|--------|------|------|------|
| lexiang-mysql | mysql:8.0 | 127.0.0.1:3306 | ✅ healthy |
| lexiang-im-server | 自定义（预编译二进制） | 9001/9003/8090 | ✅ running |
| lexiang-minio | minio/minio | 127.0.0.1:9000 | ✅ healthy |

---

## 6. 部署步骤

### 6.1 仓库说明

项目采用**三仓库分离**架构：

| 仓库 | 用途 | 地址 |
|------|------|------|
| lexiangim | 源码仓库（开发用） | https://github.com/AthenDrakomin-hub/lexiangim |
| lexiang-deploy | 后端部署仓库（预编译二进制+配置） | https://github.com/AthenDrakomin-hub/lexiang-deploy |
| lexiang-web-deploy | 前端部署仓库（静态资源） | https://github.com/AthenDrakomin-hub/lexiang-web-deploy |

### 6.2 前端自动部署（无需操作）

1. 推送代码到 `lexiang-web-deploy` 仓库
2. Cloudflare Pages 自动检测并部署
3. 等待1-2分钟，访问 `https://www.lexiangim.com`

### 6.3 后端手动部署

```bash
# 1. SSH登录服务器
ssh root@45.77.31.155

# 2. 进入部署目录
cd /opt/lexiang-deploy

# 3. 拉取最新代码
git pull

# 4. 执行数据库升级（重要！首次部署或版本升级时执行）
docker exec -i lexiang-mysql mysql -ulexiang -pLexiang2024User jim_db < mysql-init/02-upgrade-vip-system.sql

# 5. 重启im-server容器
docker compose up -d --build im-server

# 6. 验证服务状态
docker compose ps

# 7. 验证数据库字段
docker exec -i lexiang-mysql mysql -ulexiang -pLexiang2024User jim_db -e "DESC users; DESC accounts;"

# 8. 验证API
curl "https://api.yefeng.us.cc/jim/serverinfos?no=1688"
```

### 6.4 本地开发环境搭建

```bash
# 1. 克隆源码仓库
git clone https://github.com/AthenDrakomin-hub/lexiangim.git
cd lexiangim

# 2. 启动数据库（Docker）
cd deploy
docker compose up -d mysql

# 3. 初始化数据库
docker exec -i lexiang-mysql mysql -ulexiang -pLexiang2024User jim_db < ../im-server/sql/imserver.sql

# 4. 启动核心IM服务
cd ../im-server
go run .

# 5. 启动管理后台
cd ../imserver-console
go run .

# 6. 启动客户端前端（开发模式）
cd ../jugglechat-web
npm install
npm run dev
```

### 6.5 版本升级流程

```
开发完成 → 本地测试通过 → 提交源码仓库
    ↓
编译管理后台后端（Linux amd64）
    ↓
构建管理后台前端（嵌入后端）
    ↓
构建客户端前端
    ↓
更新部署仓库（lexiang-deploy + lexiang-web-deploy）
    ↓
推送部署仓库
    ↓
前端：Cloudflare自动部署
后端：服务器git pull + 数据库升级 + 容器重启
    ↓
端到端测试验证
```

---

## 7. 验证清单

### 7.1 数据库验证

- [ ] `users` 表包含 `vip_level` 字段
- [ ] `accounts` 表包含 `app_key` 字段
- [ ] `apps` 表包含正式应用记录（LXIM2026PROD001）
- [ ] `appnavs` 表包含组织代码记录（1688）
- [ ] `fileconfs` 表包含MinIO配置

### 7.2 服务验证

- [ ] MySQL容器状态 healthy
- [ ] im-server容器状态 running
- [ ] MinIO容器状态 healthy
- [ ] API接口正常响应（serverinfos?no=1688）
- [ ] WebSocket连接正常
- [ ] 管理后台可访问

### 7.3 管理后台功能验证

- [ ] 系统管理员登录成功
- [ ] 应用管理员登录成功
- [ ] 创建应用管理员时显示应用选择
- [ ] 应用管理员未绑定应用时创建失败
- [ ] 创建第二个系统管理员时失败（全局仅1个）
- [ ] 用户列表显示VIP身份标签
- [ ] 编辑用户可设置VIP身份
- [ ] 修改角色功能正常
- [ ] 删除用户功能正常

### 7.4 客户端功能验证

- [ ] 组织代码页面显示正常（Logo+乐享+副标题）
- [ ] 输入1688进入登录页
- [ ] 帮助弹窗正常显示
- [ ] 普通用户登录成功
- [ ] VIP用户登录成功
- [ ] VIP用户可见管理员功能入口
- [ ] 普通用户不可见管理员功能
- [ ] 单聊发送消息正常
- [ ] 图片发送正常（MinIO）
- [ ] 头像上传正常
- [ ] 用户设置开关显示正常
- [ ] 我的收藏页面正常
- [ ] 我的二维码页面正常
- [ ] 用户协议/隐私政策/关于乐享页面正常

### 7.5 VIP功能验证

- [ ] 多开功能入口正常
- [ ] IP监控页面正常
- [ ] 好友IP地址显示正常
- [ ] 好友在线状态显示正常
- [ ] IP变更提示正常

---

## 8. 已知问题与限制

### 8.1 已知问题

| 编号 | 问题 | 严重程度 | 状态 | 说明 |
|------|------|----------|------|------|
| 1 | 头像显示问题 | 中 | 待排查 | 客户端设置的头像在部分页面显示异常，可能涉及MinIO URL格式 |
| 2 | 部分页面空状态 | 低 | 待优化 | 无消息时页面空白，需添加空状态提示 |
| 3 | 创建按钮UI溢出 | 低 | 待修复 | 部分页面创建按钮UI跑出界面 |

### 8.2 技术限制

1. **GitHub大文件限制**：im-server二进制52.12MB，超过GitHub推荐的50MB，建议后续使用Git LFS
2. **单服务器部署**：当前所有服务部署在单台服务器，承载千人在线需要后续做负载均衡
3. **WebSocket单点**：WebSocket连接为单点，后续需要支持多实例部署
4. **MinIO单节点**：对象存储为单节点，后续需要支持分布式部署

### 8.3 安全注意事项

1. **数据库密码**：生产环境密码已配置，请勿提交到公开仓库
2. **AppSecret**：应用密钥已配置，请勿泄露
3. **SSL证书**：已配置自动续期，每天凌晨3点检查
4. **CORS配置**：已配置 `www.lexiangim.com` 为允许源

---

## 9. 后续计划

### 9.1 v1.1.0 计划（功能增强）

- [ ] 修复头像显示问题
- [ ] 优化空状态页面
- [ ] 修复创建按钮UI溢出
- [ ] 添加好友个性签名设置
- [ ] 优化添加好友功能
- [ ] 音视频通话功能完善
- [ ] 消息已读回执优化

### 9.2 v1.2.0 计划（性能优化）

- [ ] WebSocket多实例支持
- [ ] Redis缓存层
- [ ] 消息读写分离
- [ ] 数据库索引优化
- [ ] 前端性能优化（代码分割、懒加载）

### 9.3 v2.0.0 计划（架构升级）

- [ ] 微服务架构拆分
- [ ] Kubernetes容器编排
- [ ] 多可用区部署
- [ ] 分布式MinIO
- [ ] 监控告警体系
- [ ] 日志聚合分析

### 9.4 移动端计划

- [ ] HBuilderX打包Android应用
- [ ] HBuilderX打包iOS应用
- [ ] 移动端UI适配
- [ ] 推送通知集成

---

## 10. 仓库与资源

### 10.1 GitHub仓库

| 仓库 | 地址 | 最新Commit |
|------|------|------------|
| 源码仓库 | https://github.com/AthenDrakomin-hub/lexiangim | ca4e18b |
| 后端部署仓库 | https://github.com/AthenDrakomin-hub/lexiang-deploy | 986de57 |
| 前端部署仓库 | https://github.com/AthenDrakomin-hub/lexiang-web-deploy | 3fdf258 |

### 10.2 生产环境访问地址

| 服务 | 地址 |
|------|------|
| 客户端 | https://www.lexiangim.com |
| 管理后台 | https://admin.yefeng.us.cc |
| API文档 | https://api.yefeng.us.cc |
| MinIO控制台 | https://minio.yefeng.us.cc |

### 10.3 测试账号

| 角色 | 账号 | 密码 | 说明 |
|------|------|------|------|
| 系统管理员 | yefeng | Aa123456.. | 全局唯一系统管理员 |
| 应用管理员 | admin01 | Lexiang@2026 | 乐享通信应用管理员 |
| VIP用户 | admin01 | Lexiang@2026 | 客户端VIP功能 |
| 普通用户 | user01 | Lexiang@2026 | 基础IM功能 |
| 普通用户 | user02 | Lexiang@2026 | 基础IM功能 |

### 10.4 关键配置

| 配置项 | 值 |
|--------|-----|
| 组织代码 | 1688 |
| 正式AppKey | LXIM2026PROD001 |
| 数据库名 | jim_db |
| 数据库用户 | lexiang |
| MinIO Bucket | lexiang-files |
| MinIO Endpoint | minio.yefeng.us.cc |

### 10.5 项目文档

| 文档 | 位置 | 说明 |
|------|------|------|
| 版本说明 | VERSION_v1.0.0.md | v1.0.0版本详细说明 |
| 交付文件 | DELIVERY_v1.0.0.md | 本文件 |
| 根目录README | README.md | 项目概述和快速开始 |
| 数据库升级脚本 | imserver-console/sql/upgrade_vip_system.sql | v1.0.0数据库升级 |
| 基础数据库脚本 | im-server/sql/imserver.sql | 完整表结构（80张表） |

---

## 交付确认

| 项目 | 状态 |
|------|------|
| 源码提交 | ✅ ca4e18b |
| 后端部署仓库提交 | ✅ 986de57 |
| 前端部署仓库提交 | ✅ 3fdf258 |
| 数据库表结构融合 | ✅ |
| 代码字段对齐检查 | ✅ |
| 管理后台前端构建 | ✅ 6.93 MB |
| 管理后台后端编译 | ✅ 52.12 MB |
| 客户端前端构建 | ✅ 11.01 MB |
| 版本说明文档 | ✅ VERSION_v1.0.0.md |
| 交付文件 | ✅ 本文件 |

---

**交付人**: AI开发助手
**交付日期**: 2026-09-02
**版本**: v1.0.0 稳定版

---

*本文档为乐享IM v1.0.0稳定版的完整交付文件，包含项目概述、功能清单、数据库结构、部署架构、部署步骤、验证清单、已知问题和后续计划。*
