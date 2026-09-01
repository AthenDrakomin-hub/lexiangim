# ============================================================
# 乐享 IM Server - 多阶段构建 Dockerfile
# 构建上下文: 项目根目录 (../..)
# 包含: im-server + jugglechat-server + imserver-console (单体集成模式)
# ============================================================

# ---------- 阶段1: 构建 Go 二进制 ----------
FROM golang:1.22-alpine AS builder

# 安装构建依赖
RUN apk add --no-cache git gcc musl-dev

# 设置工作目录
WORKDIR /build

# 设置 Go 环境变量
ENV GO111MODULE=on \
    CGO_ENABLED=1 \
    GOOS=linux \
    GOARCH=amd64 \
    GOPROXY=https://goproxy.cn,direct

# 先复制 go.mod 和 go.sum 缓存依赖
COPY im-server/go.mod im-server/go.sum ./im-server/
COPY jugglechat-server/go.mod jugglechat-server/go.sum ./jugglechat-server/
COPY imserver-console/go.mod imserver-console/go.sum ./imserver-console/

# 下载依赖
WORKDIR /build/im-server
RUN go mod download

# 复制全部源代码
WORKDIR /build
COPY . .

# 编译 im-server (launcher 入口，集成 jugglechat-server + imserver-console)
WORKDIR /build/im-server/launcher
RUN go build -ldflags="-s -w" -o /build/im-server .

# ---------- 阶段2: 运行时镜像 ----------
FROM alpine:3.20

# 安装运行时依赖
RUN apk add --no-cache ca-certificates tzdata bash curl \
    && cp /usr/share/zoneinfo/Asia/Shanghai /etc/localtime \
    && echo "Asia/Shanghai" > /etc/timezone

# 创建非 root 用户
RUN addgroup -S appgroup && adduser -S appuser -G appgroup

# 设置工作目录
WORKDIR /app

# 复制二进制文件
COPY --from=builder /build/im-server /app/im-server

# 复制配置文件模板 (运行时通过 volume 挂载实际配置)
COPY im-server/launcher/conf/config.yml /app/conf/config.yml.template

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
