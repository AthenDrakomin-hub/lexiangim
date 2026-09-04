-- =====================================================
-- 乐享IM VIP系统和管理员权限改造 SQL脚本
-- 版本: v001
-- 执行时间: 2026-09-02
-- 说明: 添加用户身份字段、管理员应用绑定字段
-- =====================================================

-- 创建迁移版本记录表（幂等）
CREATE TABLE IF NOT EXISTS `db_migrations` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `version` VARCHAR(20) NOT NULL UNIQUE COMMENT '迁移版本号',
  `name` VARCHAR(100) NOT NULL COMMENT '迁移名称',
  `applied_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '执行时间',
  `checksum` VARCHAR(64) COMMENT '文件校验和',
  INDEX `idx_version` (`version`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='数据库迁移记录表';

-- 检查并执行迁移（幂等）
-- 只在新建表中执行，已存在则跳过
SELECT @migration_exists := COUNT(*) 
FROM information_schema.tables 
WHERE table_schema = DATABASE() 
AND table_name = 'db_migrations';

-- 插入迁移记录（防止重复执行）
INSERT IGNORE INTO `db_migrations` (`version`, `name`) 
VALUES ('v001', 'VIP系统和管理员权限改造');

-- 1. users表添加vip_level字段（幂等）
SET @current_db = DATABASE();
SET @current_table = 'users';
SET @current_column = 'vip_level';

SET @preparedStatement = (SELECT IF(
  (
    SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
    WHERE
      (table_name = @current_table)
      AND (table_schema = @current_db)
      AND (column_name = @current_column)
  ) > 0,
  'SELECT 1',
  CONCAT('ALTER TABLE ', @current_table, ' ADD COLUMN `vip_level` TINYINT NOT NULL DEFAULT 0 COMMENT ''VIP等级：0=普通用户，1=VIP用户'' AFTER `user_id`;')
));

PREPARE stmt FROM @preparedStatement;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- 2. accounts表添加app_key字段（幂等）
SET @current_table = 'accounts';
SET @current_column = 'app_key';

SET @preparedStatement = (SELECT IF(
  (
    SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
    WHERE
      (table_name = @current_table)
      AND (table_schema = @current_db)
      AND (column_name = @current_column)
  ) > 0,
  'SELECT 1',
  CONCAT('ALTER TABLE ', @current_table, ' ADD COLUMN `app_key` VARCHAR(45) NULL COMMENT ''绑定的应用key（仅应用管理员需要）'' AFTER `role_type`;')
));

PREPARE stmt FROM @preparedStatement;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- 3. 绑定现有应用管理员到乐享应用（幂等）
UPDATE `accounts` 
SET `app_key` = 'LXIM2026PROD001' 
WHERE `account` = 'lexiang' 
AND `role_type` = 1 
AND (`app_key` IS NULL OR `app_key` = '');

-- 4. 设置VIP用户（可选，根据业务需求调整）
-- UPDATE `users` SET `vip_level` = 1 WHERE `login_account` IN ('admin01', 'testadmin');

-- =====================================================
-- 验证查询
-- =====================================================
-- SELECT * FROM db_migrations;
-- SELECT * FROM users WHERE vip_level > 0;
-- SELECT * FROM accounts WHERE app_key IS NOT NULL;
