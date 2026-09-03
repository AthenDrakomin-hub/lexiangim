# Cloudflare Pages — jugglechat-web
#
# 部署方式：Cloudflare Dashboard 手动配置 GitHub 集成
# 或运行以下命令自动部署：
#   npx wrangler pages deploy dist --project-name=lexiang-web
#
# ── Cloudflare Pages 控制台配置 ──────────────────────────
# Project name:   lexiang-web
# Framework:      Vite
# Build command:  npm run build
# Output dir:     dist
# Root dir:       jugglechat-web
#
# Environment Variables（Cloudflare Pages → 项目设置 → 环境变量）:
#   VITE_API_HOST        = api.yefeng.us.cc
#   VITE_WS_HOST         = wss://api.yefeng.us.cc
#   VITE_ADMIN_HOST      = admin.yefeng.us.cc
#
# ── DNS 配置 ────────────────────────────────────────────
# www.lexiang.com        → Cloudflare Pages 自动分配 CNAME
#
# ── Cloudflare 控制台设置 ───────────────────────────────
# SSL/TLS → Always Use HTTPS: ON
# Rules → Transform Rule → Force HTTP to HTTPS: ON
# ───────────────────────────────────────────────────────
