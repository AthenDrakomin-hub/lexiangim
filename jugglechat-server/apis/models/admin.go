package models

// 用户角色相关
type GetUserRoleResp struct {
	UserId string `json:"user_id"`
	Role   int    `json:"role"` // 0=普通玩家, 1=应用管理员
}

type SetUserRoleReq struct {
	UserId string `json:"user_id"`
	Role   int    `json:"role"`
}

// 多开账号相关
type AddMultiAccountReq struct {
	Account  string `json:"account"`
	Password string `json:"password"`
}

type MultiAccountItem struct {
	Id              int64  `json:"id"`
	SubUserId       string `json:"sub_user_id"`
	SubLoginAccount string `json:"sub_login_account"`
	SubNickname     string `json:"sub_nickname"`
	SubAvatar       string `json:"sub_avatar"`
	Status          int    `json:"status"`
	LastActiveTime  string `json:"last_active_time"`
	CreatedTime     string `json:"created_time"`
}

type MultiAccountListResp struct {
	List  []*MultiAccountItem `json:"list"`
	Total int64                `json:"total"`
}

type SwitchAccountReq struct {
	SubUserId string `json:"sub_user_id"`
}

type SwitchAccountResp struct {
	UserId        string `json:"user_id"`
	NickName      string `json:"nick_name"`
	Avatar        string `json:"avatar"`
	Authorization string `json:"authorization"`
	ImToken       string `json:"im_token"`
}

type RemoveAccountReq struct {
	SubUserId string `json:"sub_user_id"`
}

// IP监控相关
type UserIpStatusItem struct {
	UserId      string `json:"user_id"`
	Nickname    string `json:"nickname"`
	Avatar      string `json:"avatar"`
	IpAddress   string `json:"ip_address"`
	IpLocation  string `json:"ip_location"`
	DeviceInfo  string `json:"device_info"`
	LoginTime   string `json:"login_time"`
	OnlineStatus int   `json:"online_status"` // 0=离线, 1=在线
}

type UserIpStatusListResp struct {
	List  []*UserIpStatusItem `json:"list"`
	Total int64                `json:"total"`
}

type UserIpHistoryItem struct {
	IpAddress  string `json:"ip_address"`
	IpLocation string `json:"ip_location"`
	DeviceInfo string `json:"device_info"`
	LoginTime  string `json:"login_time"`
	LogoutTime string `json:"logout_time"`
}

type UserIpHistoryResp struct {
	UserId string               `json:"user_id"`
	List   []*UserIpHistoryItem `json:"list"`
	Total  int64                `json:"total"`
}

type IpChangeNotificationItem struct {
	Id             int64  `json:"id"`
	TargetUserId   string `json:"target_user_id"`
	TargetNickname string `json:"target_nickname"`
	OldIp          string `json:"old_ip"`
	NewIp          string `json:"new_ip"`
	OldLocation    string `json:"old_location"`
	NewLocation    string `json:"new_location"`
	ChangeTime     string `json:"change_time"`
	IsRead         int    `json:"is_read"`
}

type IpChangeNotificationListResp struct {
	List        []*IpChangeNotificationItem `json:"list"`
	Total       int64                        `json:"total"`
	UnreadCount int64                        `json:"unread_count"`
}

type MarkIpChangeReadReq struct {
	Ids []int64 `json:"ids"` // 为空则标记全部已读
}
