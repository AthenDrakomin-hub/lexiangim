package apis

import (
	"strconv"

	"github.com/juggleim/jugglechat-server/apis/models"
	"github.com/juggleim/jugglechat-server/commons/ctxs"
	"github.com/juggleim/jugglechat-server/commons/errs"
	"github.com/juggleim/jugglechat-server/commons/responses"
	"github.com/juggleim/jugglechat-server/services"
	"github.com/gin-gonic/gin"
)

// ========== 角色管理 ==========

func GetUserRole(ctx *gin.Context) {
	userId := ctx.Query("user_id")
	if userId == "" {
		userId = ctxs.GetRequesterIdFromCtx(ctxs.ToCtx(ctx))
	}
	role, code := services.GetUserRole(ctxs.ToCtx(ctx), userId)
	if code != errs.IMErrorCode_SUCCESS {
		responses.ErrorHttpResp(ctx, code)
		return
	}
	responses.SuccessHttpResp(ctx, &models.GetUserRoleResp{
		UserId: userId,
		Role:   role,
	})
}

func SetUserRole(ctx *gin.Context) {
	req := &models.SetUserRoleReq{}
	if err := ctx.BindJSON(req); err != nil || req.UserId == "" {
		responses.ErrorHttpResp(ctx, errs.IMErrorCode_APP_REQ_BODY_ILLEGAL)
		return
	}
	code := services.SetUserRole(ctxs.ToCtx(ctx), req)
	if code != errs.IMErrorCode_SUCCESS {
		responses.ErrorHttpResp(ctx, code)
		return
	}
	responses.SuccessHttpResp(ctx, nil)
}

// ========== 多开账号 ==========

func AddMultiAccount(ctx *gin.Context) {
	req := &models.AddMultiAccountReq{}
	if err := ctx.BindJSON(req); err != nil || req.Account == "" || req.Password == "" {
		responses.ErrorHttpResp(ctx, errs.IMErrorCode_APP_REQ_BODY_ILLEGAL)
		return
	}
	item, code := services.AddMultiAccount(ctxs.ToCtx(ctx), req)
	if code != errs.IMErrorCode_SUCCESS {
		responses.ErrorHttpResp(ctx, code)
		return
	}
	responses.SuccessHttpResp(ctx, item)
}

func GetMultiAccounts(ctx *gin.Context) {
	resp, code := services.GetMultiAccounts(ctxs.ToCtx(ctx))
	if code != errs.IMErrorCode_SUCCESS {
		responses.ErrorHttpResp(ctx, code)
		return
	}
	responses.SuccessHttpResp(ctx, resp)
}

func SwitchMultiAccount(ctx *gin.Context) {
	req := &models.SwitchAccountReq{}
	if err := ctx.BindJSON(req); err != nil || req.SubUserId == "" {
		responses.ErrorHttpResp(ctx, errs.IMErrorCode_APP_REQ_BODY_ILLEGAL)
		return
	}
	resp, code := services.SwitchMultiAccount(ctxs.ToCtx(ctx), req)
	if code != errs.IMErrorCode_SUCCESS {
		responses.ErrorHttpResp(ctx, code)
		return
	}
	responses.SuccessHttpResp(ctx, resp)
}

func RemoveMultiAccount(ctx *gin.Context) {
	req := &models.RemoveAccountReq{}
	if err := ctx.BindJSON(req); err != nil || req.SubUserId == "" {
		responses.ErrorHttpResp(ctx, errs.IMErrorCode_APP_REQ_BODY_ILLEGAL)
		return
	}
	code := services.RemoveMultiAccount(ctxs.ToCtx(ctx), req)
	if code != errs.IMErrorCode_SUCCESS {
		responses.ErrorHttpResp(ctx, code)
		return
	}
	responses.SuccessHttpResp(ctx, nil)
}

// ========== IP 监控 ==========

func GetAllUsersIpStatus(ctx *gin.Context) {
	page, _ := strconv.Atoi(ctx.DefaultQuery("page", "1"))
	pageSize, _ := strconv.Atoi(ctx.DefaultQuery("page_size", "20"))
	keyword := ctx.Query("keyword")
	if page < 1 {
		page = 1
	}
	if pageSize < 1 || pageSize > 100 {
		pageSize = 20
	}
	resp, code := services.GetAllUsersIpStatus(ctxs.ToCtx(ctx), page, pageSize, keyword)
	if code != errs.IMErrorCode_SUCCESS {
		responses.ErrorHttpResp(ctx, code)
		return
	}
	responses.SuccessHttpResp(ctx, resp)
}

func GetUserIpHistory(ctx *gin.Context) {
	userId := ctx.Query("user_id")
	if userId == "" {
		responses.ErrorHttpResp(ctx, errs.IMErrorCode_APP_REQ_BODY_ILLEGAL)
		return
	}
	page, _ := strconv.Atoi(ctx.DefaultQuery("page", "1"))
	pageSize, _ := strconv.Atoi(ctx.DefaultQuery("page_size", "20"))
	resp, code := services.GetUserIpHistory(ctxs.ToCtx(ctx), userId, page, pageSize)
	if code != errs.IMErrorCode_SUCCESS {
		responses.ErrorHttpResp(ctx, code)
		return
	}
	responses.SuccessHttpResp(ctx, resp)
}

func GetIpChangeNotifications(ctx *gin.Context) {
	isRead, _ := strconv.Atoi(ctx.DefaultQuery("is_read", "-1"))
	page, _ := strconv.Atoi(ctx.DefaultQuery("page", "1"))
	pageSize, _ := strconv.Atoi(ctx.DefaultQuery("page_size", "20"))
	resp, code := services.GetIpChangeNotifications(ctxs.ToCtx(ctx), isRead, page, pageSize)
	if code != errs.IMErrorCode_SUCCESS {
		responses.ErrorHttpResp(ctx, code)
		return
	}
	responses.SuccessHttpResp(ctx, resp)
}

func MarkIpChangeRead(ctx *gin.Context) {
	req := &models.MarkIpChangeReadReq{}
	if err := ctx.BindJSON(req); err != nil {
		responses.ErrorHttpResp(ctx, errs.IMErrorCode_APP_REQ_BODY_ILLEGAL)
		return
	}
	code := services.MarkIpChangeRead(ctxs.ToCtx(ctx), req)
	if code != errs.IMErrorCode_SUCCESS {
		responses.ErrorHttpResp(ctx, code)
		return
	}
	responses.SuccessHttpResp(ctx, nil)
}
