#!/bin/bash
# ============================================================
# 乐享 IM - 一键部署脚本
# 使用方法：在服务器上执行 bash deploy.sh
# 前提：已 SSH 登录服务器，且拥有 sudo 权限
# ============================================================
set -e

DEPLOY_DIR="/opt/lexiang-deploy"
MYSQL_USER="lexiang"
MYSQL_PASS="Lexiang2024User"
MYSQL_DB="jim_db"

echo "============================================================"
echo "  乐享 IM 一键部署"
echo "  部署目录: $DEPLOY_DIR"
echo "============================================================"

# ---- 1. 拉取最新代码 ----
echo ""
echo "[1/6] 拉取最新代码..."
cd "$DEPLOY_DIR"
git pull origin main

# ---- 2. 执行数据库升级（幂等，重复执行安全）----
echo ""
echo "[2/6] 执行数据库升级..."
if [ -f "mysql-init/02-upgrade-vip-system.sql" ]; then
    docker exec -i lexiang-mysql mysql -u"$MYSQL_USER" -p"$MYSQL_PASS" "$MYSQL_DB" < "mysql-init/02-upgrade-vip-system.sql"
    echo "  ✅ 数据库升级完成"
else
    echo "  ⚠️  跳过：未找到升级脚本"
fi

# ---- 3. 重新构建并启动容器（使用预编译二进制版本）----
echo ""
echo "[3/6] 重新构建 Docker 镜像并启动服务..."
docker compose -f docker-compose.prebuilt.yml up -d

# 等待服务启动
echo "  等待服务启动（约 20 秒）..."
sleep 20

# ---- 4. 验证服务状态 ----
echo ""
echo "[4/6] 检查容器状态..."
docker compose -f docker-compose.prebuilt.yml ps

# ---- 5. 验证数据库迁移 ----
echo ""
echo "[5/6] 验证数据库迁移..."
MIGRATIONS=$(docker exec lexiang-mysql mysql -u"$MYSQL_USER" -p"$MYSQL_PASS" "$MYSQL_DB" -sN -e "SELECT version FROM db_migrations ORDER BY applied_at DESC;" 2>/dev/null || echo "")
if [ -n "$MIGRATIONS" ]; then
    echo "  ✅ 已执行的迁移:"
    echo "$MIGRATIONS" | while read -r ver; do
        echo "    - $ver"
    done
else
    echo "  ⚠️  未找到迁移记录表（可能是首次部署）"
fi

# 验证关键表结构
echo ""
echo "  验证关键表结构:"
docker exec lexiang-mysql mysql -u"$MYSQL_USER" -p"$MYSQL_PASS" "$MYSQL_DB" -e "SHOW COLUMNS FROM users LIKE 'vip_level'; SHOW COLUMNS FROM accounts LIKE 'app_key';" 2>/dev/null && echo "  ✅ 表结构验证通过" || echo "  ⚠️  表结构验证失败"

# ---- 6. 重载 Nginx 配置 ----
echo ""
echo "[6/6] 测试并重载 Nginx 配置..."
cp nginx/yefeng-us-cc.production.conf /etc/nginx/conf.d/yefeng-us-cc.production.conf
nginx -t
systemctl reload nginx
echo "  ✅ Nginx 重载成功"

echo ""
echo "============================================================"
echo "  ✅ 部署完成！"
echo "  客户端:   https://www.lexiangim.com"
echo "  管理后台: https://admin.yefeng.us.cc"
echo "  API 地址: https://api.yefeng.us.cc"
echo "============================================================"
