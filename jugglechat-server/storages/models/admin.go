package models

import "time"

// UserIpLog 用户IP登录记录
type UserIpLog struct {
	Id          int64     `gorm:"column:id;primaryKey;autoIncrement"`
	UserId      string    `gorm:"column:user_id;index"`
	AppKey      string    `gorm:"column:app_key;index"`
	IpAddress   string    `gorm:"column:ip_address"`
	IpLocation  string    `gorm:"column:ip_location"`
	DeviceInfo  string    `gorm:"column:device_info"`
	LoginTime   time.Time `gorm:"column:login_time;index"`
	LogoutTime  *time.Time `gorm:"column:logout_time"`
	CreatedTime time.Time `gorm:"column:created_time"`
}

func (UserIpLog) TableName() string {
	return "user_ip_logs"
}

// AdminMultiAccount 管理员多开账号关联
type AdminMultiAccount struct {
	Id               int64      `gorm:"column:id;primaryKey;autoIncrement"`
	AdminUserId      string     `gorm:"column:admin_user_id;uniqueIndex:uk_admin_sub"`
	SubUserId        string     `gorm:"column:sub_user_id;uniqueIndex:uk_admin_sub"`
	SubLoginAccount  string     `gorm:"column:sub_login_account"`
	SubToken         string     `gorm:"column:sub_token;type:text"`
	AppKey           string     `gorm:"column:app_key"`
	Status           int        `gorm:"column:status"`
	LastActiveTime   *time.Time `gorm:"column:last_active_time"`
	CreatedTime      time.Time  `gorm:"column:created_time"`
	UpdatedTime      time.Time  `gorm:"column:updated_time"`
}

func (AdminMultiAccount) TableName() string {
	return "admin_multi_accounts"
}

// IpChangeNotification IP变动通知
type IpChangeNotification struct {
	Id             int64     `gorm:"column:id;primaryKey;autoIncrement"`
	AdminUserId    string    `gorm:"column:admin_user_id;index"`
	TargetUserId   string    `gorm:"column:target_user_id"`
	TargetNickname string    `gorm:"column:target_nickname"`
	OldIp          string    `gorm:"column:old_ip"`
	NewIp          string    `gorm:"column:new_ip"`
	OldLocation    string    `gorm:"column:old_location"`
	NewLocation    string    `gorm:"column:new_location"`
	ChangeTime     time.Time `gorm:"column:change_time;index"`
	IsRead         int       `gorm:"column:is_read;index"`
	CreatedTime    time.Time `gorm:"column:created_time"`
}

func (IpChangeNotification) TableName() string {
	return "ip_change_notifications"
}

// IAdminStorage 管理功能存储接口
type IAdminStorage interface {
	// 用户角色
	GetUserRole(userId, appKey string) (int, error)
	SetUserRole(userId, appKey string, role int) error

	// IP登录记录
	AddUserIpLog(log *UserIpLog) error
	GetUserLastIp(userId, appKey string) (*UserIpLog, error)
	GetUserIpHistory(userId, appKey string, page, pageSize int) ([]*UserIpLog, int64, error)
	GetAllUsersLatestIp(appKey string, page, pageSize int, keyword string) ([]*UserIpLog, int64, error)

	// 多开账号
	AddMultiAccount(acc *AdminMultiAccount) error
	GetMultiAccounts(adminUserId string) ([]*AdminMultiAccount, error)
	GetMultiAccount(adminUserId, subUserId string) (*AdminMultiAccount, error)
	UpdateMultiAccountToken(adminUserId, subUserId, token string) error
	DeleteMultiAccount(adminUserId, subUserId string) error

	// IP变动通知
	AddIpChangeNotification(ntf *IpChangeNotification) error
	GetIpChangeNotifications(adminUserId string, isRead int, page, pageSize int) ([]*IpChangeNotification, int64, error)
	MarkIpChangeRead(adminUserId string, ids []int64) error
	GetUnreadIpChangeCount(adminUserId string) (int64, error)
}
