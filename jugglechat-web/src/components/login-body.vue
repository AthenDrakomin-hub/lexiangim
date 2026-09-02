<script setup>
import { reactive, getCurrentInstance } from "vue";
import utils from "../common/utils";
import { useRouter } from "vue-router";
import { STORAGE, RESPONSE } from "../common/enum";
import common from "../common/common";
import Storage from "../common/storage";
import im from "../common/im";
import { CONFIG } from "../config";
import ModalServerSetting from "../components/modal-server-setting.vue";

const props = defineProps(["isLogin", "isAdd", "isShow"]);

let juggle = im.getCurrent();
let context = getCurrentInstance();

const router = useRouter();
let state = reactive({
  user: {
    account: '',
    password: ''
  },
  errorMsg: {
    account: '',
    password: '',
    nickname: '',
    confirmPassword: ''
  },
  isShowServerSetting: false,
  isRegister: false,
  nickname: '',
  confirmPassword: '',
  loading: false,
  agreeTerms: false
});

function onInput() {
  utils.extend(state.errorMsg, { account: '', password: '', nickname: '', confirmPassword: '' });
}

function validateAccount(account) {
  if (utils.isEmpty(account)) return '账号不能为空';
  if (account.length < 4) return '账号至少4位';
  return '';
}

function validatePassword(pwd) {
  if (utils.isEmpty(pwd)) return '密码不能为空';
  if (pwd.length < 6) return '密码至少6位';
  return '';
}

function validateNickname(name) {
  if (utils.isEmpty(name)) return '昵称不能为空';
  return '';
}

function validateConfirmPassword(pwd, confirm) {
  if (pwd !== confirm) return '两次密码不一致';
  return '';
}

function getApiBase() {
  return `https://${CONFIG.API}/jim`;
}

function onLogin() {
  let { account, password } = state.user;
  let errAccount = validateAccount(account);
  let errPwd = validatePassword(password);
  if (errAccount) return state.errorMsg.account = errAccount;
  if (errPwd) return state.errorMsg.password = errPwd;

  state.loading = true;
  fetch(`${getApiBase()}/login`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'AppKey': Storage.get(STORAGE.SERVER_SETTING)?.appkey || 'LXIM2026PROD001'
    },
    body: JSON.stringify({ account: account, password: password })
  })
  .then(res => res.json())
  .then(result => {
    state.loading = false;
    if (result.code !== 0) {
      if (result.code === 17012) {
        state.errorMsg.account = '账号不存在，请先注册';
      } else if (result.code === 17013) {
        state.errorMsg.password = '密码错误';
      } else if (result.code === 17018) {
        state.errorMsg.account = '账号已被禁用，请联系管理员';
      } else {
        state.errorMsg.account = result.msg || `登录失败（错误码: ${result.code}）`;
      }
      return;
    }
    let { user_id, authorization, nickname, avatar, im_token } = result.data;
    let user = { id: user_id, token: im_token, authorization: authorization, name: nickname, portrait: avatar, isUsed: true };
    Storage.set(STORAGE.USER_TOKEN, user);
    let accounts = Storage.get(STORAGE.USERS);
    if (!Array.isArray(accounts)) {
      accounts = [];
    }
    let index = utils.find(accounts, (item) => utils.isEqual(item.id, user.id));
    if (index === -1) accounts.push(user);
    Storage.set(STORAGE.USERS, accounts);
    if (props.isLogin) {
      router.replace({ name: 'ConversationList' });
    } else {
      location.reload();
    }
  })
  .catch(err => {
    state.loading = false;
    state.errorMsg.password = '网络连接失败，请检查服务是否启动';
    console.error(err);
  });
}

function onRegister() {
  let { account, password } = state.user;
  let { nickname, confirmPassword } = state;
  let errAccount = validateAccount(account);
  let errPwd = validatePassword(password);
  let errName = validateNickname(nickname);
  let errConfirm = validateConfirmPassword(password, confirmPassword);
  if (errAccount) return state.errorMsg.account = errAccount;
  if (errPwd) return state.errorMsg.password = errPwd;
  if (errName) return state.errorMsg.nickname = errName;
  if (errConfirm) return state.errorMsg.confirmPassword = errConfirm;
  if (!state.agreeTerms) {
    state.errorMsg.account = '请先阅读并同意用户协议和隐私政策';
    return;
  }

  state.loading = true;
  fetch(`${getApiBase()}/register`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'AppKey': Storage.get(STORAGE.SERVER_SETTING)?.appkey || 'LXIM2026PROD001'
    },
    body: JSON.stringify({ account: account, password: password, nickname: nickname })
  })
  .then(res => res.json())
  .then(result => {
    state.loading = false;
    if (result.code !== 0) {
      if (result.code === 17011) {
        state.errorMsg.account = '账号已存在，请直接登录';
      } else {
        state.errorMsg.account = result.msg || `注册失败（错误码: ${result.code}）`;
      }
      return;
    }
    context.proxy.$toast({ text: '注册成功，请登录', icon: 'success' });
    state.isRegister = false;
    state.errorMsg = { account: '', password: '', nickname: '', confirmPassword: '' };
    state.user = { account: account, password: '' };
  })
  .catch(err => {
    state.loading = false;
    state.errorMsg.account = '网络连接失败，请检查服务是否启动';
    console.error(err);
  });
}

function toggleMode() {
  state.isRegister = !state.isRegister;
  state.errorMsg = { account: '', password: '', nickname: '', confirmPassword: '' };
  state.user = { account: '', password: '' };
  state.nickname = '';
  state.confirmPassword = '';
}

function onShowServerSetting(isShow) {
  state.isShowServerSetting = isShow;
}
</script>

<template>
  <div class="lx-page lx-login-page" :class="{ 'tyn-desktop-root': juggle.isDesktop(), 'tyn-web-root': !juggle.isDesktop() }">
    <!-- 背景波浪层 -->
    <div class="lx-wave lx-wave-1"></div>
    <div class="lx-wave lx-wave-2"></div>

    <!-- 气泡装饰 -->
    <div class="lx-bubble lx-bubble-1"></div>
    <div class="lx-bubble lx-bubble-2"></div>
    <div class="lx-bubble lx-bubble-3"></div>
    <div class="lx-bubble lx-bubble-4"></div>
    <div class="lx-bubble lx-bubble-5"></div>
    <div class="lx-bubble lx-bubble-6"></div>
    <div class="lx-bubble lx-bubble-7"></div>

    <!-- 服务器设置入口（低调保留） -->
    <div class="lx-server-settings" @click="onShowServerSetting(true)" v-if="props.isLogin" title="服务器设置"></div>

    <div class="lx-main">
      <!-- 顶部 Logo + 标题 -->
      <div class="lx-header">
        <div class="lx-logo-icon">
          <svg viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M24 4C12.95 4 4 11.85 4 21.5C4 27.3 7.2 32.4 12 35.6V44L17.5 40.5C19.5 41.1 21.7 41.5 24 41.5C35.05 41.5 44 33.65 44 24C44 14.35 35.05 4 24 4Z" fill="white"/>
            <circle cx="17" cy="20" r="2.5" fill="#0d4f4f"/>
            <circle cx="31" cy="20" r="2.5" fill="#0d4f4f"/>
            <path d="M16 27C18 30 21 31.5 24 31.5C27 31.5 30 30 32 27" stroke="#0d4f4f" stroke-width="2.5" stroke-linecap="round"/>
          </svg>
        </div>
        <h1 class="lx-title">欢迎回到乐享</h1>
        <p class="lx-subtitle">极速消息，安全守护每一次交流</p>
      </div>

      <!-- 毛玻璃卡片 -->
      <div class="lx-card">
        <!-- 登录模式 -->
        <template v-if="!state.isRegister">
          <div class="lx-form-group">
            <input
              type="text"
              class="lx-input"
              v-model="state.user.account"
              placeholder="账号"
              @input="onInput()"
              @keydown.enter="onLogin()"
            >
            <p class="lx-error" v-if="state.errorMsg.account">{{ state.errorMsg.account }}</p>
          </div>
          <div class="lx-form-group">
            <div class="lx-input-with-icon">
              <input
                type="password"
                class="lx-input"
                v-model="state.user.password"
                placeholder="密码"
                @input="onInput()"
                @keydown.enter="onLogin()"
              >
              <span class="lx-input-arrow">›</span>
            </div>
            <p class="lx-error" v-if="state.errorMsg.password">{{ state.errorMsg.password }}</p>
          </div>
          <div class="lx-forgot-wrap">
            <span class="lx-forgot">忘记密码</span>
          </div>
          <a
            class="lx-btn"
            :class="{ 'lx-btn-loading': state.loading }"
            @click="onLogin()"
          >
            {{ state.loading ? '登录中...' : '登录乐享' }}
          </a>
          <div class="lx-toggle" @click="toggleMode()">还没有账号？立即注册</div>
        </template>

        <!-- 注册模式 -->
        <template v-else>
          <div class="lx-form-group">
            <input
              type="text"
              class="lx-input"
              v-model="state.user.account"
              placeholder="账号（4-20位）"
              @input="onInput()"
              @keydown.enter="onRegister()"
            >
            <p class="lx-error" v-if="state.errorMsg.account">{{ state.errorMsg.account }}</p>
          </div>
          <div class="lx-form-group">
            <input
              type="text"
              class="lx-input"
              v-model="state.nickname"
              placeholder="昵称"
              @input="onInput()"
              @keydown.enter="onRegister()"
            >
            <p class="lx-error" v-if="state.errorMsg.nickname">{{ state.errorMsg.nickname }}</p>
          </div>
          <div class="lx-form-group">
            <input
              type="password"
              class="lx-input"
              v-model="state.user.password"
              placeholder="设置密码（至少6位）"
              @input="onInput()"
              @keydown.enter="onRegister()"
            >
            <p class="lx-error" v-if="state.errorMsg.password">{{ state.errorMsg.password }}</p>
          </div>
          <div class="lx-form-group">
            <input
              type="password"
              class="lx-input"
              v-model="state.confirmPassword"
              placeholder="确认密码"
              @input="onInput()"
              @keydown.enter="onRegister()"
            >
            <p class="lx-error" v-if="state.errorMsg.confirmPassword">{{ state.errorMsg.confirmPassword }}</p>
          </div>
          <div class="lx-terms-wrap">
            <label class="lx-terms-checkbox">
              <input type="checkbox" v-model="state.agreeTerms">
              <span>我已阅读并同意</span>
            </label>
            <a href="https://juggle.im/jc/user.html" target="_blank" class="lx-terms-link">《用户协议》</a>
            <span>和</span>
            <a href="https://juggle.im/jc/privacy.html" target="_blank" class="lx-terms-link">《隐私政策》</a>
          </div>
          <a
            class="lx-btn"
            :class="{ 'lx-btn-loading': state.loading }"
            @click="onRegister()"
          >
            {{ state.loading ? '注册中...' : '注册并登录' }}
          </a>
          <div class="lx-toggle" @click="toggleMode()">已有账号？返回登录</div>
        </template>
      </div>
    </div>

    <ModalServerSetting :is-show="state.isShowServerSetting" @oncancel="onShowServerSetting(false)"></ModalServerSetting>
  </div>
</template>

<style scoped>
.lx-page {
  position: relative;
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(160deg, #0a3d3d 0%, #0d5c5c 35%, #118a7e 70%, #2bbbad 100%);
  overflow: hidden;
  font-family: -apple-system, BlinkMacSystemFont, "PingFang SC", "Microsoft YaHei", sans-serif;
}

/* 波浪背景 */
.lx-wave {
  position: absolute;
  border-radius: 50%;
  filter: blur(60px);
  opacity: 0.5;
}
.lx-wave-1 {
  width: 600px;
  height: 600px;
  background: radial-gradient(circle, #00c9a7 0%, transparent 70%);
  top: -200px;
  right: -150px;
}
.lx-wave-2 {
  width: 500px;
  height: 500px;
  background: radial-gradient(circle, #00e5c4 0%, transparent 70%);
  bottom: -180px;
  left: -120px;
}

/* 气泡装饰 */
.lx-bubble {
  position: absolute;
  border-radius: 50%;
  background: radial-gradient(circle at 30% 30%, rgba(255,255,255,0.4) 0%, rgba(255,255,255,0.1) 50%, rgba(255,255,255,0.05) 100%);
  border: 1px solid rgba(255,255,255,0.25);
  box-shadow: inset 0 0 20px rgba(255,255,255,0.15), 0 4px 20px rgba(0,0,0,0.1);
}
.lx-bubble-1 { width: 100px; height: 100px; top: 6%; left: 3%; }
.lx-bubble-2 { width: 60px; height: 60px; top: 12%; right: 8%; }
.lx-bubble-3 { width: 130px; height: 130px; top: 30%; right: -40px; opacity: 0.55; }
.lx-bubble-4 { width: 45px; height: 45px; top: 45%; left: 5%; }
.lx-bubble-5 { width: 80px; height: 80px; bottom: 20%; right: 12%; }
.lx-bubble-6 { width: 35px; height: 35px; bottom: 12%; left: 10%; }
.lx-bubble-7 { width: 55px; height: 55px; top: 60%; right: 3%; }

/* 服务器设置小图标 */
.lx-server-settings {
  position: absolute;
  top: 20px;
  right: 20px;
  width: 36px;
  height: 36px;
  border-radius: 50%;
  background: rgba(255,255,255,0.15);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255,255,255,0.2);
  cursor: pointer;
  z-index: 20;
  transition: all 0.2s;
}
.lx-server-settings:hover {
  background: rgba(255,255,255,0.25);
}

.lx-main {
  position: relative;
  z-index: 10;
  width: 100%;
  max-width: 420px;
  padding: 0 24px;
  display: flex;
  flex-direction: column;
  align-items: center;
}

/* 顶部 */
.lx-header {
  text-align: center;
  margin-bottom: 32px;
}
.lx-logo-icon {
  width: 72px;
  height: 72px;
  margin: 0 auto 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  filter: drop-shadow(0 4px 16px rgba(0,0,0,0.2));
}
.lx-logo-icon svg {
  width: 100%;
  height: 100%;
}
.lx-title {
  font-size: 38px;
  font-weight: 800;
  color: #ffffff;
  margin: 0 0 10px;
  letter-spacing: 3px;
  text-shadow: 0 2px 12px rgba(0,0,0,0.2);
}
.lx-subtitle {
  font-size: 16px;
  color: rgba(255,255,255,0.8);
  margin: 0;
  letter-spacing: 1px;
}

/* 毛玻璃卡片 */
.lx-card {
  width: 100%;
  background: linear-gradient(135deg, rgba(255,255,255,0.18) 0%, rgba(255,255,255,0.08) 100%);
  backdrop-filter: blur(24px);
  -webkit-backdrop-filter: blur(24px);
  border: 1.5px solid rgba(255,255,255,0.3);
  border-radius: 32px;
  padding: 36px 28px 28px;
  box-shadow: 0 16px 48px rgba(0,0,0,0.2), inset 0 1px 0 rgba(255,255,255,0.3);
}

.lx-form-group {
  margin-bottom: 18px;
}
.lx-input-with-icon {
  position: relative;
}
.lx-input {
  width: 100%;
  height: 52px;
  border-radius: 26px;
  border: 1.5px solid rgba(255,255,255,0.35);
  background: rgba(255,255,255,0.2);
  padding: 0 22px;
  font-size: 16px;
  color: #ffffff;
  box-sizing: border-box;
  transition: all 0.25s ease;
}
.lx-input::placeholder {
  color: rgba(255,255,255,0.6);
}
.lx-input:focus {
  outline: none;
  border-color: rgba(255,255,255,0.7);
  background: rgba(255,255,255,0.28);
  box-shadow: 0 0 0 3px rgba(255,255,255,0.1);
}
.lx-input-arrow {
  position: absolute;
  right: 20px;
  top: 50%;
  transform: translateY(-50%);
  font-size: 24px;
  color: rgba(255,255,255,0.6);
  pointer-events: none;
  line-height: 1;
}
.lx-error {
  font-size: 12px;
  color: #ff8a80;
  margin: 6px 0 0;
  padding-left: 8px;
  min-height: 16px;
}

.lx-forgot-wrap {
  text-align: right;
  margin: -8px 8px 16px 0;
}
.lx-forgot {
  font-size: 13px;
  color: rgba(255,255,255,0.7);
  cursor: pointer;
  transition: color 0.2s;
}
.lx-forgot:hover {
  color: #ffffff;
}

.lx-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 54px;
  border-radius: 27px;
  background: linear-gradient(135deg, #5eead4 0%, #2dd4bf 50%, #14b8a6 100%);
  color: #0d3d3d;
  font-size: 19px;
  font-weight: 700;
  letter-spacing: 4px;
  border: none;
  cursor: pointer;
  box-shadow: 0 6px 24px rgba(20,184,166,0.5), inset 0 1px 0 rgba(255,255,255,0.5);
  transition: all 0.25s ease;
  text-decoration: none;
  margin-top: 8px;
}
.lx-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 10px 32px rgba(20,184,166,0.6), inset 0 1px 0 rgba(255,255,255,0.5);
}
.lx-btn:active {
  transform: translateY(0);
}
.lx-btn-loading {
  opacity: 0.7;
  cursor: not-allowed;
  transform: none;
}

.lx-toggle {
  text-align: center;
  color: rgba(255,255,255,0.8);
  font-size: 14px;
  margin-top: 18px;
  cursor: pointer;
  transition: color 0.2s;
}
.lx-toggle:hover {
  color: #ffffff;
  text-decoration: underline;
}

/* 注册协议 */
.lx-terms-wrap {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 4px;
  font-size: 12px;
  color: rgba(255,255,255,0.75);
  margin-bottom: 16px;
  line-height: 1.6;
}
.lx-terms-checkbox {
  display: flex;
  align-items: center;
  gap: 6px;
  cursor: pointer;
  margin: 0;
}
.lx-terms-checkbox input {
  width: 14px;
  height: 14px;
  accent-color: #2dd4bf;
  cursor: pointer;
}
.lx-terms-link {
  color: #5eead4;
  text-decoration: none;
  font-weight: 500;
}
.lx-terms-link:hover {
  text-decoration: underline;
}

/* ── 深色模式登录页 ─────────────────────────────────── */
[data-bs-theme="dark"] .lx-page {
  background: linear-gradient(160deg, #0d1117 0%, #161b22 35%, #21262d 70%, #30363d 100%);
}

[data-bs-theme="dark"] .lx-wave-1 {
  background: radial-gradient(circle, rgba(94, 234, 173, 0.3) 0%, transparent 70%);
}

[data-bs-theme="dark"] .lx-wave-2 {
  background: radial-gradient(circle, rgba(45, 212, 191, 0.25) 0%, transparent 70%);
}

[data-bs-theme="dark"] .lx-bubble {
  background: radial-gradient(circle at 30% 30%, rgba(255,255,255,0.08) 0%, rgba(255,255,255,0.03) 50%, rgba(255,255,255,0.01) 100%);
  border: 1px solid rgba(255,255,255,0.08);
  box-shadow: inset 0 0 20px rgba(255,255,255,0.03), 0 4px 20px rgba(0,0,0,0.3);
}

[data-bs-theme="dark"] .lx-server-settings {
  background: rgba(255,255,255,0.08);
  border: 1px solid rgba(255,255,255,0.12);
}

[data-bs-theme="dark"] .lx-server-settings:hover {
  background: rgba(255,255,255,0.15);
}

[data-bs-theme="dark"] .lx-card {
  background: linear-gradient(135deg, rgba(30,30,50,0.85) 0%, rgba(20,20,40,0.95) 100%);
  backdrop-filter: blur(24px);
  -webkit-backdrop-filter: blur(24px);
  border: 1.5px solid rgba(255,255,255,0.1);
  box-shadow: 0 16px 48px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.05);
}

[data-bs-theme="dark"] .lx-input {
  border-color: rgba(255,255,255,0.15);
  background: rgba(255,255,255,0.08);
  color: #ffffff;
}

[data-bs-theme="dark"] .lx-input::placeholder {
  color: rgba(255,255,255,0.4);
}

[data-bs-theme="dark"] .lx-input:focus {
  border-color: rgba(255,255,255,0.3);
  background: rgba(255,255,255,0.12);
  box-shadow: 0 0 0 3px rgba(255,255,255,0.05);
}

[data-bs-theme="dark"] .lx-input-arrow {
  color: rgba(255,255,255,0.5);
}

[data-bs-theme="dark"] .lx-forgot {
  color: rgba(255,255,255,0.6);
}

[data-bs-theme="dark"] .lx-forgot:hover {
  color: rgba(255,255,255,0.9);
}

[data-bs-theme="dark"] .lx-btn {
  background: linear-gradient(135deg, #5eead4 0%, #2dd4bf 50%, #14b8a6 100%);
  box-shadow: 0 6px 24px rgba(20,184,166,0.3), inset 0 1px 0 rgba(255,255,255,0.2);
}

[data-bs-theme="dark"] .lx-btn:hover {
  box-shadow: 0 10px 32px rgba(20,184,166,0.4), inset 0 1px 0 rgba(255,255,255,0.2);
}

[data-bs-theme="dark"] .lx-toggle {
  color: rgba(255,255,255,0.7);
}

[data-bs-theme="dark"] .lx-toggle:hover {
  color: #ffffff;
}

[data-bs-theme="dark"] .lx-terms-wrap {
  color: rgba(255,255,255,0.6);
}

[data-bs-theme="dark"] .lx-terms-link {
  color: #5eead4;
}

[data-bs-theme="dark"] .lx-terms-checkbox input {
  accent-color: #2dd4bf;
}

[data-bs-theme="dark"] .lx-error {
  color: #ff8a80;
}
</style>
