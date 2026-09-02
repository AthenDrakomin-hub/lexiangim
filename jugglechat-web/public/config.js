/**
 * 乐享 IM - 外部配置文件
 * 
 * 用途: 部署后修改API地址、WebSocket地址等配置，无需重新构建前端
 * 使用: 直接编辑本文件，保存后刷新浏览器即可生效
 * 
 * 注意: 
 * - API_HOST 不需要加 https:// 前缀，代码会自动添加
 * - WS_HOST 需要加 wss:// 前缀
 * - 修改后需要清除浏览器缓存或强制刷新(Ctrl+F5)
 */

window.LEXIANG_CONFIG = {
  // 后端API地址（不加协议前缀，代码自动加https://）
  API_HOST: 'api.yefeng.us.cc',
  
  // WebSocket地址（需要加wss://前缀）
  WS_HOST: 'wss://api.yefeng.us.cc',
  
  // 管理后台地址
  ADMIN_HOST: 'admin.yefeng.us.cc',
  
  // 乐享应用appkey（一般不需要修改）
  APP_KEY: 'LXIM2026PROD001',
  
  // 音视频APPID（即构科技，一般不需要修改）
  RTC_APP_ID: 1881186044
};
