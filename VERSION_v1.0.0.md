# 乐享IM VIP系统 v1.0.0 版本说明

## 版本信息
- 版本号: v1.0.0
- 发布日期: 2026-09-02
- 状态: 稳定版

## 数据库表结构更新

### users 表（用户表）
新增字段:
- vip_level (tinyint, 默认0): VIP等级
  - 0 = 普通用户
  - 1 = VIP用户（可使用客户端管理员功能）

保留原有字段:
- user_type (tinyint, 默认0): 用户类型（核心IM服务使用）
  - 0 = 普通用户
  - 1 = 机器人
  - 其他 = 管理员等

### accounts 表（管理端账号表）
新增字段:
- app_key (varchar(45), 可空): 应用管理员绑定的应用key
  - 系统管理员(role_type=0): 不需要绑定，可管理所有应用
  - 应用管理员(role_type=1): 必须绑定具体应用，只能管理绑定的应用

## 代码字段对齐

### 后端 (imserver-console)
- apis/models/user.go: VipLevel int json:"vip_level"
- dbs/userdao.go: VipLevel int gorm:"vip_level"
  - 常量: VipLevel_Normal=0, VipLevel_VIP=1
- services/userservice.go: 使用 dbs.VipLevel_VIP 判断VIP用户
- services/models/models.go: Account结构体包含 AppKey 字段
- dbs/accountdao.go: AppKey string gorm:"app_key"
- services/accountservice.go: AddAccountWithAppKey, UpdateRoleWithAppKey

### 前端
- 管理后台 userlist.vue: vip_level 字段显示和编辑
- 管理后台 manager.vue: app_key 字段选择和传递
- 客户端 setting.vue: isAdmin = user.vip_level === 1

## 权限体系

### 管理后台角色
- 系统管理员 (role_type=0): 全局仅1个，可管理所有应用
- 应用管理员 (role_type=1): 必须绑定应用，只能管理绑定的应用

### 客户端用户身份
- 普通用户 (vip_level=0): 基础聊天功能
- VIP用户 (vip_level=1): 可使用管理员功能（多开、IP监控、IP变更通知）

## 部署说明

### 数据库升级
首次部署: 基础SQL已包含 vip_level 和 app_key 字段
已存在数据库: 执行 mysql-init/02-upgrade-vip-system.sql

### 编译构建
1. 管理后台前端: cd imserver-console/webconsole/web && npm run build
2. 管理后台后端: cd imserver-console && GOOS=linux GOARCH=amd64 CGO_ENABLED=0 go build -o im-server-console-linux .
3. 客户端前端: cd jugglechat-web && npm run build

### 部署仓库
- lexiang-deploy: 后端二进制 + Docker Compose + 数据库脚本
- lexiang-web-deploy: 客户端前端静态资源（Cloudflare Pages）

## 验证清单
- [ ] 数据库 users 表包含 vip_level 字段
- [ ] 数据库 accounts 表包含 app_key 字段
- [ ] 管理后台创建应用管理员时显示应用选择
- [ ] 管理后台用户管理显示VIP身份标签
- [ ] 管理后台编辑用户可设置VIP身份
- [ ] 客户端VIP用户可见管理员功能
- [ ] 客户端普通用户不可见管理员功能
- [ ] 系统管理员全局仅1个限制生效