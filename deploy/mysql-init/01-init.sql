-- ============================================================
-- 乐享 IM - MySQL 初始化脚本
-- 作用: 创建数据库和应用用户 (表结构由 im-server 启动时自动迁移)
-- 放置: deploy/mysql-init/01-init.sql
-- 注意: 此脚本仅在 MySQL 容器首次启动时执行一次
-- ============================================================

-- 创建数据库
CREATE DATABASE IF NOT EXISTS `jim_db`
  DEFAULT CHARACTER SET utf8mb4
  DEFAULT COLLATE utf8mb4_unicode_ci;

-- 创建应用用户 (密码从环境变量 MYSQL_PASSWORD 读取, 此处为示例)
-- 注意: MySQL 容器环境变量 MYSQL_USER / MYSQL_PASSWORD 会自动创建用户
-- 此脚本仅用于额外授权或自定义用户

-- 授予应用用户所有权限 (仅限 jim_db)
-- GRANT ALL PRIVILEGES ON `jim_db`.* TO 'lexiang'@'%';
-- FLUSH PRIVILEGES;

-- 设置时区
SET GLOBAL time_zone = '+08:00';
SET time_zone = '+08:00';
