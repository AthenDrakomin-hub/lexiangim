package dbs

import (
	"errors"
	"time"

	"gorm.io/gorm"
	"github.com/juggleim/jugglechat-server/commons/dbcommons"
	"github.com/juggleim/jugglechat-server/storages/models"
)

type AiKeyDao struct{}

// AddApiKey 新增 API Key
func (dao AiKeyDao) AddApiKey(key *models.AiApiKey) error {
	if key.CreatedTime.IsZero() {
		key.CreatedTime = time.Now()
	}
	if key.UpdatedTime.IsZero() {
		key.UpdatedTime = time.Now()
	}
	return dbcommons.GetDb().Create(key).Error
}

// UpdateApiKey 更新 API Key
func (dao AiKeyDao) UpdateApiKey(key *models.AiApiKey) error {
	key.UpdatedTime = time.Now()
	return dbcommons.GetDb().Model(&models.AiApiKey{}).Where("id=?", key.Id).Updates(map[string]interface{}{
		"name":        key.Name,
		"api_key":     key.ApiKey,
		"api_url":     key.ApiUrl,
		"model":       key.Model,
		"bind_type":   key.BindType,
		"bind_user_id": key.BindUserId,
		"status":      key.Status,
		"daily_limit": key.DailyLimit,
		"updated_time": time.Now(),
	}).Error
}

// DeleteApiKey 删除 API Key
func (dao AiKeyDao) DeleteApiKey(id int64) error {
	return dbcommons.GetDb().Where("id=?", id).Delete(&models.AiApiKey{}).Error
}

// GetApiKey 获取单个 API Key
func (dao AiKeyDao) GetApiKey(id int64) (*models.AiApiKey, error) {
	var key models.AiApiKey
	err := dbcommons.GetDb().Where("id=?", id).Take(&key).Error
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, nil
		}
		return nil, err
	}
	return &key, nil
}

// ListApiKeys 列出 API Key
func (dao AiKeyDao) ListApiKeys(appKey string, bindType int, status int) ([]*models.AiApiKey, error) {
	var keys []*models.AiApiKey
	db := dbcommons.GetDb().Model(&models.AiApiKey{}).Where("app_key=?", appKey)
	if bindType >= 0 {
		db = db.Where("bind_type=?", bindType)
	}
	if status >= 0 {
		db = db.Where("status=?", status)
	}
	err := db.Order("created_time desc").Find(&keys).Error
	return keys, err
}

// GetUserBoundKey 获取用户绑定的 Key
func (dao AiKeyDao) GetUserBoundKey(appKey, userId string) (*models.AiApiKey, error) {
	var key models.AiApiKey
	err := dbcommons.GetDb().Where("app_key=? and bind_type=1 and bind_user_id=? and status=0", appKey, userId).
		Order("created_time desc").Take(&key).Error
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, nil
		}
		return nil, err
	}
	return &key, nil
}

// GetAvailableGlobalKeys 获取可用的全局共享 Key（未超每日限额）
func (dao AiKeyDao) GetAvailableGlobalKeys(appKey string) ([]*models.AiApiKey, error) {
	var keys []*models.AiApiKey
	today := time.Now().Format("2006-01-02")
	err := dbcommons.GetDb().Where(`app_key=? and bind_type=0 and status=0
		and (daily_limit=0 or used_today<daily_limit or date(updated_time)<?)`, appKey, today).
		Order("used_today asc, created_time asc").Find(&keys).Error
	return keys, err
}

// IncrementUsage 增加用量
func (dao AiKeyDao) IncrementUsage(id int64) error {
	return dbcommons.GetDb().Model(&models.AiApiKey{}).Where("id=?", id).
		Updates(map[string]interface{}{
			"used_today":     gorm.Expr("used_today + 1"),
			"total_used":     gorm.Expr("total_used + 1"),
			"last_used_time": time.Now(),
		}).Error
}

// ResetDailyUsage 重置每日用量（跨天时调用）
func (dao AiKeyDao) ResetDailyUsage() error {
	return dbcommons.GetDb().Model(&models.AiApiKey{}).
		Where("date(updated_time) < ?", time.Now().Format("2006-01-02")).
		Update("used_today", 0).Error
}

// AddUsageLog 新增调用日志
func (dao AiKeyDao) AddUsageLog(log *models.AiUsageLog) error {
	if log.CreatedTime.IsZero() {
		log.CreatedTime = time.Now()
	}
	return dbcommons.GetDb().Create(log).Error
}

// GetUsageStats 获取全局用量统计
func (dao AiKeyDao) GetUsageStats(appKey string, startDate, endDate string) (*models.AiUsageStats, error) {
	var stats models.AiUsageStats
	db := dbcommons.GetDb().Model(&models.AiUsageLog{}).Where("app_key=?", appKey)
	if startDate != "" {
		db = db.Where("date(created_time)>=?", startDate)
	}
	if endDate != "" {
		db = db.Where("date(created_time)<=?", endDate)
	}
	db.Count(&stats.TotalCalls)
	db.Where("status=0").Count(&stats.SuccessCalls)
	db.Where("status=1").Count(&stats.FailedCalls)
	db.Select("coalesce(sum(total_tokens),0)").Scan(&stats.TotalTokens)
	db.Distinct("user_id").Count(&stats.UserCount)
	return &stats, nil
}

// GetUserUsageStats 获取用户用量统计
func (dao AiKeyDao) GetUserUsageStats(appKey, userId string, startDate, endDate string) (*models.AiUsageStats, error) {
	var stats models.AiUsageStats
	db := dbcommons.GetDb().Model(&models.AiUsageLog{}).Where("app_key=? and user_id=?", appKey, userId)
	if startDate != "" {
		db = db.Where("date(created_time)>=?", startDate)
	}
	if endDate != "" {
		db = db.Where("date(created_time)<=?", endDate)
	}
	db.Count(&stats.TotalCalls)
	db.Where("status=0").Count(&stats.SuccessCalls)
	db.Where("status=1").Count(&stats.FailedCalls)
	db.Select("coalesce(sum(total_tokens),0)").Scan(&stats.TotalTokens)
	stats.UserCount = 1
	return &stats, nil
}
