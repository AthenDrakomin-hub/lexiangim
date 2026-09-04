# 乐享IM 核心功能测试问题报告

**测试时间**: 2026-09-03 13:35
**测试类型**: 深度问题诊断

---

## 一、问题汇总

### 🔴 严重问题

#### 1. 用户登录失败 (code: 17003)
**现象**: 所有用户登录返回 `{"code":17003,"msg":""}`

**已排查**:
- ✅ 应用状态正常 (`app_status=1`)
- ✅ appkey正确 (`LXIM2026PROD001`)
- ✅ 用户存在且状态正常 (`status=0`)
- ✅ 密码哈希正确 (MD5格式)
- ✅ API路由已注册 (`POST /jim/login`)

**可能原因**:
- 密码验证逻辑问题（可能需要特定加密方式）
- Token生成失败
- 后端代码bug

#### 2. 用户信息API 404
**现象**: `GET /jim/users/info` 返回 404

**分析**: 
- 路由定义存在，但可能需要Token认证
- 或该接口需要POST而非GET

#### 3. 会话/消息/群组API 404
**现象**: 所有业务API返回404

**已验证的路由**:
```
GET  /jim/serverinfos     ✅ 正常
POST /jim/login           ⚠️ 返回17003
GET  /jim/users/info      ❌ 404
POST /jim/messages/send   ❌ 404
POST /jim/groups/create   ❌ 404
```

---

## 二、API路由发现

从启动日志发现的路由：

### ✅ 正常路由
| 方法 | 路径 | 状态 |
|------|------|------|
| GET | `/jim/serverinfos` | 200 |
| POST | `/jim/login` | 200 (但返回17003) |
| POST | `/jim/register` | 200 |
| POST | `/jim/sms/send` | 200 |
| POST | `/jim/sms_login` | 200 |
| POST | `/jim/email/send` | 200 |
| POST | `/jim/email/login` | 200 |
| POST | `/jim/file_cred` | 200 |
| POST | `/jim/translate` | 200 |
| GET | `/jim/syncconfs` | 200 |
| POST | `/jim/ai/answer` | 200 |

### ❌ 返回404的路由
| 方法 | 路径 | 说明 |
|------|------|------|
| POST | `/jim/user/info` | 路径错误，应为 `/jim/users/info` |
| POST | `/jim/conversation/list` | 路径错误，应为 `/jim/converconfs/get` |
| POST | `/jim/message/send` | 需检查正确路径 |
| POST | `/jim/group/list` | 路径错误，应为 `/jim/groups/mygroups` |

### 正确的API路径（从路由发现）
```
用户:
  GET  /jim/users/info              - 查询用户信息
  POST /jim/users/update            - 更新用户
  POST /jim/users/updpass           - 修改密码
  POST /jim/users/setaccount        - 设置账号
  
群组:
  POST /jim/groups/create           - 创建群组
  GET  /jim/groups/mygroups         - 我的群组列表
  GET  /jim/groups/info             - 群组详情
  POST /jim/groups/members/add      - 添加成员
  
消息:
  POST /jim/messages/recall         - 撤回消息
  POST /jim/messages/del            - 删除消息
  GET  /jim/converconfs/get         - 会话配置
```

---

## 三、已修复的问题

### 1. 应用状态启用
```sql
UPDATE apps SET app_status=1 WHERE app_key='LXIM2026PROD001';
```

### 2. 用户app_key绑定
```sql
UPDATE users SET app_key='LXIM2026PROD001' WHERE login_account='jinyang';
```

### 3. 密码哈希修正
```sql
UPDATE users SET login_pass='b1b2327ccd812b16dde1846c4ff69f7e' 
WHERE login_account='jinyang';
-- MD5("jinyang") = b1b2327ccd812b16dde1846c4ff69f7e
```

---

## 四、待解决问题

### 核心问题：登录失败 (17003)

**可能原因分析**:
1. **密码加密方式不匹配**
   - 数据库存储的是原始MD5
   - 后端可能期望其他加密方式（如SHA1、bcrypt）
   
2. **缺少必要参数**
   - 可能需要额外的认证字段
   
3. **后端代码bug**
   - 需要查看后端源代码
   
4. **JWT Token生成失败**
   - 密钥配置问题

**建议**:
1. 获取后端源代码检查认证逻辑
2. 查看完整错误日志
3. 联系OpenIM/jugglechat开发团队

---

## 五、测试数据

### 用户列表
| user_id | login_account | vip_level | status |
|---------|---------------|-----------|--------|
| RsnAwBbqOwB | jinyang | 1 | 0 |
| _TNkmH9Su-U | jinyang1 | 0 | 0 |
| user01 | user01 | 1 | 0 |
| yefeng | yefeng | 0 | 1 (禁用) |
| kefu | NULL | 0 | 0 |

### 管理员账号
| account | role_type | password |
|---------|-----------|----------|
| admin | 0 (系统管理员) | MD5("123456") |
| yefeng | 0 | MD5("yefeng") |
| lexiang | 1 (应用管理员) | MD5("admin") |

---

## 六、结论

### 当前状态
- ✅ 基础服务正常（健康检查、WebSocket配置）
- ✅ 管理后台可登录
- ✅ 数据库连接正常
- ❌ **用户登录失败**（核心问题）
- ❌ **业务API无法使用**

### 下一步行动
1. **立即**: 获取后端源代码，检查登录认证逻辑
2. **短期**: 修复登录问题，使(code: 17003)变为成功
3. **中期**: 补充完整测试用例
4. **长期**: 建立自动化测试框架

---

**报告生成**: 2026-09-03 13:35
