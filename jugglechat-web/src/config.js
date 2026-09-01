
import { STORAGE } from "./common/enum";
import Stroage from "./common/storage";

let appConfig = Stroage.get(STORAGE.SERVER_SETTING);
// 乐享默认 appkey (生产环境), 开发环境可在设置中修改
let appkey = appConfig.appkey || 'YFbrDwnGG3JVRubC';

const isDev = import.meta.env.DEV;

// 从环境变量读取 API/WS 地址 (支持 Cloudflare Pages 独立部署)
// 开发环境: .env.development
// 生产环境: .env.production 或 Cloudflare Dashboard 环境变量
const API_HOST = import.meta.env.VITE_API_HOST || (isDev ? '127.0.0.1:9003' : window.location.host);
const WS_HOST = import.meta.env.VITE_WS_HOST || (isDev ? 'ws://127.0.0.1:9003' : 'wss://' + window.location.host);

let server = appConfig.server || WS_HOST;

export let CONFIG = {
  appkey: appkey,
  API: API_HOST,
  serverList: [server],
  rtcAppId: 1881186044,
};
