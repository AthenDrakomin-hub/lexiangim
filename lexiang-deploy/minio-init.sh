#!/bin/bash
# ============================================================
# 乐享 IM - MinIO 初始化脚本
# 功能: 创建Bucket + 设置公开读取权限
# 使用方法: 首次启动MinIO后执行一次
# ============================================================

set -e

# 配置（从环境变量读取或使用默认值）
MINIO_ALIAS="${MINIO_ALIAS:-lexiang}"
MINIO_ENDPOINT="${MINIO_ENDPOINT:-http://127.0.0.1:9000}"
MINIO_USER="${MINIO_ROOT_USER:-lexiang}"
MINIO_PASS="${MINIO_ROOT_PASSWORD:-LexiangMinio2024}"
BUCKET_NAME="${MINIO_BUCKET:-lexiang-files}"

echo "=== 乐享 IM MinIO 初始化 ==="
echo "Endpoint: $MINIO_ENDPOINT"
echo "Bucket: $BUCKET_NAME"
echo ""

# 等待MinIO启动
echo "等待MinIO启动..."
for i in {1..30}; do
  if curl -sf "$MINIO_ENDPOINT/minio/health/live" > /dev/null 2>&1; then
    echo "MinIO已启动"
    break
  fi
  echo "等待中... ($i/30)"
  sleep 2
done

# 设置MinIO别名
echo ""
echo "配置MinIO客户端..."
docker exec lexiang-minio mc alias set $MINIO_ALIAS $MINIO_ENDPOINT $MINIO_USER $MINIO_PASS

# 创建Bucket
echo ""
echo "创建Bucket: $BUCKET_NAME"
if docker exec lexiang-minio mc ls $MINIO_ALIAS/$BUCKET_NAME > /dev/null 2>&1; then
  echo "Bucket已存在，跳过创建"
else
  docker exec lexiang-minio mc mb $MINIO_ALIAS/$BUCKET_NAME
  echo "Bucket创建成功"
fi

# 设置公开读取权限
echo ""
echo "设置Bucket公开读取权限..."
docker exec lexiang-minio mc anonymous set download $MINIO_ALIAS/$BUCKET_NAME
echo "权限设置成功"

# 验证
echo ""
echo "=== 验证 ==="
docker exec lexiang-minio mc ls $MINIO_ALIAS/ | grep $BUCKET_NAME

echo ""
echo "=== MinIO初始化完成 ==="
echo "Bucket: $BUCKET_NAME"
echo "访问地址: https://minio.yefeng.us.cc/$BUCKET_NAME/"
echo "管理后台: https://minio-console.yefeng.us.cc/"
echo ""
echo "下一步: 在数据库 fileconfs 表插入MinIO配置"
echo "SQL:"
echo "INSERT INTO fileconfs (app_key, channel, conf, enable) VALUES"
echo "('LXIM2026PROD001', 'minio',"
echo "'{\"access_key\":\"$MINIO_USER\",\"secret_key\":\"$MINIO_PASS\",\"endpoint\":\"minio.yefeng.us.cc\",\"use_ssl\":true,\"bucket\":\"$BUCKET_NAME\"}', 1);"
