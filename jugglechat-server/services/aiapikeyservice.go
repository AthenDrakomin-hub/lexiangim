package services

import (
	"github.com/juggleim/jugglechat-server/commons/errs"
	"github.com/juggleim/jugglechat-server/storages/dbs"
	"github.com/juggleim/jugglechat-server/storages/models"
)

var aiKeyDao = dbs.AiKeyDao{}

// AddAiApiKey 新增 API Key
func AddAiApiKey(appKey, name, apiKey, apiUrl, model string, bindType int, bindUserId string, dailyLimit int) (int64, errs.IMErrorCode) {
	if apiKey == "" {
		return 0, errs.IMErrorCode_APP_REQ_BODY_ILLEGAL
	}
	if apiUrl == "" {
		apiUrl = "https://api.agnes.com/v1/chat/completions"
	}
	if model == "" {
		model = "agnes-free"
	}
	key := &models.AiApiKey{
		AppKey:     appKey,
		Name:       name,
		ApiKey:     apiKey,
		ApiUrl:     apiUrl,
		Model:      model,
		BindType:   bindType,
		BindUserId: bindUserId,
		Status:     0,
		DailyLimit: dailyLimit,
	}
	err := aiKeyDao.AddApiKey(key)
	if err != nil {
		return 0, errs.IMErrorCode_DB_OperationFailed
	}
	return key.Id, errs.IMErrorCode_SUCCESS
}

// UpdateAiApiKey 更新 API Key
func UpdateAiApiKey(id int64, name, apiKey, apiUrl, model string, bindType int, bindUserId string, status int, dailyLimit int) errs.IMErrorCode {
	key, err := aiKeyDao.GetApiKey(id)
	if err != nil {
		return errs.IMErrorCode_DB_OperationFailed
	}
	if key == nil {
		return errs.IMErrorCode_APP_NOT_EXISTED
	}
	key.Name = name
	if apiKey != "" {
		key.ApiKey = apiKey
	}
	key.ApiUrl = apiUrl
	key.Model = model
	key.BindType = bindType
	key.BindUserId = bindUserId
	key.Status = status
	key.DailyLimit = dailyLimit
	err = aiKeyDao.UpdateApiKey(key)
	if err != nil {
		return errs.IMErrorCode_DB_OperationFailed
	}
	return errs.IMErrorCode_SUCCESS
}

// DeleteAiApiKey 删除 API Key
func DeleteAiApiKey(id int64) errs.IMErrorCode {
	err := aiKeyDao.DeleteApiKey(id)
	if err != nil {
		return errs.IMErrorCode_DB_OperationFailed
	}
	return errs.IMErrorCode_SUCCESS
}

// ListAiApiKeys 列出 API Key
func ListAiApiKeys(appKey string, bindType int, status int) ([]*models.AiApiKey, errs.IMErrorCode) {
	keys, err := aiKeyDao.ListApiKeys(appKey, bindType, status)
	if err != nil {
		return nil, errs.IMErrorCode_DB_OperationFailed
	}
	return keys, errs.IMErrorCode_SUCCESS
}

// SelectApiKeyForUser 为用户选择可用的 API Key
// 优先级：用户绑定的 Key > 全局共享 Key（轮询，未超限额）
func SelectApiKeyForUser(appKey, userId string) (*models.AiApiKey, errs.IMErrorCode) {
	// 1. 优先使用用户绑定的 Key
	boundKey, err := aiKeyDao.GetUserBoundKey(appKey, userId)
	if err != nil {
		return nil, errs.IMErrorCode_DB_OperationFailed
	}
	if boundKey != nil {
		// 检查每日限额
		if boundKey.DailyLimit > 0 && boundKey.UsedToday >= boundKey.DailyLimit {
			return nil, errs.IMErrorCode_APP_FORBIDDEN // 用户专属 Key 已超限
		}
		return boundKey, errs.IMErrorCode_SUCCESS
	}

	// 2. 使用全局共享 Key（轮询选择用量最少的）
	globalKeys, err := aiKeyDao.GetAvailableGlobalKeys(appKey)
	if err != nil {
		return nil, errs.IMErrorCode_DB_OperationFailed
	}
	if len(globalKeys) == 0 {
		return nil, errs.IMErrorCode_APP_NOT_EXISTED // 无可用 Key
	}
	// 选择用量最少的第一个（已按 used_today 升序排列）
	return globalKeys[0], errs.IMErrorCode_SUCCESS
}

// RecordAiUsage 记录 AI 调用用量
func RecordAiUsage(appKey, userId string, keyId int64, keyName string, reqTokens, respTokens, totalTokens int, status int, errMsg string, durationMs int64) {
	// 异步记录日志（不阻塞主流程）
	go func() {
		log := &models.AiUsageLog{
			AppKey:         appKey,
			UserId:         userId,
			ApiKeyId:       keyId,
			ApiKeyName:     keyName,
			RequestTokens:  reqTokens,
			ResponseTokens: respTokens,
			TotalTokens:    totalTokens,
			Status:         status,
			ErrorMsg:       errMsg,
			DurationMs:     durationMs,
		}
		aiKeyDao.AddUsageLog(log)
		if status == 0 {
			aiKeyDao.IncrementUsage(keyId)
		}
	}()
}

// GetAiUsageStats 获取用量统计
func GetAiUsageStats(appKey, startDate, endDate string) (*models.AiUsageStats, errs.IMErrorCode) {
	stats, err := aiKeyDao.GetUsageStats(appKey, startDate, endDate)
	if err != nil {
		return nil, errs.IMErrorCode_DB_OperationFailed
	}
	return stats, errs.IMErrorCode_SUCCESS
}

// GetUserAiUsageStats 获取用户用量统计
func GetUserAiUsageStats(appKey, userId, startDate, endDate string) (*models.AiUsageStats, errs.IMErrorCode) {
	stats, err := aiKeyDao.GetUserUsageStats(appKey, userId, startDate, endDate)
	if err != nil {
		return nil, errs.IMErrorCode_DB_OperationFailed
	}
	return stats, errs.IMErrorCode_SUCCESS
}
