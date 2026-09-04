package apis

import (
	"strconv"

	"github.com/gin-gonic/gin"
	"github.com/juggleim/jugglechat-server/commons/ctxs"
	"github.com/juggleim/jugglechat-server/commons/errs"
	"github.com/juggleim/jugglechat-server/commons/responses"
	"github.com/juggleim/jugglechat-server/services"
)

// AiKeyAddRequest 新增 API Key 请求
type AiKeyAddRequest struct {
	Name       string `json:"name"`
	ApiKey     string `json:"api_key"`
	ApiUrl     string `json:"api_url"`
	Model      string `json:"model"`
	BindType   int    `json:"bind_type"`   // 0=全局共享, 1=绑定VIP用户
	BindUserId string `json:"bind_user_id"` // bind_type=1 时必填
	DailyLimit int    `json:"daily_limit"` // 每日调用上限，0=不限制
}

// AiKeyUpdateRequest 更新 API Key 请求
type AiKeyUpdateRequest struct {
	Id         int64  `json:"id"`
	Name       string `json:"name"`
	ApiKey     string `json:"api_key"`
	ApiUrl     string `json:"api_url"`
	Model      string `json:"model"`
	BindType   int    `json:"bind_type"`
	BindUserId string `json:"bind_user_id"`
	Status     int    `json:"status"` // 0=启用, 1=禁用
	DailyLimit int    `json:"daily_limit"`
}

// AiKeyListResponse API Key 列表响应
type AiKeyListResponse struct {
	List []*AiKeyItem `json:"list"`
}

// AiKeyItem API Key 项（隐藏完整 key）
type AiKeyItem struct {
	Id           int64  `json:"id"`
	Name         string `json:"name"`
	ApiKeyMasked string `json:"api_key_masked"`
	ApiUrl       string `json:"api_url"`
	Model        string `json:"model"`
	BindType     int    `json:"bind_type"`
	BindUserId   string `json:"bind_user_id"`
	Status       int    `json:"status"`
	DailyLimit   int    `json:"daily_limit"`
	UsedToday    int    `json:"used_today"`
	TotalUsed    int64  `json:"total_used"`
	CreatedTime  string `json:"created_time"`
}

// AddAiApiKey 新增 API Key
func AddAiApiKey(ctx *gin.Context) {
	req := &AiKeyAddRequest{}
	if err := ctx.BindJSON(req); err != nil || req.ApiKey == "" {
		responses.ErrorHttpResp(ctx, errs.IMErrorCode_APP_REQ_BODY_ILLEGAL)
		return
	}
	appKey := ctx.GetString(string(ctxs.CtxKey_AppKey))
	if req.BindType == 1 && req.BindUserId == "" {
		responses.ErrorHttpResp(ctx, errs.IMErrorCode_APP_REQ_BODY_ILLEGAL)
		return
	}
	id, code := services.AddAiApiKey(appKey, req.Name, req.ApiKey, req.ApiUrl, req.Model, req.BindType, req.BindUserId, req.DailyLimit)
	if code != errs.IMErrorCode_SUCCESS {
		responses.ErrorHttpResp(ctx, code)
		return
	}
	responses.SuccessHttpResp(ctx, gin.H{"id": id})
}

// UpdateAiApiKey 更新 API Key
func UpdateAiApiKey(ctx *gin.Context) {
	req := &AiKeyUpdateRequest{}
	if err := ctx.BindJSON(req); err != nil || req.Id == 0 {
		responses.ErrorHttpResp(ctx, errs.IMErrorCode_APP_REQ_BODY_ILLEGAL)
		return
	}
	code := services.UpdateAiApiKey(req.Id, req.Name, req.ApiKey, req.ApiUrl, req.Model, req.BindType, req.BindUserId, req.Status, req.DailyLimit)
	if code != errs.IMErrorCode_SUCCESS {
		responses.ErrorHttpResp(ctx, code)
		return
	}
	responses.SuccessHttpResp(ctx, nil)
}

// DeleteAiApiKey 删除 API Key
func DeleteAiApiKey(ctx *gin.Context) {
	idStr := ctx.Query("id")
	id, err := strconv.ParseInt(idStr, 10, 64)
	if err != nil || id == 0 {
		responses.ErrorHttpResp(ctx, errs.IMErrorCode_APP_REQ_BODY_ILLEGAL)
		return
	}
	code := services.DeleteAiApiKey(id)
	if code != errs.IMErrorCode_SUCCESS {
		responses.ErrorHttpResp(ctx, code)
		return
	}
	responses.SuccessHttpResp(ctx, nil)
}

// ListAiApiKeys 列出 API Key
func ListAiApiKeys(ctx *gin.Context) {
	appKey := ctx.GetString(string(ctxs.CtxKey_AppKey))
	bindType, _ := strconv.Atoi(ctx.DefaultQuery("bind_type", "-1"))
	status, _ := strconv.Atoi(ctx.DefaultQuery("status", "-1"))
	keys, code := services.ListAiApiKeys(appKey, bindType, status)
	if code != errs.IMErrorCode_SUCCESS {
		responses.ErrorHttpResp(ctx, code)
		return
	}
	list := make([]*AiKeyItem, 0, len(keys))
	for _, k := range keys {
		list = append(list, &AiKeyItem{
			Id:           k.Id,
			Name:         k.Name,
			ApiKeyMasked: maskApiKey(k.ApiKey),
			ApiUrl:       k.ApiUrl,
			Model:        k.Model,
			BindType:     k.BindType,
			BindUserId:   k.BindUserId,
			Status:       k.Status,
			DailyLimit:   k.DailyLimit,
			UsedToday:    k.UsedToday,
			TotalUsed:    k.TotalUsed,
			CreatedTime:  k.CreatedTime.Format("2006-01-02 15:04:05"),
		})
	}
	responses.SuccessHttpResp(ctx, &AiKeyListResponse{List: list})
}

// GetAiUsageStats 获取 AI 用量统计
func GetAiUsageStats(ctx *gin.Context) {
	appKey := ctx.GetString(string(ctxs.CtxKey_AppKey))
	startDate := ctx.Query("start_date")
	endDate := ctx.Query("end_date")
	userId := ctx.Query("user_id")
	var stats interface{}
	var code errs.IMErrorCode
	if userId != "" {
		stats, code = services.GetUserAiUsageStats(appKey, userId, startDate, endDate)
	} else {
		stats, code = services.GetAiUsageStats(appKey, startDate, endDate)
	}
	if code != errs.IMErrorCode_SUCCESS {
		responses.ErrorHttpResp(ctx, code)
		return
	}
	responses.SuccessHttpResp(ctx, stats)
}

// maskApiKey 脱敏 API Key（只显示前4后4）
func maskApiKey(key string) string {
	if len(key) <= 8 {
		return "****"
	}
	return key[:4] + "****" + key[len(key)-4:]
}
