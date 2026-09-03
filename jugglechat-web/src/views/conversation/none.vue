<script setup>
import { reactive } from "vue";
const props = defineProps(['conversation']);
const emit = defineEmits(["ondraft"]);

let state = reactive({
});
</script>
<template>
  <div class="tyn-main tyn-chat-content aside-collapsed">
    <div class="tyn-chat-body tyn-chat-none-box">
      <div class="jg-chat-none-bg">
        <div class="intro-sub">
          <img src="/assets/images/empty-state.png" class="none-illustration" alt="乐享">
          <h1 class="intro-text">还没有消息</h1>
          <p class="intro-desc">选择一个会话，开始快乐的对话吧</p>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.none-illustration {
  width: 160px;
  height: 160px;
  margin-bottom: 12px;
  object-fit: contain;
}
.intro-text {
  font-size: 20px;
  font-weight: 600;
  color: #1e293b;
  margin: 0 0 6px;
}
.intro-desc {
  font-size: 14px;
  color: #94a3b8;
  margin: 0;
}
.intro-text {
  color: #f1f5f9;
}
.intro-desc {
  color: #64748b;
}
.jg-chat-none-bg {
  background-color: #1e293b;
}
</style>
