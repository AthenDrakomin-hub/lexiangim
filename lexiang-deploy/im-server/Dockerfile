# ============================================================
# 乐享 IM Server - 预编译二进制版本 Dockerfile
# 使用场景: 服务器网络不佳，无法下载Go依赖时
# 使用方法: 本地编译 im-server-linux 后，与本Dockerfile一起上传
# 构建上下文: deploy/im-server/ 目录
# ============================================================

# ---------- 运行时镜像 (无需Go编译环境) ----------
FROM alpine:3.20

# 安装运行时依赖
RUN apk add --no-cache ca-certificates tzdata bash curl \
    && cp /usr/share/zoneinfo/Asia/Shanghai /etc/localtime \
    && echo "Asia/Shanghai" > /etc/timezone

# 创建非 root 用户
RUN addgroup -S appgroup && adduser -S appuser -G appgroup

# 设置工作目录
WORKDIR /app

# 复制预编译的 Linux 二进制文件
# 注意: 二进制文件必须在构建上下文中 (与本Dockerfile同目录)
COPY im-server-linux /app/im-server

# 赋予执行权限
RUN chmod +x /app/im-server

# 复制配置文件模板
COPY config.yml /app/conf/config.yml.template

# 创建必要目录
RUN mkdir -p /app/logs /app/conf /app/kvdb_data \
    && chown -R appuser:appgroup /app

# 切换到非 root 用户
USER appuser

# 暴露端口
# 9001: API 网关
# 9003: WebSocket + 业务 API + Web 前端
# 8090: 管理后台
EXPOSE 9001 9003 8090

# 健康检查
HEALTHCHECK --interval=30s --timeout=10s --start-period=20s --retries=3 \
    CMD curl -f http://127.0.0.1:9003/jim/serverinfos || exit 1

# 启动命令
ENTRYPOINT ["/app/im-server"]
