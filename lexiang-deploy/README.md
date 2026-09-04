# 乐享 IM v1.0.0 - 生产环境部署仓库

> 预编译二进制 + Docker Compose，服务器拉下来就能跑，无需Go环境、无需下载依赖。

## 仓库特点

- **零编译**：包含预编译的 Linux amd64 二进制（76MB im-server，管理后台由内置 admingateway 提供）
- **零依赖下载**：Docker镜像基于alpine，构建时只复制二进制，无需go mod download
- **一键启动**：`docker compose up -d` 即可启动 im-server + MySQL + MinIO
- **数据持久化**：MySQL数据、日志、KVDB全部用Docker Volume持久化
- **生产就绪**：包含Nginx反向代理、WebSocket支持、安全配置、CORS处理

> 管理后台由 im-server 内置的 admingateway 模块提供（端口 8090），无需独立 console 进程。

## 仓库结构

```
lexiang-deploy/
├── docker-compose.yml          # 服务编排（im-server + MySQL + MinIO）
├── .env.example                # 环境变量模板（复制为 .env 后修改）
├── README.md                   # 本文件
├── im-server/
│   ├── im-server-linux         # 预编译 Linux 二进制（76MB，含 IM 服务 + 业务API + 管理后台）
│   ├── Dockerfile              # 运行时镜像（基于alpine，无需Go）
│   ├── Dockerfile.prebuilt     # 预编译版本 Dockerfile
│   └── config.yml              # im-server 生产环境配置
├── nginx/
│   ├── yefeng-us-cc.production.conf  # 生产 Nginx 配置（api + admin 域名）
│   ├── lexiang.conf              # 参考配置模板
│   ├── minio.conf                # MinIO 本地配置
│   └── minio.production.conf     # MinIO 生产配置
└── mysql-init/
    ├── 01-init.sql               # MySQL 初始化脚本
    └── 02-upgrade-vip-system.sql # VIP系统升级脚本
```

## 快速开始（3步启动）

### 1. 克隆仓库

```bash
cd /opt
git clone https://github.com/AthenDrakomin-hub/lexiang-deploy.git
cd lexiang-deploy
```

### 2. 配置环境变量

```bash
cp .env.example .env
nano .env
```

必须修改的变量：
```env
MYSQL_ROOT_PASSWORD=你的强密码
MYSQL_PASSWORD=你的强密码
MINIO_ROOT_PASSWORD=你的强密码
ADMIN_DEFAULT_PASSWORD=管理后台初始密码
```

### 3. 启动服务

```bash
docker compose up -d
```

等待30秒后验证：
```bash
# 查看容器状态
docker compose ps

# 查看日志
docker logs lexiang-im-server --tail 50

# 测试API
curl http://127.0.0.1:9003/jim/serverinfos
```

## 端口说明

| 端口 | 服务 | 说明 |
|------|------|------|
| 9001 | API网关 | 仅本地访问（127.0.0.1） |
| 9003 | WebSocket + 业务API + Web前端 | 仅本地访问，Nginx反代对外 |
| 8090 | 管理后台（admingateway 内置） | 仅本地访问，Nginx反代对外 |
| 3306 | MySQL | 仅本地访问 |
| 9000 | MinIO API | 仅本地访问 |

> 所有端口默认只绑定 127.0.0.1，对外通过 Nginx 反向代理暴露 80/443。
> MinIO 控制台端口（容器内 9001）默认不映射到主机，如需访问可临时添加 `- "127.0.0.1:9006:9001"`。

## Nginx 配置

生产环境使用 `nginx/yefeng-us-cc.production.conf`（已包含 SSL、CORS、WebSocket 完整配置）：

```bash
# 复制配置
cp nginx/yefeng-us-cc.production.conf /etc/nginx/conf.d/

# 修改 SSL 证书路径（如使用 Let's Encrypt）
nano /etc/nginx/conf.d/yefeng-us-cc.production.conf
# 将 /etc/nginx/ssl/*.pem 替换为实际证书路径

# 测试并重载
nginx -t && systemctl reload nginx
```

### SSL 证书

```bash
# 申请证书（替换为实际域名）
certbot --nginx -d api.yefeng.us.cc -d admin.yefeng.us.cc

# 自动续期测试
certbot renew --dry-run
```

> **域名说明**：
> - API 域名：`api.yefeng.us.cc`（灰云直连，Nginx 反代到 im-server）
> - 管理后台：`admin.yefeng.us.cc`（同上）
> - 前端域名：`www.lexiangim.com`（托管在 Cloudflare Pages，不在本服务器）

## 初始化管理员

首次启动后，im-server 会自动创建数据库表。需要手动创建系统管理员：

```bash
# 进入MySQL
docker exec -it lexiang-mysql mysql -uroot -p你的密码 jim_db

# 创建系统管理员（role_type=0 全局唯一）
INSERT INTO admins (username, password, role_type, status, created_at)
VALUES ('admin', SHA1('你的管理员密码'), 0, 1, NOW());

exit;
```

然后访问 `https://admin.你的域名.com` 登录管理后台。

## 前端部署

前端（Vue3）部署到 Cloudflare Pages，参考独立仓库：
- 源码仓库：https://github.com/AthenDrakomin-hub/lexiangim
- 前端部署仓库：https://github.com/AthenDrakomin-hub/lexiang-web-deploy
- 前端构建命令：`cd jugglechat-web && npm run build`
- 部署方式：将 dist/ 内容复制到 lexiang-web-deploy 并 git push

## 数据备份

```bash
# MySQL 备份
docker exec lexiang-mysql mysqldump -uroot -p你的密码 jim_db > backup_$(date +%Y%m%d).sql

# 恢复
docker exec -i lexiang-mysql mysql -uroot -p你的密码 jim_db < backup_20260101.sql
```

建议配置 crontab 每日自动备份：
```bash
0 3 * * * docker exec lexiang-mysql mysqldump -uroot -p你的密码 jim_db | gzip > /backup/lexiang_$(date +\%Y\%m\%d).sql.gz
```

## 更新部署

当源码有更新时，本地重新编译二进制并更新本仓库：

```bash
# 1. 在源码仓库编译 Linux 二进制（仅需 im-server，管理后台已内置）
cd lexiangim/im-server/launcher
GOOS=linux GOARCH=amd64 CGO_ENABLED=0 go build -ldflags="-s -w" -o im-server-linux .

# 2. 复制到部署仓库
cp im-server-linux ../../lexiang-deploy/im-server/

# 3. 提交并推送
cd ../../lexiang-deploy
git add im-server/
git commit -m "update: binaries v1.0.0"
git push
```

## 常见问题

### Q: 启动后 im-server 立即退出？
查看日志：`docker logs lexiang-im-server`
常见原因：config.yml 中 MySQL 地址应为 `mysql:3306`（容器名），不是 `127.0.0.1`。

### Q: 二进制无法执行？
确认是 Linux 版本：`file im-server/im-server-linux`，应输出 `ELF 64-bit LSB executable, x86-64`。

### Q: 想改用源码编译版本？
网络恢复后可使用源码仓库的 `deploy/docker-compose.yml`（多阶段构建版本），无需预编译二进制。

### Q: 如何查看在线用户数？
```bash
curl http://127.0.0.1:9003/jim/serverinfos
```

## 技术支持

- 源码仓库：https://github.com/AthenDrakomin-hub/lexiangim
- 问题反馈：提交 Issue

## VIP系统和管理员权限

### 数据库升级
首次部署时，mysql-init/02-upgrade-vip-system.sql 会自动执行，添加以下字段：
- users.vip_level：VIP等级（0=普通用户，1=VIP用户）
- accounts.app_key：应用管理员绑定的应用key

> **注意**：`vip_level` 是乐享二开新增字段，用于标识客户端管理员身份。`user_type` 是 JuggleIM 原生字段（0=普通用户，1=机器人），二者语义不同，请勿混淆。

### 已存在的数据库
如果数据库已存在，需要手动执行升级脚本：
docker exec -i lexiang-mysql mysql -ulexiang -pLexiang2024User jim_db < mysql-init/02-upgrade-vip-system.sql

### 权限说明
- 系统管理员（accounts.role_type=0）：全局仅1个，可管理所有应用
- 应用管理员（accounts.role_type=1）：必须绑定具体应用，只能管理绑定的应用
- VIP用户（users.vip_level=1）：可使用客户端管理员功能（多开、IP监控等）
- 普通用户（users.vip_level=0）：仅基础聊天功能

### 设置VIP用户
在管理后台 -> 应用内用户管理 -> 编辑用户 -> 选择身份（普通/VIP）
