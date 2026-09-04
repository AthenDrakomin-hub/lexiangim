#!/bin/bash
# 乐享IM 核心功能测试脚本（修正版）

API="https://api.yefeng.us.cc"
APP_KEY="LXIM2026PROD001"

echo "========================================"
echo "  乐享IM 核心功能测试"
echo "========================================"

# 获取管理员Token
AUTH=$(curl -s "https://admin.yefeng.us.cc/admingateway/login" --insecure -X POST \
  -H "Content-Type: application/json" \
  -d '{"account":"admin","password":"123456"}' | grep -o '"authorization":"[^"]*"' | cut -d'"' -f4)

echo "[Token] ${AUTH:0:20}..."
echo ""

# ==================== 1. 用户登录 ====================
echo "========== [1] 用户登录 =========="
echo "[1.1] 测试用户jinyang登录"
LOGIN_RESULT=$(curl -s "$API/jim/login" --insecure -X POST \
  -H "Content-Type: application/json" \
  -H "appkey: $APP_KEY" \
  -d '{"user_id":"jinyang","password":"jinyang"}')
echo "响应: $LOGIN_RESULT"
echo ""

# ==================== 2. 用户信息 ====================
echo "========== [2] 用户信息 =========="
echo "[2.1] 获取用户信息"
USER_INFO=$(curl -s "$API/jim/user/info" --insecure -X POST \
  -H "Content-Type: application/json" \
  -H "appkey: $APP_KEY" \
  -d '{"user_id":"jinyang"}')
echo "响应: $USER_INFO"
echo ""

# ==================== 3. 会话管理 ====================
echo "========== [3] 会话管理 =========="
echo "[3.1] 会话列表"
CONV_LIST=$(curl -s "$API/jim/conversation/list" --insecure -X POST \
  -H "Content-Type: application/json" \
  -H "appkey: $APP_KEY" \
  -d '{"user_id":"jinyang"}')
echo "响应: $CONV_LIST"
echo ""

# ==================== 4. 消息收发 ====================
echo "========== [4] 消息收发 =========="
echo "[4.1] 发送消息"
SEND_RESULT=$(curl -s "$API/jim/message/send" --insecure -X POST \
  -H "Content-Type: application/json" \
  -H "appkey: $APP_KEY" \
  -d '{"from_user_id":"jinyang","to_user_id":"RsnAwBbqOwB","msg_type":"text","msg_content":"{\"text\":\"Hello from test\"}"}')
echo "响应: $SEND_RESULT"
echo ""

echo "[4.2] 获取历史消息"
HISTORY=$(curl -s "$API/jim/message/history" --insecure -X POST \
  -H "Content-Type: application/json" \
  -H "appkey: $APP_KEY" \
  -d '{"user_id":"jinyang","conversation_id":"RsnAwBbqOwB","conversation_type":0,"offset":0,"count":10}')
echo "响应: $HISTORY"
echo ""

# ==================== 5. 群组功能 ====================
echo "========== [5] 群组功能 =========="
echo "[5.1] 群组列表"
GROUP_LIST=$(curl -s "$API/jim/group/list" --insecure -X POST \
  -H "Content-Type: application/json" \
  -H "appkey: $APP_KEY" \
  -d '{"user_id":"jinyang"}')
echo "响应: $GROUP_LIST"
echo ""

# ==================== 6. WebSocket连接 ====================
echo "========== [6] WebSocket =========="
echo "[6.1] 服务器信息"
SERVER_INFO=$(curl -s "$API/jim/serverinfos" --insecure -H "appkey: $APP_KEY")
echo "响应: $SERVER_INFO"
echo ""

# ==================== 7. 性能测试 ====================
echo "========== [7] 性能测试 =========="
for i in 1 2 3; do
  START=$(date +%s%N)
  curl -s "$API/health" --insecure -o /dev/null
  END=$(date +%s%N)
  DURATION=$(( (END - START) / 1000000 ))
  echo "请求$i: ${DURATION}ms"
done
echo ""

# ==================== 8. 数据库统计 ====================
echo "========== [8] 数据库统计 =========="
docker exec lexiang-mysql mysql -ulexiang -pLexiang2024User jim_db -sN -e \
  "SELECT '用户总数', COUNT(*) FROM users; SELECT '管理员数', COUNT(*) FROM accounts WHERE role_type=0; SELECT '应用管理员', COUNT(*) FROM accounts WHERE role_type=1; SELECT '在线用户', COUNT(*) FROM online_users;" 2>/dev/null
echo ""

echo "========================================"
echo "  测试完成"
echo "========================================"
