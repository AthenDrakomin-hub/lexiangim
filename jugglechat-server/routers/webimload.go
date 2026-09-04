package routers

import (
	"embed"
	"fmt"
	"io/fs"
	"net/http"
	"strings"

	"github.com/gin-gonic/gin"
)

//go:embed webim
var webimFS embed.FS

func LoadWebIM(eng *gin.Engine) error {
	subFS, err := fs.Sub(webimFS, "webim")
	if err != nil {
		return fmt.Errorf("failed to sub webim FS: %w", err)
	}
	httpFS := http.FS(subFS)

	serveIndex := func(ctx *gin.Context) {
		serveIndexFile(ctx, subFS)
	}
	eng.GET("/", serveIndex)
	eng.HEAD("/", serveIndex)

	eng.NoRoute(func(ctx *gin.Context) {
		if ctx.Request.Method != http.MethodGet && ctx.Request.Method != http.MethodHead {
			ctx.Status(http.StatusNotFound)
			return
		}

		filePath := strings.TrimPrefix(ctx.Request.URL.Path, "/")
		if filePath == "" {
			filePath = "index.html"
		}

		if fileExists(subFS, filePath) {
			// 静态文件设置不缓存，避免 hash 变化后浏览器加载旧文件
			if strings.HasSuffix(filePath, ".js") || strings.HasSuffix(filePath, ".css") || strings.HasSuffix(filePath, ".png") || strings.HasSuffix(filePath, ".jpg") || strings.HasSuffix(filePath, ".svg") || strings.HasSuffix(filePath, ".woff") || strings.HasSuffix(filePath, ".woff2") || strings.HasSuffix(filePath, ".ttf") || strings.HasSuffix(filePath, ".ico") {
				ctx.Header("Cache-Control", "no-cache, no-store, must-revalidate")
				ctx.Header("Pragma", "no-cache")
				ctx.Header("Expires", "0")
			}
			ctx.FileFromFS(filePath, httpFS)
			return
		}
		serveIndexFile(ctx, subFS)
	})

	return nil
}

func serveIndexFile(ctx *gin.Context, fileSystem fs.FS) {
	data, err := fs.ReadFile(fileSystem, "index.html")
	if err != nil {
		ctx.Status(http.StatusNotFound)
		return
	}
	ctx.Data(http.StatusOK, "text/html; charset=utf-8", data)
}

func fileExists(fileSystem fs.FS, name string) bool {
	file, err := fileSystem.Open(name)
	if err != nil {
		return false
	}
	defer file.Close()

	stat, err := file.Stat()
	return err == nil && !stat.IsDir()
}
