<script setup>
import { reactive } from "vue";
import { useRouter } from "vue-router";
import Storage from "../../common/storage";
import { STORAGE } from "../../common/enum";

const router = useRouter();

const state = reactive({
  orgCode: '',
  errorMsg: '',
  loading: false
});

function onInput() {
  state.errorMsg = '';
}

async function onEnter() {
  const code = state.orgCode.trim();
  if (!code) {
    state.errorMsg = '请输入企业码';
    return;
  }
  state.loading = true;
  state.errorMsg = '';
  try {
    const res = await fetch('/jim/serverinfos?no=' + encodeURIComponent(code));
    if (!res.ok) throw new Error('http error');
    const data = await res.json();

    if (data.code !== 0 || !data.data?.server_info_plain) {
      state.errorMsg = '企业码无效，请检查后重试';
      return;
    }

    let serverInfo = {};
    try {
      serverInfo = JSON.parse(data.data.server_info_plain);
    } catch (e) {
      state.errorMsg = '获取配置失败，请重试';
      return;
    }

    if (!serverInfo.app_key) {
      state.errorMsg = '企业码无效';
      return;
    }

    Storage.set(STORAGE.SERVER_SETTING, {
      appkey: serverInfo.app_key,
      server: serverInfo.im_servers?.[0] || 'ws://127.0.0.1:9003'
    });
    await router.push({ name: 'Login' });
  } catch (e) {
    state.errorMsg = '网络连接失败，请检查服务是否启动';
  } finally {
    state.loading = false;
  }
}
</script>

<template>
  <div class="lx-page lx-invite-page">
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

    <div class="lx-main">
      <!-- 顶部 Logo + 标题 -->
      <div class="lx-header">
        <div class="lx-logo-row">
          <div class="lx-logo-icon">
            <svg viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M24 4C12.95 4 4 11.85 4 21.5C4 27.3 7.2 32.4 12 35.6V44L17.5 40.5C19.5 41.1 21.7 41.5 24 41.5C35.05 41.5 44 33.65 44 24C44 14.35 35.05 4 24 4Z" fill="white"/>
              <circle cx="17" cy="20" r="2.5" fill="#0d4f4f"/>
              <circle cx="31" cy="20" r="2.5" fill="#0d4f4f"/>
              <path d="M16 27C18 30 21 31.5 24 31.5C27 31.5 30 30 32 27" stroke="#0d4f4f" stroke-width="2.5" stroke-linecap="round"/>
            </svg>
          </div>
          <span class="lx-logo-text">乐享</span>
        </div>
        <h1 class="lx-title">请输入企业码</h1>
        <p class="lx-subtitle">接入企业专属通讯空间</p>
      </div>

      <!-- 毛玻璃卡片 -->
      <div class="lx-card">
        <p class="lx-card-label">请填写企业码</p>
        <div class="lx-input-wrap">
          <input
            type="text"
            class="lx-input"
            v-model="state.orgCode"
            placeholder="请填写企业码"
            @input="onInput()"
            @keydown.enter="onEnter()"
          >
        </div>
        <p class="lx-card-hint">企业码由管理员下发</p>
        <p class="lx-error" v-if="state.errorMsg">{{ state.errorMsg }}</p>
        <a
          class="lx-btn"
          :class="{ 'lx-btn-loading': state.loading }"
          @click="onEnter()"
        >
          {{ state.loading ? '验证中...' : '确认进入' }}
        </a>
        <p class="lx-card-footer">不清楚企业码？联系企业管理员</p>
      </div>
    </div>
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
.lx-bubble-1 { width: 90px; height: 90px; top: 8%; left: 5%; }
.lx-bubble-2 { width: 50px; height: 50px; top: 15%; right: 12%; }
.lx-bubble-3 { width: 120px; height: 120px; top: 35%; right: -30px; opacity: 0.6; }
.lx-bubble-4 { width: 40px; height: 40px; bottom: 25%; left: 8%; }
.lx-bubble-5 { width: 70px; height: 70px; bottom: 10%; right: 15%; }
.lx-bubble-6 { width: 30px; height: 30px; top: 50%; left: 3%; }

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
  margin-bottom: 36px;
}
.lx-logo-row {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  margin-bottom: 24px;
}
.lx-logo-icon {
  width: 44px;
  height: 44px;
  display: flex;
  align-items: center;
  justify-content: center;
}
.lx-logo-icon svg {
  width: 100%;
  height: 100%;
}
.lx-logo-text {
  font-size: 32px;
  font-weight: 700;
  color: #ffffff;
  letter-spacing: 2px;
}
.lx-title {
  font-size: 36px;
  font-weight: 800;
  color: #ffffff;
  margin: 0 0 10px;
  letter-spacing: 2px;
  text-shadow: 0 2px 12px rgba(0,0,0,0.2);
}
.lx-subtitle {
  font-size: 17px;
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
  border-radius: 28px;
  padding: 40px 32px 32px;
  box-shadow: 0 16px 48px rgba(0,0,0,0.2), inset 0 1px 0 rgba(255,255,255,0.3);
  text-align: center;
}
.lx-card-label {
  font-size: 22px;
  font-weight: 600;
  color: #ffffff;
  margin: 0 0 20px;
}
.lx-input-wrap {
  margin-bottom: 16px;
}
.lx-input {
  width: 100%;
  height: 54px;
  border-radius: 16px;
  border: none;
  background: rgba(255,255,255,0.95);
  padding: 0 20px;
  font-size: 17px;
  color: #1a3a3a;
  text-align: center;
  letter-spacing: 3px;
  box-shadow: 0 4px 16px rgba(0,0,0,0.1);
  transition: all 0.25s ease;
  box-sizing: border-box;
}
.lx-input::placeholder {
  color: #9ca3af;
  letter-spacing: 1px;
}
.lx-input:focus {
  outline: none;
  box-shadow: 0 0 0 3px rgba(0,201,167,0.4), 0 4px 16px rgba(0,0,0,0.1);
  transform: translateY(-1px);
}
.lx-card-hint {
  font-size: 15px;
  color: rgba(255,255,255,0.75);
  margin: 0 0 28px;
}
.lx-error {
  font-size: 13px;
  color: #ff8a80;
  margin: 0 0 12px;
  min-height: 18px;
}
.lx-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 56px;
  border-radius: 28px;
  background: linear-gradient(135deg, #5eead4 0%, #2dd4bf 50%, #14b8a6 100%);
  color: #0d3d3d;
  font-size: 20px;
  font-weight: 700;
  letter-spacing: 4px;
  border: none;
  cursor: pointer;
  box-shadow: 0 6px 24px rgba(20,184,166,0.5), inset 0 1px 0 rgba(255,255,255,0.5);
  transition: all 0.25s ease;
  text-decoration: none;
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
.lx-card-footer {
  font-size: 14px;
  color: rgba(255,255,255,0.7);
  margin: 20px 0 0;
}
</style>
