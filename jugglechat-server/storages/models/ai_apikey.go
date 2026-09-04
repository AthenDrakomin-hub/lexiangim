package models

import "time"

// AiApiKey AI API Key 配置
// bind_type: 0=全局共享（所有VIP用户轮询使用）, 1=绑定指定VIP用户
type AiApiKey struct {
	Id           int64     `gorm:"column:id;primaryKey;autoIncrement"`
	AppKey       string    `gorm:"column:app_key;index"`
	Name         string    `gorm:"column:name"`
	ApiKey       string    `gorm:"column:api_key;type:text"`
	ApiUrl       string    `gorm:"column:api_url"`
	Model        string    `gorm:"column:model"`
	BindType     int       `gorm:"column:bind_type;index"` // 0=全局共享, 1=绑定VIP用户
	BindUserId   string    `gorm:"column:bind_user_id;index"`
	Status       int       `gorm:"column:status;index"` // 0=启用, 1=禁用
	DailyLimit   int       `gorm:"column:daily_limit"`  // 每日调用上限，0=不限制
	UsedToday    int       `gorm:"column:used_today"`   // 今日已用次数
	TotalUsed    int64     `gorm:"column:total_used"`   // 累计调用次数
	LastUsedTime *time.Time `gorm:"column:last_used_time"`
	CreatedTime  time.Time `gorm:"column:created_time"`
	UpdatedTime  time.Time `gorm:"column:updated_time"`
}

func (AiApiKey) TableName() string {
	return "ai_api_keys"
}

// AiUsageLog AI 调用日志
type AiUsageLog struct {
	Id             int64     `gorm:"column:id;primaryKey;autoIncrement"`
	AppKey         string    `gorm:"column:app_key;index"`
	UserId         string    `gorm:"column:user_id;index"`
	ApiKeyId       int64     `gorm:"column:api_key_id;index"`
	ApiKeyName     string    `gorm:"column:api_key_name"`
	RequestTokens  int       `gorm:"column:request_tokens"`
	ResponseTokens int       `gorm:"column:response_tokens"`
	TotalTokens    int       `gorm:"column:total_tokens"`
	Status         int       `gorm:"column:status"` // 0=成功, 1=失败
	ErrorMsg       string    `gorm:"column:error_msg;type:text"`
	DurationMs     int64     `gorm:"column:duration_ms"`
	CreatedTime    time.Time `gorm:"column:created_time;index"`
}

func (AiUsageLog) TableName() string {
	return "ai_usage_logs"
}

// IAiKeyStorage AI Key 存储接口
type IAiKeyStorage interface {
	// Key 管理
	AddApiKey(key *AiApiKey) error
	UpdateApiKey(key *AiApiKey) error
	DeleteApiKey(id int64) error
	GetApiKey(id int64) (*AiApiKey, error)
	ListApiKeys(appKey string, bindType int, status int) ([]*AiApiKey, error)
	GetUserBoundKey(appKey, userId string) (*AiApiKey, error)
	GetAvailableGlobalKeys(appKey string) ([]*AiApiKey, error)

	// 用量统计
	IncrementUsage(id int64) error
	ResetDailyUsage() error
	AddUsageLog(log *AiUsageLog) error
	GetUsageStats(appKey string, startDate, endDate string) (*AiUsageStats, error)
	GetUserUsageStats(appKey, userId string, startDate, endDate string) (*AiUsageStats, error)
}

// AiUsageStats AI 用量统计
type AiUsageStats struct {
	TotalCalls   int64 `json:"total_calls"`
	SuccessCalls int64 `json:"success_calls"`
	FailedCalls  int64 `json:"failed_calls"`
	TotalTokens  int64 `json:"total_tokens"`
	UserCount    int64 `json:"user_count"`
}
