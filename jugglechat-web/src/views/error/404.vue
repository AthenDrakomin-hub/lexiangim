<script setup>
import { useRouter } from "vue-router";
const router = useRouter();
function goHome() {
  router.replace({ name: 'ConversationList' });
}
</script>

<template>
  <div class="error-404-page">
    <div class="error-404-content">
      <img src="/assets/images/404-illustration.png" class="error-404-illustration" alt="页面走丢了">
      <h1 class="error-404-code">404</h1>
      <p class="error-404-title">走丢了？</p>
      <p class="error-404-desc">回到乐享，继续快乐聊天吧</p>
      <button class="error-404-btn" @click="goHome">返回首页</button>
    </div>
  </div>
</template>

<style scoped>
.error-404-page {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 100vh;
  background: linear-gradient(180deg, #eff6ff 0%, #ffffff 100%);
}

/* 深色模式 404 页面背景 */
[data-bs-theme="dark"] .error-404-page {
  background: linear-gradient(180deg, #0d1117 0%, #161b22 100%);
}

.error-404-content {
  text-align: center;
  padding: 40px;
}

.error-404-illustration {
  width: 200px;
  height: 200px;
  margin-bottom: 16px;
  object-fit: contain;
}

.error-404-code {
  font-size: 72px;
  font-weight: 800;
  color: #2563EB;
  margin: 0;
  line-height: 1;
}

.error-404-title {
  font-size: 22px;
  font-weight: 600;
  color: #1e293b;
  margin: 12px 0 6px;
}

/* 深色模式 404 标题 */
[data-bs-theme="dark"] .error-404-title {
  color: var(--jg-text-body);
}

.error-404-desc {
  font-size: 14px;
  color: #64748b;
  margin: 0 0 28px;
}

/* 深色模式 404 描述 */
[data-bs-theme="dark"] .error-404-desc {
  color: var(--jg-text-muted);
}
.error-404-btn {
  padding: 12px 36px;
  background: #2563EB;
  color: #fff;
  border: none;
  border-radius: 10px;
  font-size: 15px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
}
.error-404-btn:hover {
  background: #1d4ed8;
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(37, 99, 235, 0.3);
}
.error-404-btn:active {
  transform: translateY(0);
}
</style>
