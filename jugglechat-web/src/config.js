
import { STORAGE } from "./common/enum";
import Storage from "./common/storage";

let appConfig = Storage.get(STORAGE.SERVER_SETTING);

// 优先读取外部配置文件 public/config.js 中的 window.LEXIANG_CONFIG
// 这样部署后修改API地址无需重新构建，直接编辑 config.js 即可
const externalConfig = window.LEXIANG_CONFIG || {};

// 乐享默认 appkey (生产环境), 开发环境可在设置中修改
let appkey = appConfig.appkey || externalConfig.APP_KEY || 'LXIM2026PROD001';

const isDev = import.meta.env.DEV;

// API/WS 地址优先级: 外部配置 > 环境变量 > 默认值
// 外部配置: public/config.js 中的 window.LEXIANG_CONFIG（部署后可直接修改）
// 环境变量: .env.development / .env.production 或 Cloudflare Pages 环境变量
const API_HOST = externalConfig.API_HOST 
  || import.meta.env.VITE_API_HOST 
  || (isDev ? '127.0.0.1:9003' : window.location.host);

const WS_HOST = externalConfig.WS_HOST 
  || import.meta.env.VITE_WS_HOST 
  || (isDev ? 'ws://127.0.0.1:9003' : 'wss://' + window.location.host);

const rtcAppId = externalConfig.RTC_APP_ID || 1881186044;

let server = appConfig.server || WS_HOST;

export let CONFIG = {
  appkey: appkey,
  API: API_HOST,
  serverList: [server],
  rtcAppId: rtcAppId,
};
