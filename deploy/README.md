# 乐享 IM - 生产环境部署文档

## 架构概述

```
                    ┌─────────────────┐
                    │  Cloudflare CDN │
                    │  (前端 + SSL)   │
                    └────────┬────────┘
                             │
              ┌──────────────┼──────────────┐
              │              │              │
     ┌────────▼───┐  ┌──────▼─────┐  ┌────▼─────────┐
     │ 前端静态资源 │  │  API 域名   │  │  管理后台域名 │
     │ Cloudflare  │  │api.lexiang │  │admin.lexiang │
     │   Pages     │  │   .com      │  │   .com        │
     └─────────────┘  └──────┬─────┘  └────┬─────────┘
                               │               │
                    ┌──────────▼───────────────▼──────────┐
                    │            云服务器 (Linux)            │
                    │  ┌─────────────────────────────────┐  │
                    │  │         Nginx 反向代理           │  │
                    │  │  /jim/→9003  /im/→9003(WS)    │  │
                    │  │  /admingateway/→8090            │  │
                    │  └──────────────┬──────────────────┘  │
                    │                 │                      │
                    │  ┌──────────────▼──────────────────┐  │
                    │  │      Docker Compose 容器网络      │  │
                    │  │  ┌──────────┐  ┌──────────────┐ │  │
                    │  │  │ im-server│  │   MySQL 8.0  │ │  │
                    │  │  │ (Go单体) │  │  (jim_db)    │ │  │
                    │  │  │ 9001/9003│  │  3306(本地)  │ │  │
                    │  │  │ /8090    │  │              │ │  │
                    │  │  └──────────┘  └──────────────┘ │  │
                    │  └─────────────────────────────────────┘  │
                    └─────────────────────────────────────────────┘
```

## 前置要求

### 服务器
- 操作系统: Ubuntu 22.04 LTS / CentOS 8+
- 配置: 4核8G 起步 (千人在线建议 8核16G)
- 带宽: 5Mbps 起步 (千人在线建议 20Mbps+)
- 磁盘: 40GB SSD 起步
- 开放端口: 80, 443 (SSH 建议改为非默认端口)

### 软件
- Docker 24.0+
- Docker Compose v2
- Nginx 1.24+
- Git

### 域名
- 主域名: lexiang.com
- 前端域名: app.lexiang.com (Cloudflare Pages)
- API 域名: api.lexiang.com (指向服务器)
- 管理后台域名: admin.lexiang.com (指向服务器)
- 所有域名已接入 Cloudflare

---

## 一、服务器端部署

### 1.1 安装 Docker 和 Docker Compose

```bash
# Ubuntu/Debian
curl -fsSL https://get.docker.com | bash
systemctl enable --now docker

# 验证
docker --version
docker compose version
```

### 1.2 安装 Nginx

```bash
# Ubuntu/Debian
apt update && apt install -y nginx
systemctl enable --now nginx
```

### 1.3 上传项目代码

```bash
# 在服务器上
cd /opt
git clone <你的仓库地址> lexiang
cd lexiang
```

### 1.4 配置环境变量

```bash
cd deploy
cp .env.example .env
nano .env
```

**必须修改以下密码:**
```env
MYSQL_ROOT_PASSWORD=你的强密码
MYSQL_PASSWORD=你的强密码
ADMIN_DEFAULT_PASSWORD=你的强密码
```

### 1.5 修改生产配置

```bash
nano im-server/config.yml
```

确认 MySQL 地址为 `mysql:3306` (Docker 容器名)。

### 1.6 启动 Docker Compose

```bash
cd /opt/lexiang/deploy

# 构建并启动
docker compose up -d --build

# 查看日志
docker compose logs -f im-server

# 等待 MySQL 和 im-server 健康检查通过
docker compose ps
```

### 1.7 配置 Nginx

```bash
# 复制配置文件
cp nginx/lexiang.conf /etc/nginx/conf.d/lexiang.conf

# 修改域名
sed -i 's/api.lexiang.com/你的API域名/g' /etc/nginx/conf.d/lexiang.conf
sed -i 's/admin.lexiang.com/你的管理后台域名/g' /etc/nginx/conf.d/lexiang.conf
sed -i 's/app.lexiang.com/你的前端域名/g' /etc/nginx/conf.d/lexiang.conf

# 测试配置
nginx -t

# 重载
systemctl reload nginx
```

### 1.8 配置 SSL (使用 Cloudflare 代理可跳过)

如果不使用 Cloudflare 代理，使用 Certbot:

```bash
apt install -y certbot python3-certbot-nginx
certbot --nginx -d api.lexiang.com -d admin.lexiang.com
```

---

## 二、前端部署 (Cloudflare Pages)

### 2.1 本地构建测试

```bash
cd jugglechat-web

# 安装依赖
npm install

# 生产构建
npm run build

# 验证 dist 目录
ls -la dist/
```

### 2.2 部署到 Cloudflare Pages

**方式一: Git 集成 (推荐)**

1. 登录 Cloudflare Dashboard → Workers & Pages → Create application → Pages
2. 连接 GitHub 仓库
3. 构建设置:
   - Framework preset: None
   - Build command: `npm run build`
   - Build output directory: `dist`
   - Root directory: `jugglechat-web`
4. 环境变量:
   ```
   VITE_API_HOST=api.lexiang.com
   VITE_WS_HOST=wss://api.lexiang.com
   VITE_ADMIN_HOST=admin.lexiang.com
   NODE_VERSION=18
   ```
5. 点击 Save and Deploy

**方式二: Wrangler CLI**

```bash
cd jugglechat-web
npm install -g wrangler
npx wrangler login
npx wrangler pages deploy dist --project-name=lexiang-im
```

### 2.3 绑定自定义域名

1. Cloudflare Pages → 项目设置 → Custom domains
2. 添加 `app.lexiang.com`
3. 等待 DNS 生效和 SSL 证书签发

### 2.4 复制 _headers 文件

```bash
# 构建后复制 _headers 到 dist
cp deploy/cloudflare/_headers jugglechat-web/dist/_headers
```

或在 package.json 的 build 脚本中添加:
```json
"build": "vite build && cp ../deploy/cloudflare/_headers dist/_headers"
```

---

## 三、DNS 配置

在 Cloudflare DNS 管理中添加以下记录:

| 类型 | 名称 | 内容 | 代理状态 | 说明 |
|------|------|------|----------|------|
| A | api | 服务器IP | 已代理 (橙色云) | API 域名 |
| A | admin | 服务器IP | 已代理 (橙色云) | 管理后台域名 |
| CNAME | app | lexiang-im.pages.dev | 已代理 | 前端域名 (Pages自动配置) |

**注意:**
- API 和管理后台域名建议开启 Cloudflare 代理 (橙色云)，享受 CDN 和 DDoS 防护
- WebSocket 在 Cloudflare 免费层已支持，无需额外配置
- 如果 WebSocket 连接不稳定，可将 API 域名改为 DNS only (灰色云)，直连源站

---

## 四、初始化管理员账号

### 4.1 首次登录管理后台

1. 访问 `https://admin.lexiang.com`
2. 默认账号: `admin`
3. 默认密码: `123456` (**首次登录后立即修改**)

### 4.2 创建应用

1. 应用管理 → 创建应用
2. 应用名称: `乐享`
3. 记录生成的 `app_key` 和 `app_secret`

### 4.3 指定应用内管理员

1. 用户管理 → 找到目标用户
2. 编辑 → 角色 → 选择 `应用管理员`
3. 保存

---

## 五、安全加固

### 5.1 服务器安全

```bash
# 1. 修改 SSH 端口
nano /etc/ssh/sshd_config
# Port 22 → Port 你的自定义端口
systemctl restart sshd

# 2. 配置防火墙 (UFW)
ufw default deny incoming
ufw default allow outgoing
ufw allow 80/tcp
ufw allow 443/tcp
ufw allow 你的SSH端口/tcp
ufw enable

# 3. 禁止 root 登录
nano /etc/ssh/sshd_config
# PermitRootLogin no

# 4. 安装 Fail2Ban
apt install -y fail2ban
systemctl enable --now fail2ban
```

### 5.2 数据库安全

- MySQL 仅监听 `127.0.0.1` (docker-compose 已配置)
- 使用强密码
- 定期备份
- 禁止远程 root 登录

### 5.3 应用安全

- 修改默认管理员密码
- 管理后台域名建议开启 Cloudflare Access (可选)
- 定期更新依赖包
- 配置日志审计

---

## 六、备份策略

### 6.1 MySQL 自动备份

```bash
# 创建备份脚本
cat > /opt/lexiang/backup.sh << 'EOF'
#!/bin/bash
BACKUP_DIR="/opt/backups"
DATE=$(date +%Y%m%d_%H%M%S)
mkdir -p $BACKUP_DIR

# 备份 MySQL
docker exec lexiang-mysql mysqldump -u root -p'你的密码' --single-transaction --routines --triggers jim_db > $BACKUP_DIR/jim_db_$DATE.sql

# 压缩
gzip $BACKUP_DIR/jim_db_$DATE.sql

# 保留最近7天
find $BACKUP_DIR -name "*.sql.gz" -mtime +7 -delete

echo "Backup completed: $BACKUP_DIR/jim_db_$DATE.sql.gz"
EOF

chmod +x /opt/lexiang/backup.sh

# 添加定时任务 (每天凌晨3点)
crontab -e
# 0 3 * * * /opt/lexiang/backup.sh >> /var/log/lexiang-backup.log 2>&1
```

### 6.2 异地备份 (可选)

- 同步备份文件到对象存储 (阿里云 OSS / AWS S3)
- 或使用 rclone 同步到其他云存储

---

## 七、监控和日志

### 7.1 容器监控

```bash
# 查看容器状态
docker compose ps

# 查看资源使用
docker stats

# 查看日志
docker compose logs -f im-server
docker compose logs -f mysql
```

### 7.2 日志轮转

Docker 容器日志默认会无限增长，配置日志轮转:

```bash
# 创建/修改 /etc/docker/daemon.json
cat > /etc/docker/daemon.json << 'EOF'
{
  "log-driver": "json-file",
  "log-opts": {
    "max-size": "100m",
    "max-file": "3"
  }
}
EOF

systemctl restart docker
```

### 7.3 Nginx 日志

```bash
# 访问日志
tail -f /var/log/nginx/access.log

# 错误日志
tail -f /var/log/nginx/error.log
```

---

## 八、性能优化 (千人在线)

### 8.1 MySQL 优化

已在 docker-compose.yml 中配置:
- max-connections=1000
- innodb-buffer-pool-size=1G (根据内存调整)
- innodb-flush-log-at-trx-commit=2
- sync-binlog=0

### 8.2 Nginx 优化

```nginx
# /etc/nginx/nginx.conf
worker_processes auto;
worker_rlimit_nofile 65535;

events {
    worker_connections 4096;
    use epoll;
    multi_accept on;
}

http {
    sendfile on;
    tcp_nopush on;
    tcp_nodelay on;
    keepalive_timeout 65;
    keepalive_requests 1000;
    client_max_body_size 50m;

    # gzip
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_types text/plain text/css application/json application/javascript text/xml;
}
```

### 8.3 系统参数优化

```bash
cat >> /etc/sysctl.conf << 'EOF'
# 网络优化
net.core.somaxconn = 65535
net.core.netdev_max_backlog = 65535
net.ipv4.tcp_max_syn_backlog = 65535
net.ipv4.tcp_fin_timeout = 30
net.ipv4.tcp_tw_reuse = 1
net.ipv4.ip_local_port_range = 1024 65535
net.ipv4.tcp_max_tw_buckets = 5000

# 文件描述符
fs.file-max = 1000000
EOF

sysctl -p

# 增大文件描述符限制
echo "* soft nofile 65535" >> /etc/security/limits.conf
echo "* hard nofile 65535" >> /etc/security/limits.conf
```

---

## 九、常见问题排查

### 9.1 im-server 启动失败

```bash
# 查看日志
docker compose logs im-server

# 常见原因:
# 1. MySQL 未就绪 - 等待健康检查通过后自动重启
# 2. 配置文件错误 - 检查 config.yml
# 3. 端口被占用 - 检查 9001/9003/8090
```

### 9.2 前端无法连接 API

```bash
# 1. 检查 CORS 配置
# 2. 检查 Nginx 代理
curl -I https://api.lexiang.com/jim/serverinfos

# 3. 检查 Cloudflare 代理状态
# 4. 浏览器控制台查看具体错误
```

### 9.3 WebSocket 连接失败

```bash
# 1. 检查 Nginx Upgrade header
# 2. Cloudflare 免费层支持 WebSocket, 确认已开启
# 3. 检查防火墙是否放行
# 4. 如不稳定, 将 API 域名改为 DNS only (灰色云)
```

### 9.4 管理后台无法登录

```bash
# 1. 检查 8090 端口
docker compose exec im-server netstat -tlnp | grep 8090

# 2. 检查 Nginx 代理
curl -I https://admin.lexiang.com/admingateway/login

# 3. 重置管理员密码
docker exec lexiang-mysql mysql -u root -p'密码' jim_db -e "UPDATE admin_users SET password=SHA1('新密码') WHERE account='admin';"
```

### 9.5 数据库连接失败

```bash
# 1. 检查 MySQL 容器状态
docker compose ps mysql

# 2. 检查配置文件中的 MySQL 地址 (应为 mysql:3306)
# 3. 检查网络
docker compose exec im-server ping mysql
```

---

## 十、更新部署

### 10.1 更新后端

```bash
cd /opt/lexiang
git pull
cd deploy
docker compose up -d --build im-server
```

### 10.2 更新前端

```bash
# Git 集成方式: push 到 main 分支自动部署
git push origin main

# 或手动部署
cd jugglechat-web
npm run build
npx wrangler pages deploy dist --project-name=lexiang-im
```

### 10.3 回滚

```bash
# 后端回滚
docker compose down
git checkout <上一个版本>
docker compose up -d --build

# 前端回滚: Cloudflare Pages → Deployments → 选择历史版本 → Rollback
```

---

## 十一、交付物清单

| 文件 | 路径 | 说明 |
|------|------|------|
| Dockerfile | deploy/im-server/Dockerfile | im-server 多阶段构建 |
| docker-compose.yml | deploy/docker-compose.yml | 服务编排 |
| config.yml | deploy/im-server/config.yml | 生产环境配置 |
| .env.example | deploy/.env.example | 环境变量模板 |
| lexiang.conf | deploy/nginx/lexiang.conf | Nginx 反向代理 |
| wrangler.toml | deploy/cloudflare/wrangler.toml | Cloudflare Pages 配置 |
| _headers | deploy/cloudflare/_headers | Cloudflare 响应头 |
| 01-init.sql | deploy/mysql-init/01-init.sql | MySQL 初始化 |
| .env.development | jugglechat-web/.env.development | 前端开发环境变量 |
| .env.production | jugglechat-web/.env.production | 前端生产环境变量 |
| config.js | jugglechat-web/src/config.js | 前端配置 (已修改) |
| README.md | deploy/README.md | 本文档 |

---

## 十二、联系人与支持

- 项目仓库: [你的仓库地址]
- 部署问题: 查看本文档「常见问题排查」章节
- 紧急问题: 查看服务器日志 `docker compose logs`

---

**文档版本**: v1.0
**最后更新**: 2026-09-02
**适用版本**: 乐享 IM v2.0
