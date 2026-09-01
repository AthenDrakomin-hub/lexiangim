package services

import (
	"time"

	"github.com/juggleim/jugglechat-server/commons/errs"
	"github.com/juggleim/jugglechat-server/storages"
	"github.com/juggleim/jugglechat-server/storages/models"
)

type InviteCodeService struct{}

var QryInviteCodeService = &InviteCodeService{}

func (s *InviteCodeService) CreateInviteCode(appkey, code, description string, maxUses int) errs.IMErrorCode {
	inviteCode := models.InviteCode{
		AppKey:      appkey,
		Code:        code,
		Description: description,
		MaxUses:     maxUses,
		UsedCount:   0,
		ExpiresAt:   0,
		Status:      1,
		CreatedTime: time.Now().UnixMilli(),
		UpdatedTime: time.Now().UnixMilli(),
	}
	storage := storages.NewInviteCodeStorage()
	if err := storage.Create(inviteCode); err != nil {
		return errs.IMErrorCode_DB_OperationFailed
	}
	return errs.IMErrorCode_SUCCESS
}

func (s *InviteCodeService) DeleteInviteCode(appkey, code string) errs.IMErrorCode {
	storage := storages.NewInviteCodeStorage()
	if err := storage.Delete(appkey, code); err != nil {
		return errs.IMErrorCode_DB_OperationFailed
	}
	return errs.IMErrorCode_SUCCESS
}

func (s *InviteCodeService) ValidateInviteCode(appkey, code string) (errs.IMErrorCode, *models.InviteCode) {
	storage := storages.NewInviteCodeStorage()
	inviteCode, err := storage.Validate(appkey, code)
	if err != nil {
		return errs.IMErrorCode_DB_OperationFailed, nil
	}
	if inviteCode == nil {
		return errs.IMErrorCode_INVITE_CODE_INVALID, nil
	}
	if inviteCode.ExpiresAt > 0 && inviteCode.ExpiresAt < time.Now().UnixMilli() {
		return errs.IMErrorCode_INVITE_CODE_EXPIRED, nil
	}
	if inviteCode.MaxUses > 0 && inviteCode.UsedCount >= inviteCode.MaxUses {
		return errs.IMErrorCode_INVITE_CODE_USED_UP, nil
	}
	return errs.IMErrorCode_SUCCESS, inviteCode
}

func (s *InviteCodeService) UseInviteCode(appkey, code string) errs.IMErrorCode {
	storage := storages.NewInviteCodeStorage()
	if err := storage.IncrementUsed(appkey, code); err != nil {
		return errs.IMErrorCode_DB_OperationFailed
	}
	return errs.IMErrorCode_SUCCESS
}

func (s *InviteCodeService) ListInviteCodes(appkey string, limit int64) (errs.IMErrorCode, []*models.InviteCode) {
	storage := storages.NewInviteCodeStorage()
	codes, err := storage.List(appkey, limit)
	if err != nil {
		return errs.IMErrorCode_DB_OperationFailed, nil
	}
	return errs.IMErrorCode_SUCCESS, codes
}

func (s *InviteCodeService) UpdateInviteCodeStatus(appkey, code string, status int) errs.IMErrorCode {
	storage := storages.NewInviteCodeStorage()
	if err := storage.UpdateStatus(appkey, code, status); err != nil {
		return errs.IMErrorCode_DB_OperationFailed
	}
	return errs.IMErrorCode_SUCCESS
}

