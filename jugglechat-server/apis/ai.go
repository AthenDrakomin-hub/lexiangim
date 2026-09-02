package apis

import (
	"encoding/json"
	"fmt"
	"net/http"
	"strings"

	"github.com/gin-gonic/gin"
	"github.com/juggleim/jugglechat-server/commons/configures"
	"github.com/juggleim/jugglechat-server/commons/errs"
	"github.com/juggleim/jugglechat-server/commons/responses"
	"github.com/juggleim/jugglechat-server/commons/tools"
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
}

// AgnesChoice Agnes选择
type AgnesChoice struct {
	Message AgnesMessage `json:"message"`
}

// AiAnswer AI回答接口
// 接收前端的消息数组，转换为Agnes API格式，调用Agnes API，返回AI的回复
func AiAnswer(ctx *gin.Context) {
	req := &AiAnswerRequest{}
	if err := ctx.BindJSON(req); err != nil || len(req.Msgs) == 0 {
		responses.ErrorHttpResp(ctx, errs.IMErrorCode_APP_REQ_BODY_ILLEGAL)
		return
	}

	// 检查Agnes API配置
	apiKey := configures.Config.AgnesApiKey
	apiUrl := configures.Config.AgnesApiUrl
	if apiKey == "" || apiUrl == "" {
		fmt.Printf("Agnes API not configured: apiKey=%s, apiUrl=%s\n", apiKey, apiUrl)
		responses.ErrorHttpResp(ctx, errs.IMErrorCode_APP_NOT_EXISTED)
		return
	}

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
		Model:    configures.Config.AgnesModel,
		Messages: agnesMessages,
	}
	reqBody, _ := json.Marshal(agnesReq)

	// 调用Agnes API
	headers := map[string]string{
		"Content-Type":  "application/json",
		"Authorization": "Bearer " + apiKey,
	}

	fmt.Printf("Calling Agnes API: url=%s, model=%s, messages=%d\n", apiUrl, agnesReq.Model, len(agnesMessages))

	respBody, httpCode, err := tools.HttpDo(http.MethodPost, apiUrl, headers, string(reqBody))
	if err != nil {
		fmt.Printf("Agnes API call error: %v\n", err)
		responses.ErrorHttpResp(ctx, errs.IMErrorCode_APP_REQ_BODY_ILLEGAL)
		return
	}

	if httpCode != http.StatusOK {
		fmt.Printf("Agnes API returned non-200: code=%d, body=%s\n", httpCode, respBody)
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

	// 返回响应
	responses.SuccessHttpResp(ctx, AiAnswerResponse{
		Answer: answer,
	})
}
