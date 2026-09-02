package configures

import (
	"os"

	"gopkg.in/yaml.v3"
)

type AppConfig struct {
	Port         int `yaml:"port"`
	CallbackPort int `yaml:"callbackPort"`

	Log struct {
		LogPath string `yaml:"logPath"`
		LogName string `yaml:"logName"`
	} `yaml:"log"`

	Mysql struct {
		User     string `yaml:"user"`
		Password string `yaml:"password"`
		Address  string `yaml:"address"`
		DbName   string `yaml:"name"`
		Debug    bool   `yaml:"debug"`
	} `yaml:"mysql"`

	ImApiDomain string `yaml:"imApiDomain"`

	CallbackBaseUrl   string `yaml:"callbackBaseUrl"`
	AiBotCallbackUrl  string `yaml:"aiBotCallbackUrl"`
	AssistantAgentUrl string `yaml:"assistantAgentUrl"`

	// Agnes AI 配置
	AgnesApiKey string `yaml:"agnesApiKey"`
	AgnesApiUrl string `yaml:"agnesApiUrl"`
	AgnesModel  string `yaml:"agnesModel"`

	BotConnector struct {
		Domain string `yaml:"domain"`
	} `yaml:"botConnector"`
}

var Config AppConfig
var Env string

const (
	EnvDev  = "dev"
	EnvProd = "prod"
)

func InitConfigures() error {
	cfBytes, err := os.ReadFile("conf/config.yml")
	if err != nil {
		return err
	}
	var conf AppConfig
	yaml.Unmarshal(cfBytes, &conf)
	Config = conf
	if Config.Port <= 0 {
		Config.Port = 8070
	}
	// 环境变量覆盖（优先于配置文件，便于容器化部署注入敏感信息）
	if v, ok := os.LookupEnv("JCHAT_MYSQL_PASSWORD"); ok && v != "" {
		Config.Mysql.Password = v
	}
	if v, ok := os.LookupEnv("JCHAT_MYSQL_ADDRESS"); ok && v != "" {
		Config.Mysql.Address = v
	}
	if v, ok := os.LookupEnv("JCHAT_MYSQL_DBNAME"); ok && v != "" {
		Config.Mysql.DbName = v
	}
	if v, ok := os.LookupEnv("JCHAT_MYSQL_USER"); ok && v != "" {
		Config.Mysql.User = v
	}
	if v, ok := os.LookupEnv("JCHAT_IM_API_DOMAIN"); ok && v != "" {
		Config.ImApiDomain = v
	}
	if v, ok := os.LookupEnv("JCHAT_IM_ADMIN_DOMAIN"); ok && v != "" {
		Config.ImApiDomain = v // 兼容命名
	}
	return nil
}
