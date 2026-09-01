package services

import (
	"context"
	"net"
	"time"

	"github.com/juggleim/jugglechat-server/apis/models"
	"github.com/juggleim/jugglechat-server/commons/ctxs"
	"github.com/juggleim/jugglechat-server/commons/errs"
	"github.com/juggleim/jugglechat-server/commons/imsdk"
	utils "github.com/juggleim/jugglechat-server/commons/tools"
	"github.com/juggleim/jugglechat-server/storages"
	storageModels "github.com/juggleim/jugglechat-server/storages/models"
	juggleimsdk "github.com/juggleim/imserver-sdk-go"
)

// ========== 角色管理 ==========

func GetUserRole(ctx context.Context, userId string) (int, errs.IMErrorCode) {
	appkey := ctxs.GetAppKeyFromCtx(ctx)
	storage := storages.NewAdminStorage()
	role, err := storage.GetUserRole(userId, appkey)
	if err != nil {
		return 0, errs.IMErrorCode_APP_DEFAULT
	}
	return role, errs.IMErrorCode_SUCCESS
}

func SetUserRole(ctx context.Context, req *models.SetUserRoleReq) errs.IMErrorCode {
	appkey := ctxs.GetAppKeyFromCtx(ctx)
	// 验证当前用户是否是管理员
	currentUserId := ctxs.GetRequesterIdFromCtx(ctx)
	storage := storages.NewAdminStorage()
	currentRole, err := storage.GetUserRole(currentUserId, appkey)
	if err != nil || currentRole != 1 {
		return errs.IMErrorCode_APP_FORBIDDEN
	}
	if req.Role != 0 && req.Role != 1 {
		return errs.IMErrorCode_APP_REQ_BODY_ILLEGAL
	}
	err = storage.SetUserRole(req.UserId, appkey, req.Role)
	if err != nil {
		return errs.IMErrorCode_APP_DEFAULT
	}
	return errs.IMErrorCode_SUCCESS
}

// ========== 多开账号 ==========

func AddMultiAccount(ctx context.Context, req *models.AddMultiAccountReq) (*models.MultiAccountItem, errs.IMErrorCode) {
	appkey := ctxs.GetAppKeyFromCtx(ctx)
	adminUserId := ctxs.GetRequesterIdFromCtx(ctx)

	// 验证管理员权限
	adminStorage := storages.NewAdminStorage()
	role, err := adminStorage.GetUserRole(adminUserId, appkey)
	if err != nil || role != 1 {
		return nil, errs.IMErrorCode_APP_FORBIDDEN
	}

	// 验证子账号密码
	userStorage := storages.NewUserStorage()
	user, err := userStorage.FindByAccount(appkey, req.Account)
	if err != nil || user == nil {
		return nil, errs.IMErrorCode_APP_USER_NOT_EXIST
	}
	if user.LoginPass != utils.SHA1(req.Password) {
		return nil, errs.IMErrorCode_APP_LOGIN_ERR_PASS
	}

	// 检查是否已添加
	exist, err := adminStorage.GetMultiAccount(adminUserId, user.UserId)
	if err != nil {
		return nil, errs.IMErrorCode_APP_DEFAULT
	}
	if exist != nil {
		return nil, errs.IMErrorCode_APP_USER_EXISTED
	}

	// 获取子账号 token
	token := GenerateToken(appkey, user.UserId)

	// 添加多开账号
	acc := &storageModels.AdminMultiAccount{
		AdminUserId:     adminUserId,
		SubUserId:       user.UserId,
		SubLoginAccount: user.LoginAccount,
		SubToken:        token,
		AppKey:          appkey,
		Status:          0,
	}
	err = adminStorage.AddMultiAccount(acc)
	if err != nil {
		return nil, errs.IMErrorCode_APP_DEFAULT
	}

	return &models.MultiAccountItem{
		Id:              acc.Id,
		SubUserId:       user.UserId,
		SubLoginAccount: user.LoginAccount,
		SubNickname:     user.Nickname,
		SubAvatar:       user.UserPortrait,
		Status:          0,
		CreatedTime:     acc.CreatedTime.Format("2006-01-02 15:04:05"),
	}, errs.IMErrorCode_SUCCESS
}

func GetMultiAccounts(ctx context.Context) (*models.MultiAccountListResp, errs.IMErrorCode) {
	appkey := ctxs.GetAppKeyFromCtx(ctx)
	adminUserId := ctxs.GetRequesterIdFromCtx(ctx)

	adminStorage := storages.NewAdminStorage()
	accs, err := adminStorage.GetMultiAccounts(adminUserId)
	if err != nil {
		return nil, errs.IMErrorCode_APP_DEFAULT
	}

	userStorage := storages.NewUserStorage()
	list := make([]*models.MultiAccountItem, 0, len(accs))
	for _, acc := range accs {
		user, _ := userStorage.FindByUserId(appkey, acc.SubUserId)
		item := &models.MultiAccountItem{
			Id:              acc.Id,
			SubUserId:       acc.SubUserId,
			SubLoginAccount: acc.SubLoginAccount,
			Status:          acc.Status,
			CreatedTime:     acc.CreatedTime.Format("2006-01-02 15:04:05"),
		}
		if user != nil {
			item.SubNickname = user.Nickname
			item.SubAvatar = user.UserPortrait
		}
		if acc.LastActiveTime != nil {
			item.LastActiveTime = acc.LastActiveTime.Format("2006-01-02 15:04:05")
		}
		list = append(list, item)
	}

	return &models.MultiAccountListResp{
		List:  list,
		Total: int64(len(list)),
	}, errs.IMErrorCode_SUCCESS
}

func SwitchMultiAccount(ctx context.Context, req *models.SwitchAccountReq) (*models.SwitchAccountResp, errs.IMErrorCode) {
	appkey := ctxs.GetAppKeyFromCtx(ctx)
	adminUserId := ctxs.GetRequesterIdFromCtx(ctx)

	adminStorage := storages.NewAdminStorage()
	acc, err := adminStorage.GetMultiAccount(adminUserId, req.SubUserId)
	if err != nil || acc == nil {
		return nil, errs.IMErrorCode_APP_USER_NOT_EXIST
	}

	// 获取子账号信息
	userStorage := storages.NewUserStorage()
	user, err := userStorage.FindByUserId(appkey, req.SubUserId)
	if err != nil || user == nil {
		return nil, errs.IMErrorCode_APP_USER_NOT_EXIST
	}

	// 重新生成 token
	token := GenerateToken(appkey, user.UserId)
	adminStorage.UpdateMultiAccountToken(adminUserId, user.UserId, token)

	// 获取 IM token
	sdk := imsdk.GetImSdk(appkey)
	var imToken string
	if sdk != nil {
		resp, code, _, _ := sdk.Register(juggleimsdk.User{
			UserId:       user.UserId,
			Nickname:     user.Nickname,
			UserPortrait: user.UserPortrait,
		})
		if code == juggleimsdk.ApiCode(errs.IMErrorCode_SUCCESS) && resp != nil {
			imToken = resp.Token
		}
	}

	return &models.SwitchAccountResp{
		UserId:        user.UserId,
		NickName:      user.Nickname,
		Avatar:        user.UserPortrait,
		Authorization: token,
		ImToken:       imToken,
	}, errs.IMErrorCode_SUCCESS
}

func RemoveMultiAccount(ctx context.Context, req *models.RemoveAccountReq) errs.IMErrorCode {
	adminUserId := ctxs.GetRequesterIdFromCtx(ctx)
	adminStorage := storages.NewAdminStorage()
	err := adminStorage.DeleteMultiAccount(adminUserId, req.SubUserId)
	if err != nil {
		return errs.IMErrorCode_APP_DEFAULT
	}
	return errs.IMErrorCode_SUCCESS
}

// ========== IP 监控 ==========

func RecordUserIp(ctx context.Context, userId, appkey, ip, deviceInfo string) {
	adminStorage := storages.NewAdminStorage()

	// 解析 IP 地理位置（简单解析，后续可接入 IP 库）
	location := parseIpLocation(ip)

	// 获取上次 IP
	lastLog, _ := adminStorage.GetUserLastIp(userId, appkey)

	// 记录新 IP
	log := &storageModels.UserIpLog{
		UserId:     userId,
		AppKey:     appkey,
		IpAddress:  ip,
		IpLocation: location,
		DeviceInfo: deviceInfo,
		LoginTime:  time.Now(),
	}
	adminStorage.AddUserIpLog(log)

	// 如果 IP 变动，生成通知
	if lastLog != nil && lastLog.IpAddress != ip {
		// 获取所有管理员
		userStorage := storages.NewUserStorage()
		// 简化：通知所有管理员（实际应通知关注该用户的管理员）
		admins, _ := userStorage.FindByRole(appkey, 1)
		for _, admin := range admins {
			ntf := &storageModels.IpChangeNotification{
				AdminUserId:    admin.UserId,
				TargetUserId:   userId,
				TargetNickname: "", // 后续填充
				OldIp:          lastLog.IpAddress,
				NewIp:          ip,
				OldLocation:    lastLog.IpLocation,
				NewLocation:    location,
				ChangeTime:     time.Now(),
				IsRead:         0,
			}
			// 获取目标用户昵称
			user, _ := userStorage.FindByUserId(appkey, userId)
			if user != nil {
				ntf.TargetNickname = user.Nickname
			}
			adminStorage.AddIpChangeNotification(ntf)
		}
	}
}

func parseIpLocation(ip string) string {
	// 简单的 IP 地理位置解析（后续可接入 ip-api.com 或本地 IP 库）
	parsedIp := net.ParseIP(ip)
	if parsedIp == nil {
		return "未知"
	}
	if parsedIp.IsLoopback() || parsedIp.IsPrivate() {
		return "内网/本地"
	}
	return "未知地区"
}

func GetAllUsersIpStatus(ctx context.Context, page, pageSize int, keyword string) (*models.UserIpStatusListResp, errs.IMErrorCode) {
	appkey := ctxs.GetAppKeyFromCtx(ctx)
	adminUserId := ctxs.GetRequesterIdFromCtx(ctx)

	// 验证管理员权限
	adminStorage := storages.NewAdminStorage()
	role, err := adminStorage.GetUserRole(adminUserId, appkey)
	if err != nil || role != 1 {
		return nil, errs.IMErrorCode_APP_FORBIDDEN
	}

	logs, total, err := adminStorage.GetAllUsersLatestIp(appkey, page, pageSize, keyword)
	if err != nil {
		return nil, errs.IMErrorCode_APP_DEFAULT
	}

	userStorage := storages.NewUserStorage()
	list := make([]*models.UserIpStatusItem, 0, len(logs))
	for _, log := range logs {
		user, _ := userStorage.FindByUserId(appkey, log.UserId)
		item := &models.UserIpStatusItem{
			UserId:     log.UserId,
			IpAddress:  log.IpAddress,
			IpLocation: log.IpLocation,
			DeviceInfo: log.DeviceInfo,
			LoginTime:  log.LoginTime.Format("2006-01-02 15:04:05"),
		}
		if user != nil {
			item.Nickname = user.Nickname
			item.Avatar = user.UserPortrait
		}
		// 简单判断在线状态：最后登录时间在 5 分钟内视为在线
		if time.Since(log.LoginTime) < 5*time.Minute {
			item.OnlineStatus = 1
		}
		list = append(list, item)
	}

	return &models.UserIpStatusListResp{
		List:  list,
		Total: total,
	}, errs.IMErrorCode_SUCCESS
}

func GetUserIpHistory(ctx context.Context, userId string, page, pageSize int) (*models.UserIpHistoryResp, errs.IMErrorCode) {
	appkey := ctxs.GetAppKeyFromCtx(ctx)
	adminUserId := ctxs.GetRequesterIdFromCtx(ctx)

	adminStorage := storages.NewAdminStorage()
	role, err := adminStorage.GetUserRole(adminUserId, appkey)
	if err != nil || role != 1 {
		return nil, errs.IMErrorCode_APP_FORBIDDEN
	}

	logs, total, err := adminStorage.GetUserIpHistory(userId, appkey, page, pageSize)
	if err != nil {
		return nil, errs.IMErrorCode_APP_DEFAULT
	}

	list := make([]*models.UserIpHistoryItem, 0, len(logs))
	for _, log := range logs {
		item := &models.UserIpHistoryItem{
			IpAddress:  log.IpAddress,
			IpLocation: log.IpLocation,
			DeviceInfo: log.DeviceInfo,
			LoginTime:  log.LoginTime.Format("2006-01-02 15:04:05"),
		}
		if log.LogoutTime != nil {
			item.LogoutTime = log.LogoutTime.Format("2006-01-02 15:04:05")
		}
		list = append(list, item)
	}

	return &models.UserIpHistoryResp{
		UserId: userId,
		List:   list,
		Total:  total,
	}, errs.IMErrorCode_SUCCESS
}

func GetIpChangeNotifications(ctx context.Context, isRead int, page, pageSize int) (*models.IpChangeNotificationListResp, errs.IMErrorCode) {
	adminUserId := ctxs.GetRequesterIdFromCtx(ctx)
	adminStorage := storages.NewAdminStorage()

	ntfs, total, err := adminStorage.GetIpChangeNotifications(adminUserId, isRead, page, pageSize)
	if err != nil {
		return nil, errs.IMErrorCode_APP_DEFAULT
	}
	unreadCount, _ := adminStorage.GetUnreadIpChangeCount(adminUserId)

	list := make([]*models.IpChangeNotificationItem, 0, len(ntfs))
	for _, ntf := range ntfs {
		list = append(list, &models.IpChangeNotificationItem{
			Id:             ntf.Id,
			TargetUserId:   ntf.TargetUserId,
			TargetNickname: ntf.TargetNickname,
			OldIp:          ntf.OldIp,
			NewIp:          ntf.NewIp,
			OldLocation:    ntf.OldLocation,
			NewLocation:    ntf.NewLocation,
			ChangeTime:     ntf.ChangeTime.Format("2006-01-02 15:04:05"),
			IsRead:         ntf.IsRead,
		})
	}

	return &models.IpChangeNotificationListResp{
		List:        list,
		Total:       total,
		UnreadCount: unreadCount,
	}, errs.IMErrorCode_SUCCESS
}

func MarkIpChangeRead(ctx context.Context, req *models.MarkIpChangeReadReq) errs.IMErrorCode {
	adminUserId := ctxs.GetRequesterIdFromCtx(ctx)
	adminStorage := storages.NewAdminStorage()
	err := adminStorage.MarkIpChangeRead(adminUserId, req.Ids)
	if err != nil {
		return errs.IMErrorCode_APP_DEFAULT
	}
	return errs.IMErrorCode_SUCCESS
}
