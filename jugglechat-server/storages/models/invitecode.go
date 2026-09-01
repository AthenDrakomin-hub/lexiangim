package models

type InviteCode struct {
	ID          int64
	AppKey      string
	Code        string
	Description string
	MaxUses     int    // 0表示无限制
	UsedCount   int
	ExpiresAt   int64  // 0表示永不过期
	Status      int    // 1=启用, 0=禁用
	CreatedTime int64
	UpdatedTime int64
}

type IInviteCodeStorage interface {
	Create(item InviteCode) error
	Delete(appkey, code string) error
	Validate(appkey, code string) (*InviteCode, error)
	IncrementUsed(appkey, code string) error
	List(appkey string, limit int64) ([]*InviteCode, error)
	UpdateStatus(appkey, code string, status int) error
}
