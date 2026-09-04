package apis

import (
	"strconv"

	"github.com/gin-gonic/gin"
	"github.com/juggleim/imserver-console/apis/models"
	"github.com/juggleim/imserver-console/commons/ctxs"
	"github.com/juggleim/imserver-console/commons/errs"
	"github.com/juggleim/imserver-console/commons/tools"
	"github.com/juggleim/imserver-console/services"
)

func QryUsers(ctx *gin.Context) {
	appkey := ctx.GetString(string(ctxs.CtxKey_AppKey))
	if appkey != "" {
		// 应用管理员：强制使用绑定的 app_key，忽略请求参数
	} else {
		appkey = ctx.Query("app_key")
	}
	if appkey == "" {
		ctxs.FailHttpResp(ctx, errs.AdminErrorCode_ParamError)
		return
	}
	userId := ctx.Query("user_id")
	name := ctx.Query("name")
	offset := ctx.Query("offset")
	var count int64 = 20
	countStr := ctx.Query("count")
	if countStr != "" {
		if val, err := tools.String2Int64(countStr); err == nil {
			count = val
		}
	}
	isPositiveOrder := false
	if orderStr := ctx.Query("order"); orderStr != "" {
		if order, err := strconv.Atoi(orderStr); err == nil && order > 0 {
			isPositiveOrder = true
		}
	}
	code, users := services.QryUsers(ctxs.ToCtx(ctx), appkey, userId, name, offset, count, isPositiveOrder)
	if code != errs.AdminErrorCode_Success {
		ctxs.FailHttpResp(ctx, code)
		return
	}
	ctxs.SuccessHttpResp(ctx, users)
}

func QryBots(ctx *gin.Context) {
	appkey := ctx.GetString(string(ctxs.CtxKey_AppKey))
	if appkey != "" {
		// 应用管理员：强制使用绑定的 app_key，忽略请求参数
	} else {
		appkey = ctx.Query("app_key")
	}
	if appkey == "" {
		ctxs.FailHttpResp(ctx, errs.AdminErrorCode_ParamError)
		return
	}
	userId := ctx.Query("user_id")
	name := ctx.Query("name")
	offset := ctx.Query("offset")
	var count int64 = 20
	countStr := ctx.Query("count")
	if countStr != "" {
		if val, err := tools.String2Int64(countStr); err == nil {
			count = val
		}
	}
	isPositiveOrder := false
	if orderStr := ctx.Query("order"); orderStr != "" {
		if order, err := strconv.Atoi(orderStr); err == nil && order > 0 {
			isPositiveOrder = true
		}
	}
	code, bots := services.QryBots(ctxs.ToCtx(ctx), appkey, userId, name, offset, count, isPositiveOrder)
	if code != errs.AdminErrorCode_Success {
		ctxs.FailHttpResp(ctx, code)
		return
	}
	ctxs.SuccessHttpResp(ctx, bots)
}

func BanUsers(ctx *gin.Context) {
	var req models.BanUsersReq
	if err := ctx.ShouldBindJSON(&req); err != nil || req.AppKey == "" {
		ctxs.FailHttpResp(ctx, errs.AdminErrorCode_ParamError)
		return
	}
	// 应用管理员强制使用绑定的 app_key
	appkey := ctx.GetString(string(ctxs.CtxKey_AppKey))
	if appkey == "" {
		appkey = req.AppKey
	} else if appkey != req.AppKey {
		ctxs.FailHttpResp(ctx, errs.AdminErrorCode_NotPermission)
		return
	}
	code := services.BanUsers(ctxs.ToCtx(ctx), &req)
	if code != errs.AdminErrorCode_Success {
		ctxs.FailHttpResp(ctx, code)
		return
	}
	ctxs.SuccessHttpResp(ctx, nil)
}

func UnBanUsers(ctx *gin.Context) {
	var req models.BanUsersReq
	if err := ctx.ShouldBindJSON(&req); err != nil || req.AppKey == "" {
		ctxs.FailHttpResp(ctx, errs.AdminErrorCode_ParamError)
		return
	}
	// 应用管理员强制使用绑定的 app_key
	appkey := ctx.GetString(string(ctxs.CtxKey_AppKey))
	if appkey == "" {
		appkey = req.AppKey
	} else if appkey != req.AppKey {
		ctxs.FailHttpResp(ctx, errs.AdminErrorCode_NotPermission)
		return
	}
	code := services.UnBanUsers(ctxs.ToCtx(ctx), &req)
	if code != errs.AdminErrorCode_Success {
		ctxs.FailHttpResp(ctx, code)
		return
	}
	ctxs.SuccessHttpResp(ctx, nil)
}

type UpdateUserProfileReq struct {
	AppKey      string `json:"app_key"`
	UserId      string `json:"user_id"`
	Nickname    string `json:"nickname"`
	VipLevel    int    `json:"vip_level"`
}

func UpdateUserProfile(ctx *gin.Context) {
	var req UpdateUserProfileReq
	if err := ctx.ShouldBindJSON(&req); err != nil || req.AppKey == "" || req.UserId == "" {
		ctxs.FailHttpResp(ctx, errs.AdminErrorCode_ParamError)
		return
	}
	// 应用管理员强制使用绑定的 app_key
	appkey := ctx.GetString(string(ctxs.CtxKey_AppKey))
	if appkey == "" {
		appkey = req.AppKey
	} else if appkey != req.AppKey {
		ctxs.FailHttpResp(ctx, errs.AdminErrorCode_NotPermission)
		return
	}
	code := services.UpdateUserProfile(appkey, req.UserId, req.Nickname, req.VipLevel)
	if code != errs.AdminErrorCode_Success {
		ctxs.FailHttpResp(ctx, code)
		return
	}
	ctxs.SuccessHttpResp(ctx, nil)
}

type DeleteUserReq struct {
	AppKey      string `json:"app_key"`
	UserId      string `json:"user_id"`
}

func DeleteUser(ctx *gin.Context) {
	var req DeleteUserReq
	if err := ctx.ShouldBindJSON(&req); err != nil || req.AppKey == "" || req.UserId == "" {
		ctxs.FailHttpResp(ctx, errs.AdminErrorCode_ParamError)
		return
	}
	// 应用管理员强制使用绑定的 app_key
	appkey := ctx.GetString(string(ctxs.CtxKey_AppKey))
	if appkey == "" {
		appkey = req.AppKey
	} else if appkey != req.AppKey {
		ctxs.FailHttpResp(ctx, errs.AdminErrorCode_NotPermission)
		return
	}
	code := services.DeleteUser(appkey, req.UserId)
	if code != errs.AdminErrorCode_Success {
		ctxs.FailHttpResp(ctx, code)
		return
	}
	ctxs.SuccessHttpResp(ctx, nil)
}

type ResetUserPasswordReq struct {
	AppKey      string `json:"app_key"`
	UserId      string `json:"user_id"`
	NewPassword string `json:"new_password"`
}

func ResetUserPassword(ctx *gin.Context) {
	var req ResetUserPasswordReq
	if err := ctx.ShouldBindJSON(&req); err != nil || req.AppKey == "" || req.UserId == "" || req.NewPassword == "" {
		ctxs.FailHttpResp(ctx, errs.AdminErrorCode_ParamError)
		return
	}
	// 应用管理员强制使用绑定的 app_key
	appkey := ctx.GetString(string(ctxs.CtxKey_AppKey))
	if appkey == "" {
		appkey = req.AppKey
	} else if appkey != req.AppKey {
		ctxs.FailHttpResp(ctx, errs.AdminErrorCode_NotPermission)
		return
	}
	code := services.ResetUserPassword(appkey, req.UserId, req.NewPassword)
	if code != errs.AdminErrorCode_Success {
		ctxs.FailHttpResp(ctx, code)
		return
	}
	ctxs.SuccessHttpResp(ctx, nil)
}
