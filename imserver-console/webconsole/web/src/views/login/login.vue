<script setup>
import { useRouter } from "vue-router";
import { User } from "../../services";
import { reactive } from 'vue';
import { ErrorType, STORAGE, DEPLOY_TYPE, Errors } from "../../common/enum";
import utils from "../../common/utils";
import Storage from "../../common/storage";
import menuTools from "../layout/menu-tools";
import { t } from '@/i18n';
import LangSwitcher from '@/components/lang-switcher.vue';
import loginLogo from '@/assets/images/header/logo-mark.png';
import { useToast } from '@/composables/useToast';

const router = useRouter();
const { success: toastSuccess } = useToast();

const state = reactive({
  account: '',
  password: '',
  pwdErrorMsg: '',
  accountErrorMsg: '',
  loginErrorMsg: '',
  isSending: false,
});

function onLogin() {
  if (state.isSending) {
    return;
  }
  const { account, password } = state;
  state.accountErrorMsg = '';
  state.pwdErrorMsg = '';
  state.loginErrorMsg = '';

  if (utils.isEmpty(account)) {
    state.accountErrorMsg = t('login.validation.accountRequired');
    return;
  }
  if (utils.isEmpty(password)) {
    state.pwdErrorMsg = t('login.validation.passwordRequired');
    return;
  }

  state.isSending = true;
  Storage.remove(STORAGE.USER_TOKEN);
  User.login({ account, password })
    .then(({ code, data }) => {
      if (utils.isEqual(code, ErrorType.SUCCESS_0.code)) {
        data.type = utils.isEqual(data.env, 'private') ? DEPLOY_TYPE.PRIVATE : DEPLOY_TYPE.PUBLIC;
        Storage.set(STORAGE.USER_TOKEN, data);
        toastSuccess(t('login.feedback.success'));
        return menuTools.goHomePage(router);
      }
      const error = Errors.find((item) => utils.isEqual(item.code, code)) || {};
      state.loginErrorMsg = error.key ? t(error.key) : t('login.feedback.failedWithCode', { code });
    })
    .catch(() => {
      state.loginErrorMsg = t('login.feedback.networkError');
    })
    .finally(() => {
      state.isSending = false;
    });
}

function onInput(name) {
  const events = {
    pwd: () => {
      state.pwdErrorMsg = '';
    },
    account: () => {
      state.accountErrorMsg = '';
    }
  };
  state.loginErrorMsg = '';
  events[name]?.();
}
</script>

<template>
  <div class="cim-login-body">
    <!-- 左侧品牌横幅（大屏 >=1400px 显示） -->
    <div class="cim-login-banner">
      <div class="cim-login-sologin">
        <img :src="loginLogo" alt="乐享" class="cim-login-banner-logo">
        <div class="title">乐享管理后台</div>
        <div class="content">让沟通更快乐</div>
        <div class="content">全新一代即时通讯管理平台</div>
        <div class="grap">
          <span class="cim-login-banner-tag">集成简单</span>
          <span class="cim-login-banner-tag">服务稳定</span>
          <span class="cim-login-banner-tag">安全可靠</span>
        </div>
      </div>
    </div>

    <!-- 右侧登录区域 -->
    <div class="cim-login-right">
      <div class="cim-login-card">
        <!-- 语言选择器：限制在卡片右上角 -->
        <div class="cim-login-header">
          <LangSwitcher
            class-name="cim-login-language-field"
            wrapper-class="cim-login-language"
          />
        </div>

        <!-- Logo + 标题（只保留这一套） -->
        <div class="cim-login-title">
          <img :src="loginLogo" class="cim-login-title-logo" alt="乐享">
          <h1>{{ t('login.title') }}</h1>
          <p>{{ t('login.subtitle') }}</p>
        </div>

        <!-- 账号输入框：只有 placeholder，无前置静态文本 -->
        <div class="login-input-group">
          <input
            type="text"
            class="form-control"
            v-model="state.account"
            :placeholder="t('login.field.account')"
            autocomplete="username"
            @input="onInput('account')"
            @keydown.enter="onLogin"
          >
          <div class="invalid-feedback feedback" :class="{ 'is-visible': !!state.accountErrorMsg }">
            {{ state.accountErrorMsg }}
          </div>
        </div>

        <!-- 密码输入框：只有 placeholder，无前置静态文本 -->
        <div class="login-input-group">
          <input
            type="password"
            class="form-control"
            v-model="state.password"
            :placeholder="t('login.field.password')"
            autocomplete="current-password"
            @input="onInput('pwd')"
            @keydown.enter="onLogin"
          >
          <div class="invalid-feedback feedback" :class="{ 'is-visible': !!state.pwdErrorMsg }">
            {{ state.pwdErrorMsg }}
          </div>
        </div>

        <!-- 登录按钮 -->
        <div class="login-input-group">
          <button
            class="btn btn-primary cim-login-button"
            type="button"
            :disabled="state.isSending"
            @click="onLogin"
          >
            {{ state.isSending ? t('login.action.loading') : t('common.action.login') }}
          </button>
        </div>

        <!-- 错误提示 -->
        <div class="invalid-feedback feedback login-feedback" :class="{ 'is-visible': !!state.loginErrorMsg }">
          {{ state.loginErrorMsg }}
        </div>
      </div>

      <!-- 版权信息 -->
      <div class="cim-login-footer">
        <span>Copyright © 2026 乐享 版权所有</span>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* 外层容器：position:relative 限制内部绝对定位元素 */
.cim-login-body {
  min-height: 100vh;
  position: relative;
  overflow: hidden;
  display: flex;
  align-items: center;
  justify-content: center;
}

/* 右侧登录区域：position:relative 限制语言选择器 */
.cim-login-right {
  position: relative;
  width: 100%;
  max-width: 460px;
  padding: 24px;
  z-index: 1;
}

/* 登录卡片：position:relative 作为语言选择器的定位父容器 */
.cim-login-card {
  position: relative;
  background: #fff;
  border-radius: 16px;
  padding: 48px 40px 32px;
  box-shadow: 0 8px 32px rgba(0,0,0,0.08);
}

/* 语言选择器：绝对定位在卡片右上角，父容器是 cim-login-card */
.cim-login-header {
  position: absolute;
  top: 16px;
  right: 16px;
  z-index: 10;
}

/* Logo + 标题区域 */
.cim-login-title {
  text-align: center;
  margin-bottom: 32px;
}
.cim-login-title-logo {
  width: 56px;
  height: 56px;
  margin-bottom: 16px;
}
.cim-login-title h1 {
  font-size: 24px;
  font-weight: 700;
  color: #1f2937;
  margin: 0 0 8px;
}
.cim-login-title p {
  font-size: 14px;
  color: #6b7280;
  margin: 0;
}

/* 输入框组：无前置标签，只有 input + placeholder */
.login-input-group {
  margin-bottom: 20px;
}
.login-input-group .form-control {
  width: 100%;
  height: 48px;
  padding: 0 16px;
  border: 1.5px solid #e5e7eb;
  border-radius: 10px;
  font-size: 15px;
  background: #f9fafb;
  transition: all 0.2s;
  box-sizing: border-box;
}
.login-input-group .form-control:focus {
  outline: none;
  border-color: #2149dc;
  background: #fff;
  box-shadow: 0 0 0 3px rgba(33,73,220,0.1);
}
.login-input-group .form-control::placeholder {
  color: #9ca3af;
}

/* 错误提示 */
.invalid-feedback {
  font-size: 12px;
  color: #dc2626;
  margin-top: 6px;
  display: none;
}
.invalid-feedback.is-visible {
  display: block;
}
.login-feedback {
  text-align: center;
}

/* 登录按钮 */
.cim-login-button {
  width: 100%;
  height: 48px;
  box-shadow: 0 4px 12px rgba(33,73,220,0.3);
  background: #2149dc;
  letter-spacing: 4px;
  font-size: 16px;
  font-weight: 600;
  border: none;
  border-radius: 10px;
  color: #fff;
  cursor: pointer;
  transition: all 0.2s;
}
.cim-login-button:hover:not(:disabled) {
  background-color: rgba(72, 101, 231, 0.95);
  transform: translateY(-1px);
  box-shadow: 0 6px 16px rgba(33,73,220,0.4);
}
.cim-login-button:disabled {
  opacity: 0.7;
  cursor: not-allowed;
}

/* 版权信息 */
.cim-login-footer {
  text-align: center;
  margin-top: 24px;
  font-size: 12px;
  color: #9ca3af;
}

/* 左侧品牌横幅样式 */
.cim-login-banner {
  position: absolute;
  top: 0;
  left: 0;
  bottom: 0;
  width: 50%;
  background-repeat: no-repeat;
  background-size: cover;
  background-position: center;
  background-image: linear-gradient(to right, rgb(33 73 220), rgba(33,73,220,0.85));
  display: none;
  justify-content: center;
  align-items: center;
  z-index: 0;
}
.cim-login-banner-logo {
  width: 80px;
  height: 80px;
  border-radius: 20px;
  background: rgba(255,255,255,0.15);
  padding: 12px;
  margin-bottom: 24px;
  backdrop-filter: blur(10px);
}
.cim-login-sologin {
  color: #fff;
  font-size: 26px;
  text-align: center;
  font-weight: 700;
}
.cim-login-sologin .title {
  margin-bottom: 16px;
  font-size: 32px;
}
.cim-login-sologin .content {
  font-size: 18px;
  margin: 12px 18px;
  font-weight: 400;
  opacity: 0.9;
}
.cim-login-sologin .grap {
  display: flex;
  flex-wrap: nowrap;
  justify-content: center;
  margin-top: 32px;
}
.cim-login-banner-tag {
  display: inline-block;
  padding: 8px 20px;
  margin: 0 8px;
  background: rgba(255,255,255,0.15);
  border: 1px solid rgba(255,255,255,0.3);
  border-radius: 24px;
  font-size: 14px;
  color: #fff;
  backdrop-filter: blur(10px);
}

/* 响应式：大屏 >=1400px 显示左右分栏 */
@media (min-width: 1400px) {
  .cim-login-body {
    justify-content: flex-end;
    padding-right: 10%;
  }
  .cim-login-banner {
    display: flex;
  }
  .cim-login-right {
    max-width: 440px;
  }
}

/* 小屏适配 */
@media (max-width: 480px) {
  .cim-login-card {
    padding: 32px 24px 24px;
  }
  .cim-login-title h1 {
    font-size: 20px;
  }
}
</style>
