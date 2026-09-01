package dbs

import (
	"errors"
	"time"

	"gorm.io/gorm"
	"github.com/juggleim/jugglechat-server/commons/dbcommons"
	"github.com/juggleim/jugglechat-server/storages/models"
)

type InviteCodeDao struct {
	ID          int64     `gorm:"primary_key"`
	AppKey      string    `gorm:"app_key"`
	Code        string    `gorm:"code"`
	Description string    `gorm:"description"`
	MaxUses     int       `gorm:"max_uses"`
	UsedCount   int       `gorm:"used_count"`
	ExpiresAt   int64     `gorm:"expires_at"`
	Status      int       `gorm:"status"`
	CreatedTime time.Time `gorm:"created_time"`
	UpdatedTime time.Time `gorm:"updated_time"`
}

func (d InviteCodeDao) TableName() string {
	return "invite_codes"
}

func (d InviteCodeDao) Create(item models.InviteCode) error {
	now := time.Now()
	return dbcommons.GetDb().Exec(
		"INSERT INTO invite_codes (app_key, code, description, max_uses, used_count, expires_at, status, created_time, updated_time) VALUES (?,?,?,?,?,?,?,?,?)",
		item.AppKey, item.Code, item.Description, item.MaxUses, item.UsedCount, item.ExpiresAt, item.Status, now, now,
	).Error
}

func (d InviteCodeDao) Delete(appkey, code string) error {
	return dbcommons.GetDb().Where("app_key=? and code=?", appkey, code).Delete(&InviteCodeDao{}).Error
}

func (d InviteCodeDao) Validate(appkey, code string) (*models.InviteCode, error) {
	var item InviteCodeDao
	err := dbcommons.GetDb().Where("app_key=? and code=? and status=1", appkey, code).Take(&item).Error
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, nil
		}
		return nil, err
	}
	return &models.InviteCode{
		ID:          item.ID,
		AppKey:      item.AppKey,
		Code:        item.Code,
		Description: item.Description,
		MaxUses:     item.MaxUses,
		UsedCount:   item.UsedCount,
		ExpiresAt:   item.ExpiresAt,
		Status:      item.Status,
		CreatedTime: item.CreatedTime.UnixMilli(),
		UpdatedTime: item.UpdatedTime.UnixMilli(),
	}, nil
}

func (d InviteCodeDao) IncrementUsed(appkey, code string) error {
	return dbcommons.GetDb().Model(&InviteCodeDao{}).
		Where("app_key=? and code=?", appkey, code).
		UpdateColumn("used_count", gorm.Expr("used_count + 1")).Error
}

func (d InviteCodeDao) List(appkey string, limit int64) ([]*models.InviteCode, error) {
	var items []*InviteCodeDao
	err := dbcommons.GetDb().Where("app_key=?", appkey).Order("id desc").Limit(int(limit)).Find(&items).Error
	if err != nil {
		return nil, err
	}
	ret := make([]*models.InviteCode, 0, len(items))
	for _, item := range items {
		ret = append(ret, &models.InviteCode{
			ID:          item.ID,
			AppKey:      item.AppKey,
			Code:        item.Code,
			Description: item.Description,
			MaxUses:     item.MaxUses,
			UsedCount:   item.UsedCount,
			ExpiresAt:   item.ExpiresAt,
			Status:      item.Status,
			CreatedTime: item.CreatedTime.UnixMilli(),
			UpdatedTime: item.UpdatedTime.UnixMilli(),
		})
	}
	return ret, nil
}

func (d InviteCodeDao) UpdateStatus(appkey, code string, status int) error {
	return dbcommons.GetDb().Model(&InviteCodeDao{}).
		Where("app_key=? and code=?", appkey, code).
		UpdateColumn("status", status).Error
}
