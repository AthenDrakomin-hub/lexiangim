# 乐享IM 部署规范

> 本文档记录乐享IM容器化部署的关键规范和踩坑教训，所有部署操作必须遵循。

---

## 一、核心概念

### 1.1 二进制说明

**核心IM服务（im-server/launcher）**
- 一个二进制同时启动3个端口
- `9001` - API网关（业务API）
- `9003` - WebSocket连接 + 业务API + Web前端
- `8090` - 管理后台
- 编译入口：`im-server/launcher/main.go`
- 二进制大小：约102MB（Git LFS管理）

**⚠️ 常见错误**：不要使用独立的 `imserver-console` 二进制部署，那个只包含管理后台，没有API和WebSocket！

### 1.2 编译命令

```bash
cd im-server/launcher
GOOS=linux GOARCH=amd64 CGO_ENABLED=0 go build -o im-server-linux .
```

**注意**：编译前必须先构建管理后台前端（`imserver-console/webconsole/web`），因为核心IM服务嵌入了管理后台前端资源。

```bash
cd imserver-console/webconsole/web
npm install && npm run build
```

---

## 二、Git LFS 规范

### 2.1 为什么需要Git LFS

核心IM服务二进制约102MB，超过GitHub的100MB文件大小限制，必须使用Git LFS管理。

### 2.2 本地配置

```bash
# 安装Git LFS（Windows通常自带，Linux需要手动安装）
# Ubuntu/Debian:
apt-get install git-lfs

# 初始化
git lfs install

# 跟踪大文件
git lfs track "im-server/im-server-linux"

# 提交.gitattributes
git add .gitattributes
```

### 2.3 服务器拉取

```bash
# 服务器必须安装Git LFS
apt-get install git-lfs
git lfs install

# 拉取代码（包含LFS对象）
git pull
git lfs pull
```

**⚠️ 常见错误**：服务器只执行 `git pull` 不执行 `git lfs pull`，会导致二进制文件是LFS指针而不是真实文件！

---

## 三、Docker 规范

### 3.1 文件结构

```
lexiang-deploy/
├── docker-compose.yml          # 容器编排
├── .env.example                # 环境变量模板
├── .gitattributes              # Git LFS配置
├── DEPLOYMENT.md               # 本文档
├── README.md                   # 项目说明
├── im-server/
│   ├── im-server-linux         # 核心IM服务二进制（Git LFS）
│   ├── Dockerfile              # Docker构建文件
│   ├── Dockerfile.prebuilt     # 预编译版本Dockerfile（docker-compose引用）
│   └── config.yml              # 应用配置（硬编码，不使用模板变量）
├── mysql-init/
│   ├── 01-init.sql             # 基础表结构
│   └── 02-upgrade-vip-system.sql  # VIP系统升级脚本
└── nginx/
    ├── lexiang.conf            # IM服务Nginx配置
    └── minio.conf              # MinIO Nginx配置
```

### 3.2 端口规范

| 服务 | 容器内端口 | 宿主机端口 | 说明 |
|------|-----------|-----------|------|
| im-server API | 9001 | 127.0.0.1:9001 | API网关 |
| im-server WS | 9003 | 127.0.0.1:9003 | WebSocket + Web前端 |
| im-server Admin | 8090 | 127.0.0.1:8090 | 管理后台 |
| MySQL | 3306 | 127.0.0.1:3306 | 数据库 |
| MinIO API | 9000 | 127.0.0.1:9000 | 对象存储API |
| MinIO Console | 9001 | 127.0.0.1:9005 | 对象存储管理后台 |

**⚠️ 端口冲突警告**：MinIO容器内管理后台端口是9001，和im-server的API网关端口9001冲突！宿主机映射必须改为9005，容器内保持9001不变。

### 3.3 配置文件规范

**config.yml 必须硬编码MySQL连接信息**，不要使用 `${MYSQL_USER}` 这样的模板变量，因为Go应用启动时不会展开这些变量。

```yaml
# ✅ 正确：硬编码
mysql:
  user: lexiang
  password: Lexiang2024User
  address: mysql:3306
  name: jim_db

# ❌ 错误：使用模板变量（Go不会展开）
mysql:
  user: ${MYSQL_USER}
  password: ${MYSQL_PASSWORD}
  address: mysql:3306
  name: jim_db
```

### 3.4 二进制权限

Dockerfile中必须赋予二进制可执行权限：

```dockerfile
COPY im-server-linux /app/im-server
RUN chmod +x /app/im-server
```

**⚠️ 常见错误**：Git LFS拉取的文件可能没有可执行权限，Docker构建时必须显式chmod。

---

## 四、部署流程

### 4.1 首次部署

```bash
# 1. 克隆仓库（包含LFS）
git clone https://github.com/AthenDrakomin-hub/lexiang-deploy.git
cd lexiang-deploy
git lfs install
git lfs pull

# 2. 配置环境变量
cp .env.example .env
# 编辑.env，设置MySQL密码等

# 3. 验证二进制是真实文件（不是LFS指针）
ls -lh im-server/im-server-linux
# 应该显示约102MB，不是几百字节

# 4. 启动服务
docker compose up -d --build

# 5. 等待MySQL初始化（约30秒）
sleep 30

# 6. 验证端口
docker exec lexiang-im-server netstat -tlnp | grep -E '9001|9003|8090'

# 7. 验证API
curl http://127.0.0.1:9003/jim/serverinfos?no=1688

# 8. 验证管理后台
curl -I http://127.0.0.1:8090
```

### 4.2 版本升级

```bash
# 1. 拉取最新代码
cd /opt/lexiang-deploy
git pull
git lfs pull

# 2. 执行数据库升级（如果有新的SQL脚本）
docker exec -i lexiang-mysql mysql -ulexiang -pLexiang2024User jim_db < mysql-init/02-upgrade-vip-system.sql

# 3. 重建并重启im-server
docker compose up -d --build im-server

# 4. 验证
docker compose ps
curl http://127.0.0.1:9003/jim/serverinfos?no=1688
```

### 4.3 完整重启（所有服务）

```bash
cd /opt/lexiang-deploy
docker compose down
docker compose up -d --build
```

---

## 五、验证清单

部署完成后必须逐项验证：

- [ ] `docker compose ps` 显示3个容器都healthy/running
- [ ] `9001`端口监听（API网关）
- [ ] `9003`端口监听（WebSocket）
- [ ] `8090`端口监听（管理后台）
- [ ] `curl http://127.0.0.1:9003/jim/serverinfos?no=1688` 返回 `{"code":0,"msg":"success"}`
- [ ] `curl -I http://127.0.0.1:8090` 返回HTTP 200
- [ ] Nginx反代HTTPS正常，无502错误
- [ ] 登录接口正常，admin01登录成功
- [ ] 客户端 `https://www.lexiangim.com` 可正常登录聊天

---

## 六、常见问题排查

### 6.1 API/WS端口未监听

**症状**：只有8090端口监听，9001/9003未监听

**原因**：部署的二进制是独立管理后台（imserver-console），不是核心IM服务

**解决**：重新编译核心IM服务（im-server/launcher），替换二进制

### 6.2 二进制文件太小

**症状**：`ls -lh im-server-linux` 显示只有几百字节

**原因**：Git LFS未正确拉取，文件是LFS指针而不是真实二进制

**解决**：
```bash
git lfs install
git lfs pull
ls -lh im-server/im-server-linux  # 应该约102MB
```

### 6.3 Nginx 502错误

**症状**：HTTPS访问返回502 Bad Gateway

**原因**：后端服务未启动或端口未监听

**解决**：
```bash
# 检查容器状态
docker compose ps

# 检查端口监听
docker exec lexiang-im-server netstat -tlnp | grep -E '9001|9003|8090'

# 查看容器日志
docker logs lexiang-im-server --tail 50
```

### 6.4 MySQL连接失败

**症状**：容器日志显示MySQL连接错误

**原因**：config.yml使用了模板变量 `${MYSQL_USER}`，Go不会展开

**解决**：修改config.yml，硬编码MySQL连接信息

### 6.5 MinIO端口冲突

**症状**：im-server启动失败，端口9001被占用

**原因**：MinIO管理后台端口9001和im-server API网关端口9001冲突

**解决**：docker-compose.yml中MinIO宿主机端口改为9005
```yaml
ports:
  - "127.0.0.1:9000:9000"   # API端口
  - "127.0.0.1:9005:9001"   # 管理后台端口（宿主机9005，容器内9001）
```

---

## 七、生产环境信息

| 项目 | 值 |
|------|-----|
| 部署目录 | `/opt/lexiang-deploy/` |
| 服务器IP | 45.77.31.155 |
| 前端域名 | https://www.lexiangim.com |
| API域名 | https://api.yefeng.us.cc |
| 管理后台域名 | https://admin.yefeng.us.cc |
| MinIO域名 | https://minio.yefeng.us.cc |
| 数据库 | jim_db / lexiang / Lexiang2024User |
| 组织代码 | 1688 |
| AppKey | LXIM2026PROD001 |

---

*本文档最后更新：2026-09-02，v1.0.0稳定版*
