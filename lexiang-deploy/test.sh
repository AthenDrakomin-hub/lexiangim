#!/bin/bash
# 乐享IM功能测试脚本

API_BASE="https://api.yefeng.us.cc"
ADMIN_BASE="https://admin.yefeng.us.cc"
APP_KEY="LXIM2026PROD001"

echo "========================================"
echo "  乐享IM 功能测试"
echo "========================================"

# 1. 健康检查
echo ""
echo "[1] 健康检查"
curl -s "$API_BASE/health" --insecure
echo ""

# 2. WebSocket连接信息
echo ""
echo "[2] WebSocket配置"
curl -s "$API_BASE/jim/serverinfos" --insecure -H "appkey: $APP_KEY"
echo ""

# 3. 管理员登录
echo ""
echo "[3] 管理后台登录"
AUTH=$(curl -s "$ADMIN_BASE/admingateway/login" --insecure -X POST \
  -H "Content-Type: application/json" \
  -d '{"account":"admin","password":"123456"}' | grep -o '"authorization":"[^"]*"' | cut -d'"' -f4)
echo "登录成功，Token: ${AUTH:0:30}..."
echo ""

# 4. 应用列表
echo "[4] 应用列表"
curl -s "$ADMIN_BASE/admingateway/apps/list" --insecure \
  -H "Authorization: $AUTH" \
  -H "appkey: $APP_KEY"
echo ""

# 5. 用户列表
echo "[5] 用户列表（前10条）"
curl -s "$ADMIN_BASE/admingateway/apps/users/list?page_size=10" --insecure \
  -H "Authorization: $AUTH" \
  -H "appkey: $APP_KEY"
echo ""

# 6. 数据库统计
echo "[6] 数据库统计"
docker exec lexiang-mysql mysql -ulexiang -pLexiang2024User jim_db -sN -e \
  "SELECT '用户数', COUNT(*) FROM users; SELECT '管理员数', COUNT(*) FROM accounts WHERE role_type=0; SELECT '应用管理员数', COUNT(*) FROM accounts WHERE role_type=1;" 2>/dev/null

# 7. MinIO存储
echo ""
echo "[7] MinIO存储状态"
docker exec lexiang-minio mc ls minio/ 2>/dev/null || echo "无Bucket或无法访问"

echo ""
echo "========================================"
echo "  测试完成"
echo "========================================"
