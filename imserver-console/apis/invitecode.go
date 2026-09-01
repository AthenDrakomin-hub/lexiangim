package apis

import (
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/juggleim/imserver-console/commons/ctxs"
	"github.com/juggleim/imserver-console/commons/errs"
	"github.com/juggleim/imserver-console/commons/tools"
)

func CreateInviteCode(ctx *gin.Context) {
	appkey := ctx.GetHeader("X-Appid")
	if appkey == "" {
		ctx.JSON(http.StatusBadRequest, &ctxs.ApiErrorMsg{
			Code: errs.AdminErrorCode_ParamError,
			Msg:  "param illegal",
		})
		return
	}
	var req struct {
		Code        string `json:"code" binding:"required"`
		Description string `json:"description"`
		MaxUses     int    `json:"max_uses"`
	}
	if err := ctx.ShouldBindJSON(&req); err != nil {
		ctx.JSON(http.StatusBadRequest, &ctxs.ApiErrorMsg{
			Code: errs.AdminErrorCode_ParamError,
			Msg:  "param illegal",
		})
		return
	}
	body := `{"code":"` + req.Code + `","description":"` + req.Description + `","max_uses":` + string(rune(req.MaxUses)) + `}`
	result, code, err := tools.HttpDo("POST", "http://127.0.0.1:8070/jim/invitecodes/create", map[string]string{
		"AppKey": appkey,
	}, body)
	if err != nil {
		ctxs.FailHttpResp(ctx, errs.AdminErrorCode_ServerErr)
		return
	}
	if code != 200 {
		ctxs.FailHttpResp(ctx, errs.AdminErrorCode_ServerErr)
		return
	}
	ctxs.SuccessHttpResp(ctx, result)
}

func ListInviteCodes(ctx *gin.Context) {
	appkey := ctx.GetHeader("X-Appid")
	if appkey == "" {
		ctx.JSON(http.StatusBadRequest, &ctxs.ApiErrorMsg{
			Code: errs.AdminErrorCode_ParamError,
			Msg:  "param illegal",
		})
		return
	}
	result, code, err := tools.HttpDo("GET", "http://127.0.0.1:8070/jim/invitecodes/list?app_key="+appkey, map[string]string{
		"AppKey": appkey,
	}, "")
	if err != nil {
		ctxs.FailHttpResp(ctx, errs.AdminErrorCode_ServerErr)
		return
	}
	if code != 200 {
		ctxs.FailHttpResp(ctx, errs.AdminErrorCode_ServerErr)
		return
	}
	ctxs.SuccessHttpResp(ctx, result)
}

func DeleteInviteCode(ctx *gin.Context) {
	appkey := ctx.GetHeader("X-Appid")
	if appkey == "" {
		ctx.JSON(http.StatusBadRequest, &ctxs.ApiErrorMsg{
			Code: errs.AdminErrorCode_ParamError,
			Msg:  "param illegal",
		})
		return
	}
	var req struct {
		Code string `json:"code" binding:"required"`
	}
	if err := ctx.ShouldBindJSON(&req); err != nil {
		ctx.JSON(http.StatusBadRequest, &ctxs.ApiErrorMsg{
			Code: errs.AdminErrorCode_ParamError,
			Msg:  "param illegal",
		})
		return
	}
	body := `{"code":"` + req.Code + `"}`
	result, code, err := tools.HttpDo("POST", "http://127.0.0.1:8070/jim/invitecodes/delete", map[string]string{
		"AppKey": appkey,
	}, body)
	if err != nil {
		ctxs.FailHttpResp(ctx, errs.AdminErrorCode_ServerErr)
		return
	}
	if code != 200 {
		ctxs.FailHttpResp(ctx, errs.AdminErrorCode_ServerErr)
		return
	}
	ctxs.SuccessHttpResp(ctx, result)
}

func UpdateInviteCodeStatus(ctx *gin.Context) {
	appkey := ctx.GetHeader("X-Appid")
	if appkey == "" {
		ctx.JSON(http.StatusBadRequest, &ctxs.ApiErrorMsg{
			Code: errs.AdminErrorCode_ParamError,
			Msg:  "param illegal",
		})
		return
	}
	var req struct {
		Code   string `json:"code" binding:"required"`
		Status int    `json:"status" binding:"required"`
	}
	if err := ctx.ShouldBindJSON(&req); err != nil {
		ctx.JSON(http.StatusBadRequest, &ctxs.ApiErrorMsg{
			Code: errs.AdminErrorCode_ParamError,
			Msg:  "param illegal",
		})
		return
	}
	body := `{"code":"` + req.Code + `","status":` + string(rune(req.Status)) + `}`
	result, code, err := tools.HttpDo("POST", "http://127.0.0.1:8070/jim/invitecodes/status", map[string]string{
		"AppKey": appkey,
	}, body)
	if err != nil {
		ctxs.FailHttpResp(ctx, errs.AdminErrorCode_ServerErr)
		return
	}
	if code != 200 {
		ctxs.FailHttpResp(ctx, errs.AdminErrorCode_ServerErr)
		return
	}
	ctxs.SuccessHttpResp(ctx, result)
}
