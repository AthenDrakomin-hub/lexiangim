#!/usr/bin/env python3
# 修复Nginx CORS配置 - 在/health location块中添加CORS头

with open("/etc/nginx/sites-available/yefeng-us-cc", "r") as f:
    content = f.read()

# 在/health location块中添加CORS头
old_health = """    # 健康检查端点（IM SDK内部使用）
    location = /health {
        add_header Content-Type "application/json" always;
        return 200 '{"status":"ok"}';
    }"""

new_health = """    # 健康检查端点（IM SDK内部使用）
    location = /health {
        add_header Access-Control-Allow-Origin $http_origin always;
        add_header Access-Control-Allow-Credentials "true" always;
        add_header Access-Control-Allow-Methods "GET, POST, PUT, DELETE, PATCH, OPTIONS" always;
        add_header Access-Control-Allow-Headers "Authorization, Content-Type, appkey, X-Requested-With" always;
        add_header Access-Control-Max-Age "86400" always;
        add_header Content-Type "application/json" always;
        return 200 '{"status":"ok"}';
    }"""

content = content.replace(old_health, new_health)

with open("/etc/nginx/sites-available/yefeng-us-cc", "w") as f:
    f.write(content)

print("✅ /health location块已添加CORS头")
