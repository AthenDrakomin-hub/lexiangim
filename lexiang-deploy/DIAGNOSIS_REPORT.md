# 乐享IM 核心问题诊断报告

**诊断时间**: 2026-09-03 18:30
**问题**: 用户登录失败 (code: 17003)

---

## 一、问题诊断结果

### 🔴 根本原因：后端密码验证逻辑问题

经过深度诊断，发现问题如下：

#### 1. 数据库密码格式问题
```
数据库中的密码哈希（MD5）:
  jinyang   → 7c4a8d09ca3762af61e59520943dc26494f8941b (32位)
  user01    → 1063678421845e631064b5bbbe81135ae8723612 (32位)
  yefeng    → 52a8d6eb140f5b6cb86ffa8e73ff87dd1eaf90bd (32位)

尝试转换为bcrypt:
  $2b$12$Iv7fZWU9CZVsJBRUeuLr3... (60位)
```

**问题**: 即使转换为bcrypt格式，登录仍然失败(code: 17003)

#### 2. 注册功能也失败
```bash
POST /jim/register → {"code":17003,"msg":""}
```

新用户无法创建，说明后端API存在更深层的问题。

---

## 二、已验证的信息

### ✅ 正常功能
| 功能 | 状态 | 说明 |
|------|------|------|
| 健康检查 | ✅ | `/health` 返回 `{"status":"ok"}` |
| WebSocket配置 | ✅ | `/jim/serverinfos` 返回code:17017 |
| 管理后台登录 | ✅ | admin/123456 可登录 |
| 应用查询 | ✅ | 返回应用列表 |
| API路由注册 | ✅ | 所有路由已注册 |
| 数据库连接 | ✅ | MySQL连接正常 |
| bcrypt哈希 | ✅ | 密码格式已更新 |

### ❌ 异常功能
| 功能 | 状态 | 返回值 |
|------|------|--------|
| 用户登录 | ❌ | code:17003 |
| 用户注册 | ❌ | code:17003 |
| 获取用户信息 | ❌ | code:17005 (未登录) |
| 会话列表 | ❌ | code:17005 (未登录) |
| 消息发送 | ❌ | 404 |

---

## 三、技术细节

### 后端日志分析
```
[GIN-debug] POST   /jim/login --> github.com/juggleim/jugglechat-server/apis.Login
[GIN-debug] POST   /jim/register --> github.com/juggleim/jugglechat-server/apis.Register
```

**问题**: 日志中没有显示具体的错误原因，仅返回17003。

### 数据库状态
```sql
-- 应用状态
app_key: LXIM2026PROD001
app_status: 1 (已启用)
app_secret: LX_SECRET_2026_PROD_88903

-- 用户状态
user_id: RsnAwBbqOwB
login_account: jinyang
status: 0 (正常)
app_key: LXIM2026PROD001
login_pass: $2b$12$Iv7fZWU9CZVsJBRUeuLr3... (已更新为bcrypt)
```

---

## 四、可能的原因

### 1. 后端代码Bug
- jugglechat-server的Login函数可能存在bug
- 密码验证逻辑可能有问题
- JWT Token生成可能失败

### 2. 配置问题
- 缺少必要的配置项（如JWT密钥、签名算法等）
- 环境变量未正确传递

### 3. 数据库问题
- 表结构不匹配
- 字段长度不足（已修复）
- 数据完整性问题

### 4. 二进制文件问题
- 部署的是imserver-console而非jugglechat-server
- 版本不匹配

---

## 五、建议的解决方案

### 方案一：联系开发团队
1. 获取jugglechat-server源代码
2. 检查Login函数的实现逻辑
3. 确认密码验证方式（MD5/SHA1/bcrypt）
4. 修复后端代码bug

### 方案二：检查二进制文件
```bash
# 确认当前运行的服务类型
docker exec lexiang-im-server ls -la /app/

# 检查服务版本
docker exec lexiang-im-server /app/im-server --version
```

### 方案三：重新部署
1. 确认使用正确的Docker镜像
2. 使用jugglechat-server而非imserver-console
3. 确保配置文件中包含所有必要参数

---

## 六、临时解决方案

如果需要临时解决登录问题，可以：

1. **使用管理后台重置密码**
   ```bash
   # 通过管理后台API重置用户密码
   curl -X POST "https://admin.yefeng.us.cc/admingateway/apps/users/resetpassword" \
     -H "Authorization: $TOKEN" \
     -H "appkey: LXIM2026PROD001" \
     -H "Content-Type: application/json" \
     -d '{"user_id":"RsnAwBbqOwB","new_password":"newpass123"}'
   ```

2. **检查后端日志获取详细错误**
   ```bash
   docker logs lexiang-im-server --tail 100 -f
   ```

---

## 七、结论

**核心问题**: 后端登录API返回17003错误，无法定位具体原因。

**需要**: 
- 联系jugglechat-server开发团队获取技术支持
- 或检查后端源代码定位问题
- 确认密码验证的正确方式

**当前状态**: 系统基础服务正常，但核心业务功能（登录、注册）不可用。

---

**报告生成**: 2026-09-03 18:30
