package apis

import (
	"encoding/json"
	"fmt"
	"net/http"
	"strconv"
	"strings"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/juggleim/jugglechat-server/commons/configures"
	"github.com/juggleim/jugglechat-server/commons/ctxs"
	"github.com/juggleim/jugglechat-server/commons/dbcommons"
	"github.com/juggleim/jugglechat-server/commons/errs"
	"github.com/juggleim/jugglechat-server/commons/responses"
	"github.com/juggleim/jugglechat-server/commons/tools"
	"github.com/juggleim/jugglechat-server/services"
)

// AiAnswerRequest 前端AI回答请求
type AiAnswerRequest struct {
	Msgs []AiMessage `json:"msgs"`
}

// AiMessage AI消息
type AiMessage struct {
	SenderID string `json:"sender_id"`
	Content  string `json:"content"`
	MsgTime  int64  `json:"msg_time"`
}

// AiAnswerResponse AI回答响应
type AiAnswerResponse struct {
	Answer string `json:"answer"`
}

// AgnesChatRequest Agnes API请求
type AgnesChatRequest struct {
	Model    string         `json:"model"`
	Messages []AgnesMessage `json:"messages"`
}

// AgnesMessage Agnes消息
type AgnesMessage struct {
	Role    string `json:"role"`
	Content string `json:"content"`
}

// AgnesChatResponse Agnes API响应
type AgnesChatResponse struct {
	Choices []AgnesChoice `json:"choices"`
	Usage   AgnesUsage    `json:"usage"`
}

// AgnesUsage token用量
type AgnesUsage struct {
	PromptTokens     int `json:"prompt_tokens"`
	CompletionTokens int `json:"completion_tokens"`
	TotalTokens      int `json:"total_tokens"`
}

// AgnesChoice Agnes选择
type AgnesChoice struct {
	Message AgnesMessage `json:"message"`
}

// UserVipLevel 用户VIP等级查询结果
type UserVipLevel struct {
	VipLevel int `gorm:"vip_level"`
}

// AiAnswer AI回答接口
// 接收前端的消息数组，转换为Agnes API格式，调用Agnes API，返回AI的回复
// VIP权限校验：只有VIP用户(vip_level=1)才能使用AI功能
func AiAnswer(ctx *gin.Context) {
	req := &AiAnswerRequest{}
	if err := ctx.BindJSON(req); err != nil || len(req.Msgs) == 0 {
		responses.ErrorHttpResp(ctx, errs.IMErrorCode_APP_REQ_BODY_ILLEGAL)
		return
	}

	// VIP权限校验
	userId := ctx.GetString(string(ctxs.CtxKey_RequesterId))
	appkey := ctx.GetString(string(ctxs.CtxKey_AppKey))
	if userId == "" {
		responses.ErrorHttpResp(ctx, errs.IMErrorCode_APP_NOT_LOGIN)
		return
	}

	var userVip UserVipLevel
	err := dbcommons.GetDb().Table("users").
		Select("vip_level").
		Where("app_key=? and user_id=?", appkey, userId).
		Take(&userVip).Error
	if err != nil {
		fmt.Printf("AI权限校验失败: userId=%s, err=%v\n", userId, err)
		responses.ErrorHttpResp(ctx, errs.IMErrorCode_APP_FORBIDDEN)
		return
	}

	if userVip.VipLevel != 1 {
		fmt.Printf("AI权限不足: userId=%s, vip_level=%d\n", userId, userVip.VipLevel)
		responses.ErrorHttpResp(ctx, errs.IMErrorCode_APP_FORBIDDEN)
		return
	}

	// 选择 API Key（优先用户绑定 > 全局共享轮询 > config.yml 兜底）
	var apiKey, apiUrl, model string
	var keyId int64
	var keyName string
	selectedKey, keyCode := services.SelectApiKeyForUser(appkey, userId)
	if keyCode == errs.IMErrorCode_SUCCESS && selectedKey != nil {
		apiKey = selectedKey.ApiKey
		apiUrl = selectedKey.ApiUrl
		model = selectedKey.Model
		keyId = selectedKey.Id
		keyName = selectedKey.Name
	} else {
		// 回退到 config.yml 全局配置
		apiKey = configures.Config.AgnesApiKey
		apiUrl = configures.Config.AgnesApiUrl
		model = configures.Config.AgnesModel
	}
	if apiKey == "" || apiUrl == "" {
		fmt.Printf("Agnes API not configured: apiKey=%s, apiUrl=%s\n", apiKey, apiUrl)
		responses.ErrorHttpResp(ctx, errs.IMErrorCode_APP_NOT_EXISTED)
		return
	}
	if model == "" {
		model = "agnes-free"
	}

	startTime := time.Now()

	// 转换消息格式（前端格式 -> Agnes格式）
	agnesMessages := make([]AgnesMessage, 0, len(req.Msgs))
	for _, msg := range req.Msgs {
		role := "user"
		// 如果sender_id包含"assistant"或"bot"，则是AI消息
		if strings.Contains(strings.ToLower(msg.SenderID), "assistant") ||
			strings.Contains(strings.ToLower(msg.SenderID), "bot") ||
			strings.Contains(strings.ToLower(msg.SenderID), "ai") {
			role = "assistant"
		}
		agnesMessages = append(agnesMessages, AgnesMessage{
			Role:    role,
			Content: msg.Content,
		})
	}

	// 构建Agnes API请求
	agnesReq := AgnesChatRequest{
		Model:    model,
		Messages: agnesMessages,
	}
	reqBody, _ := json.Marshal(agnesReq)

	// 调用Agnes API
	headers := map[string]string{
		"Content-Type":  "application/json",
		"Authorization": "Bearer " + apiKey,
	}

	fmt.Printf("Calling Agnes API: url=%s, model=%s, messages=%d, userId=%s\n", apiUrl, agnesReq.Model, len(agnesMessages), userId)

	respBody, httpCode, err := tools.HttpDo(http.MethodPost, apiUrl, headers, string(reqBody))
	durationMs := time.Since(startTime).Milliseconds()
	if err != nil {
		fmt.Printf("Agnes API call error: %v\n", err)
		if keyId > 0 {
			services.RecordAiUsage(appkey, userId, keyId, keyName, 0, 0, 0, 1, err.Error(), durationMs)
		}
		responses.ErrorHttpResp(ctx, errs.IMErrorCode_APP_REQ_BODY_ILLEGAL)
		return
	}

	if httpCode != http.StatusOK {
		fmt.Printf("Agnes API returned non-200: code=%d, body=%s\n", httpCode, respBody)
		if keyId > 0 {
			services.RecordAiUsage(appkey, userId, keyId, keyName, 0, 0, 0, 1, "HTTP "+strconv.Itoa(httpCode), durationMs)
		}
		responses.ErrorHttpResp(ctx, errs.IMErrorCode_APP_REQ_BODY_ILLEGAL)
		return
	}

	// 解析Agnes API响应
	var agnesResp AgnesChatResponse
	if err := json.Unmarshal([]byte(respBody), &agnesResp); err != nil {
		fmt.Printf("Agnes API response parse error: %v, body=%s\n", err, respBody)
		responses.ErrorHttpResp(ctx, errs.IMErrorCode_APP_REQ_BODY_ILLEGAL)
		return
	}

	if len(agnesResp.Choices) == 0 {
		fmt.Printf("Agnes API returned no choices: body=%s\n", respBody)
		responses.ErrorHttpResp(ctx, errs.IMErrorCode_APP_REQ_BODY_ILLEGAL)
		return
	}

	answer := agnesResp.Choices[0].Message.Content
	fmt.Printf("Agnes API answer: %s\n", answer)

	// 记录成功用量（含token统计）
	if keyId > 0 {
		services.RecordAiUsage(appkey, userId, keyId, keyName,
			agnesResp.Usage.PromptTokens,
			agnesResp.Usage.CompletionTokens,
			agnesResp.Usage.TotalTokens,
			0, "", durationMs)
	}

	// 返回响应
	responses.SuccessHttpResp(ctx, AiAnswerResponse{
		Answer: answer,
	})
}
