package dbs

import (
	"errors"
	"time"

	"gorm.io/gorm"
	"github.com/juggleim/jugglechat-server/commons/dbcommons"
	"github.com/juggleim/jugglechat-server/storages/models"
)

type AdminDao struct{}

// 用户角色
func (dao AdminDao) GetUserRole(userId, appKey string) (int, error) {
	var user UserDao
	err := dbcommons.GetDb().Select("role").Where("app_key=? and user_id=?", appKey, userId).Take(&user).Error
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return 0, nil
		}
		return 0, err
	}
	return user.Role, nil
}

func (dao AdminDao) SetUserRole(userId, appKey string, role int) error {
	return dbcommons.GetDb().Model(&UserDao{}).Where("app_key=? and user_id=?", appKey, userId).Update("role", role).Error
}

// IP登录记录
func (dao AdminDao) AddUserIpLog(log *models.UserIpLog) error {
	if log.CreatedTime.IsZero() {
		log.CreatedTime = time.Now()
	}
	return dbcommons.GetDb().Create(log).Error
}

func (dao AdminDao) GetUserLastIp(userId, appKey string) (*models.UserIpLog, error) {
	var log models.UserIpLog
	err := dbcommons.GetDb().Where("user_id=? and app_key=?", userId, appKey).Order("login_time desc").Take(&log).Error
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, nil
		}
		return nil, err
	}
	return &log, nil
}

func (dao AdminDao) GetUserIpHistory(userId, appKey string, page, pageSize int) ([]*models.UserIpLog, int64, error) {
	var logs []*models.UserIpLog
	var total int64
	db := dbcommons.GetDb().Model(&models.UserIpLog{}).Where("user_id=? and app_key=?", userId, appKey)
	db.Count(&total)
	offset := (page - 1) * pageSize
	err := db.Order("login_time desc").Offset(offset).Limit(pageSize).Find(&logs).Error
	return logs, total, err
}

func (dao AdminDao) GetAllUsersLatestIp(appKey string, page, pageSize int, keyword string) ([]*models.UserIpLog, int64, error) {
	// 获取每个用户最新的IP记录
	var logs []*models.UserIpLog
	var total int64

	baseQuery := dbcommons.GetDb().Table("user_ip_logs").
		Select("user_ip_logs.*").
		Joins("INNER JOIN (SELECT user_id, MAX(login_time) as max_time FROM user_ip_logs WHERE app_key=? GROUP BY user_id) latest ON user_ip_logs.user_id = latest.user_id AND user_ip_logs.login_time = latest.max_time", appKey).
		Where("user_ip_logs.app_key=?", appKey)

	if keyword != "" {
		baseQuery = baseQuery.Where("(user_ip_logs.user_id LIKE ? OR user_ip_logs.ip_address LIKE ? OR user_ip_logs.ip_location LIKE ?)",
			"%"+keyword+"%", "%"+keyword+"%", "%"+keyword+"%")
	}

	// Count 时重置 Select，避免 user_ip_logs.* 影响 count(*) 查询
	baseQuery.Session(&gorm.Session{}).Select("count(*)").Count(&total)
	offset := (page - 1) * pageSize
	err := baseQuery.Order("user_ip_logs.login_time desc").Offset(offset).Limit(pageSize).Find(&logs).Error
	return logs, total, err
}

// 多开账号
func (dao AdminDao) AddMultiAccount(acc *models.AdminMultiAccount) error {
	if acc.CreatedTime.IsZero() {
		acc.CreatedTime = time.Now()
	}
	if acc.UpdatedTime.IsZero() {
		acc.UpdatedTime = time.Now()
	}
	return dbcommons.GetDb().Create(acc).Error
}

func (dao AdminDao) GetMultiAccounts(adminUserId string) ([]*models.AdminMultiAccount, error) {
	var accs []*models.AdminMultiAccount
	err := dbcommons.GetDb().Where("admin_user_id=? and status=0", adminUserId).Order("created_time desc").Find(&accs).Error
	return accs, err
}

func (dao AdminDao) GetMultiAccount(adminUserId, subUserId string) (*models.AdminMultiAccount, error) {
	var acc models.AdminMultiAccount
	err := dbcommons.GetDb().Where("admin_user_id=? and sub_user_id=?", adminUserId, subUserId).Take(&acc).Error
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, nil
		}
		return nil, err
	}
	return &acc, nil
}

func (dao AdminDao) UpdateMultiAccountToken(adminUserId, subUserId, token string) error {
	return dbcommons.GetDb().Model(&models.AdminMultiAccount{}).
		Where("admin_user_id=? and sub_user_id=?", adminUserId, subUserId).
		Updates(map[string]interface{}{
			"sub_token":       token,
			"last_active_time": time.Now(),
			"updated_time":     time.Now(),
		}).Error
}

func (dao AdminDao) DeleteMultiAccount(adminUserId, subUserId string) error {
	return dbcommons.GetDb().Where("admin_user_id=? and sub_user_id=?", adminUserId, subUserId).Delete(&models.AdminMultiAccount{}).Error
}

// IP变动通知
func (dao AdminDao) AddIpChangeNotification(ntf *models.IpChangeNotification) error {
	if ntf.CreatedTime.IsZero() {
		ntf.CreatedTime = time.Now()
	}
	return dbcommons.GetDb().Create(ntf).Error
}

func (dao AdminDao) GetIpChangeNotifications(adminUserId string, isRead int, page, pageSize int) ([]*models.IpChangeNotification, int64, error) {
	var ntfs []*models.IpChangeNotification
	var total int64
	db := dbcommons.GetDb().Model(&models.IpChangeNotification{}).Where("admin_user_id=?", adminUserId)
	if isRead >= 0 {
		db = db.Where("is_read=?", isRead)
	}
	db.Count(&total)
	offset := (page - 1) * pageSize
	err := db.Order("change_time desc").Offset(offset).Limit(pageSize).Find(&ntfs).Error
	return ntfs, total, err
}

func (dao AdminDao) MarkIpChangeRead(adminUserId string, ids []int64) error {
	if len(ids) == 0 {
		return dbcommons.GetDb().Model(&models.IpChangeNotification{}).
			Where("admin_user_id=? and is_read=0", adminUserId).
			Update("is_read", 1).Error
	}
	return dbcommons.GetDb().Model(&models.IpChangeNotification{}).
		Where("admin_user_id=? and id in (?)", adminUserId, ids).
		Update("is_read", 1).Error
}

func (dao AdminDao) GetUnreadIpChangeCount(adminUserId string) (int64, error) {
	var count int64
	err := dbcommons.GetDb().Model(&models.IpChangeNotification{}).
		Where("admin_user_id=? and is_read=0", adminUserId).
		Count(&count).Error
	return count, err
}
