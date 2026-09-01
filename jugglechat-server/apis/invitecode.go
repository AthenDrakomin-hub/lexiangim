package apis

import (
	"github.com/gin-gonic/gin"
	"github.com/juggleim/jugglechat-server/commons/errs"
	"github.com/juggleim/jugglechat-server/commons/responses"
	"github.com/juggleim/jugglechat-server/services"
)

func ValidateInviteCode(ctx *gin.Context) {
	appkey := ctx.GetHeader("AppKey")
	if appkey == "" {
		responses.ErrorHttpResp(ctx, errs.IMErrorCode_APP_APPKEY_REQUIRED)
		return
	}
	var req struct {
		Code string `json:"code" binding:"required"`
	}
	if err := ctx.ShouldBindJSON(&req); err != nil {
		responses.ErrorHttpResp(ctx, errs.IMErrorCode_APP_REQ_BODY_ILLEGAL)
		return
	}
	code, inviteCode := services.QryInviteCodeService.ValidateInviteCode(appkey, req.Code)
	if code != errs.IMErrorCode_SUCCESS {
		responses.ErrorHttpResp(ctx, code)
		return
	}
	responses.SuccessHttpResp(ctx, gin.H{
		"code":        inviteCode.Code,
		"description": inviteCode.Description,
		"max_uses":    inviteCode.MaxUses,
		"used_count":  inviteCode.UsedCount,
	})
}

func UseInviteCode(ctx *gin.Context) {
	appkey := ctx.GetHeader("AppKey")
	if appkey == "" {
		responses.ErrorHttpResp(ctx, errs.IMErrorCode_APP_APPKEY_REQUIRED)
		return
	}
	var req struct {
		Code string `json:"code" binding:"required"`
	}
	if err := ctx.ShouldBindJSON(&req); err != nil {
		responses.ErrorHttpResp(ctx, errs.IMErrorCode_APP_REQ_BODY_ILLEGAL)
		return
	}
	code := services.QryInviteCodeService.UseInviteCode(appkey, req.Code)
	if code != errs.IMErrorCode_SUCCESS {
		responses.ErrorHttpResp(ctx, code)
		return
	}
	responses.SuccessHttpResp(ctx, nil)
}

func CreateInviteCode(ctx *gin.Context) {
	appkey := ctx.GetHeader("AppKey")
	if appkey == "" {
		responses.ErrorHttpResp(ctx, errs.IMErrorCode_APP_APPKEY_REQUIRED)
		return
	}
	var req struct {
		Code        string `json:"code" binding:"required"`
		Description string `json:"description"`
		MaxUses     int    `json:"max_uses"`
	}
	if err := ctx.ShouldBindJSON(&req); err != nil {
		responses.ErrorHttpResp(ctx, errs.IMErrorCode_APP_REQ_BODY_ILLEGAL)
		return
	}
	code := services.QryInviteCodeService.CreateInviteCode(appkey, req.Code, req.Description, req.MaxUses)
	if code != errs.IMErrorCode_SUCCESS {
		responses.ErrorHttpResp(ctx, code)
		return
	}
	responses.SuccessHttpResp(ctx, nil)
}

func DeleteInviteCode(ctx *gin.Context) {
	appkey := ctx.GetHeader("AppKey")
	if appkey == "" {
		responses.ErrorHttpResp(ctx, errs.IMErrorCode_APP_APPKEY_REQUIRED)
		return
	}
	var req struct {
		Code string `json:"code" binding:"required"`
	}
	if err := ctx.ShouldBindJSON(&req); err != nil {
		responses.ErrorHttpResp(ctx, errs.IMErrorCode_APP_REQ_BODY_ILLEGAL)
		return
	}
	code := services.QryInviteCodeService.DeleteInviteCode(appkey, req.Code)
	if code != errs.IMErrorCode_SUCCESS {
		responses.ErrorHttpResp(ctx, code)
		return
	}
	responses.SuccessHttpResp(ctx, nil)
}

func ListInviteCodes(ctx *gin.Context) {
	appkey := ctx.GetHeader("AppKey")
	if appkey == "" {
		responses.ErrorHttpResp(ctx, errs.IMErrorCode_APP_APPKEY_REQUIRED)
		return
	}
	code, codes := services.QryInviteCodeService.ListInviteCodes(appkey, 100)
	if code != errs.IMErrorCode_SUCCESS {
		responses.ErrorHttpResp(ctx, code)
		return
	}
	responses.SuccessHttpResp(ctx, codes)
}

func UpdateInviteCodeStatus(ctx *gin.Context) {
	appkey := ctx.GetHeader("AppKey")
	if appkey == "" {
		responses.ErrorHttpResp(ctx, errs.IMErrorCode_APP_APPKEY_REQUIRED)
		return
	}
	var req struct {
		Code   string `json:"code" binding:"required"`
		Status int    `json:"status" binding:"required"`
	}
	if err := ctx.ShouldBindJSON(&req); err != nil {
		responses.ErrorHttpResp(ctx, errs.IMErrorCode_APP_REQ_BODY_ILLEGAL)
		return
	}
	code := services.QryInviteCodeService.UpdateInviteCodeStatus(appkey, req.Code, req.Status)
	if code != errs.IMErrorCode_SUCCESS {
		responses.ErrorHttpResp(ctx, code)
		return
	}
	responses.SuccessHttpResp(ctx, nil)
}
