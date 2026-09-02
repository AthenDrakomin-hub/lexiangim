#!/usr/bin/env python3
# 修复Nginx CORS配置

with open("/etc/nginx/sites-available/yefeng-us-cc", "r") as f:
    content = f.read()

# 1. 在proxy_hide_header之后添加server块级别CORS头
old_cors = """    proxy_hide_header Access-Control-Max-Age;

    # WebSocket + API (9003端口)"""

new_cors = """    proxy_hide_header Access-Control-Max-Age;

    # Server块级别CORS头（所有路径包括404都生效）
    add_header Access-Control-Allow-Origin $http_origin always;
    add_header Access-Control-Allow-Credentials "true" always;
    add_header Access-Control-Allow-Methods "GET, POST, PUT, DELETE, PATCH, OPTIONS" always;
    add_header Access-Control-Allow-Headers "Authorization, Content-Type, appkey, X-Requested-With" always;
    add_header Access-Control-Max-Age "86400" always;

    # 处理OPTIONS预检请求（所有路径）
    if ($request_method = OPTIONS) {
        add_header Access-Control-Allow-Origin $http_origin;
        add_header Access-Control-Allow-Credentials "true";
        add_header Access-Control-Allow-Methods "GET, POST, PUT, DELETE, PATCH, OPTIONS";
        add_header Access-Control-Allow-Headers "Authorization, Content-Type, appkey, X-Requested-With";
        add_header Access-Control-Max-Age "86400";
        add_header Content-Length 0;
        add_header Content-Type text/plain;
        return 204;
    }

    # WebSocket + API (9003端口)"""

content = content.replace(old_cors, new_cors)

# 2. 删除/jim/ location块中的重复CORS配置
old_jim_cors = """
        # 动态CORS处理
        add_header Access-Control-Allow-Origin $http_origin always;
        add_header Access-Control-Allow-Credentials "true" always;
        add_header Access-Control-Allow-Methods "GET, POST, PUT, DELETE, PATCH, OPTIONS" always;
        add_header Access-Control-Allow-Headers "Authorization, Content-Type, appkey, X-Requested-With" always;
        add_header Access-Control-Max-Age "86400" always;

        # 处理OPTIONS预检请求
        if ($request_method = 'OPTIONS') {
            add_header Access-Control-Allow-Origin $http_origin;
            add_header Access-Control-Allow-Credentials "true";
            add_header Access-Control-Allow-Methods "GET, POST, PUT, DELETE, PATCH, OPTIONS";
            add_header Access-Control-Allow-Headers "Authorization, Content-Type, appkey, X-Requested-With";
            add_header Access-Control-Max-Age "86400";
            add_header Content-Length 0;
            add_header Content-Type text/plain;
            return 204;
        }
"""

content = content.replace(old_jim_cors, "")

# 3. 删除/api/ location块中的重复CORS配置
old_api_cors = """
        # 动态CORS处理
        add_header Access-Control-Allow-Origin $http_origin always;
        add_header Access-Control-Allow-Credentials "true" always;
        add_header Access-Control-Allow-Methods "GET, POST, PUT, DELETE, PATCH, OPTIONS" always;
        add_header Access-Control-Allow-Headers "Authorization, Content-Type, appkey, X-Requested-With" always;
        add_header Access-Control-Max-Age "86400" always;

        if ($request_method = 'OPTIONS') {
            add_header Access-Control-Allow-Origin $http_origin;
            add_header Access-Control-Allow-Credentials "true";
            add_header Access-Control-Allow-Methods "GET, POST, PUT, DELETE, PATCH, OPTIONS";
            add_header Access-Control-Allow-Headers "Authorization, Content-Type, appkey, X-Requested-With";
            add_header Access-Control-Max-Age "86400";
            add_header Content-Length 0;
            add_header Content-Type text/plain;
            return 204;
        }
"""

content = content.replace(old_api_cors, "")

# 4. 在api server块末尾添加/health端点
old_end = """    # REST API (9001端口)
    location /api/ {
        proxy_pass http://127.0.0.1:9001;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}"""

new_end = """    # REST API (9001端口)
    location /api/ {
        proxy_pass http://127.0.0.1:9001;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # 健康检查端点（IM SDK内部使用）
    location = /health {
        add_header Content-Type "application/json" always;
        return 200 '{"status":"ok"}';
    }
}"""

content = content.replace(old_end, new_end)

with open("/etc/nginx/sites-available/yefeng-us-cc", "w") as f:
    f.write(content)

print("✅ Nginx配置已修改")
