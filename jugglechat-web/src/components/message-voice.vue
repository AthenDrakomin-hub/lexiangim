<script setup>
import { reactive, ref, onUnmounted } from "vue";
import utils from "../common/utils";
import messageUtils from "./message-utils";

const props = defineProps(["message", "isRead"]);
const emit = defineEmits(["onrecall", "ontransfer", "onreply", "onreaction", "onpinned", "onfav", "onretry"]);

let state = reactive({
  isPlaying: false,
  currentTime: 0,
});
let audioEl = ref(null);
let audio = null;

function getDuration() {
  return props.message.content?.duration || 0;
}

function formatDuration(sec) {
  if (!sec) return '0"';
  return Math.round(sec) + '"';
}

function onPlay() {
  if (!props.message.content?.url) return;
  if (state.isPlaying) {
    audio.pause();
    state.isPlaying = false;
    return;
  }
  if (!audio) {
    audio = new Audio(props.message.content.url);
    audio.onended = () => {
      state.isPlaying = false;
      state.currentTime = 0;
    };
    audio.ontimeupdate = () => {
      state.currentTime = audio.currentTime;
    };
  }
  audio.currentTime = 0;
  audio.play();
  state.isPlaying = true;
}

function onRecall() {
  emit("onrecall", props.message);
}

function onRetry() {
  emit("onretry", { message: props.message });
}

onUnmounted(() => {
  if (audio) {
    audio.pause();
    audio = null;
  }
});
</script>

<template>
  <div class="tyn-reply-avatar">
    <div class="tyn-media jg-size-md">
      <div class="tyn-avatar tyn-s-avatar" :style="{ 'background-image': 'url(' + props.message.sender.portrait + ')' }"></div>
    </div>
  </div>
  <div class="tyn-reply-info">
    <div class="tyn-reply-content">
      <div class="jg-voice-message" :class="{ 'jg-voice-playing': state.isPlaying }" @click="onPlay">
        <div class="jg-voice-icon">
          <span v-if="!state.isPlaying" class="wr jg-icon-play"></span>
          <span v-else class="wr jg-icon-pause"></span>
        </div>
        <div class="jg-voice-wave">
          <span v-for="i in 5" :key="i" class="jg-voice-bar" :style="{ animationDelay: (i * 0.1) + 's' }"></span>
        </div>
        <div class="jg-voice-duration">{{ formatDuration(getDuration()) }}</div>
      </div>
      <div v-if="props.message.sentState == 3" class="jg-msg-retry" @click.stop="onRetry">
        <JgIcon name="retry" />
        <span>发送失败，点击重试</span>
      </div>
    </div>
  </div>
</template>

<style scoped>
.jg-voice-message {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 14px;
  background: var(--jg-bg-hover, #f3f4f6);
  border-radius: 12px;
  cursor: pointer;
  min-width: 120px;
  max-width: 200px;
  transition: background 0.15s ease;
}
.jg-voice-message:hover {
  background: var(--jg-bg-card, #e5e7eb);
}
.jg-voice-playing {
  background: var(--bs-primary, #5865f2);
  color: #fff;
}
.jg-voice-icon {
  width: 24px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}
.jg-voice-wave {
  display: flex;
  align-items: flex-end;
  gap: 2px;
  height: 20px;
  flex: 1;
}
.jg-voice-bar {
  width: 3px;
  background: currentColor;
  border-radius: 2px;
  animation: jg-voice-anim 0.8s ease-in-out infinite;
  animation-play-state: paused;
}
.jg-voice-playing .jg-voice-bar {
  animation-play-state: running;
}
.jg-voice-bar:nth-child(1) { height: 40%; }
.jg-voice-bar:nth-child(2) { height: 70%; }
.jg-voice-bar:nth-child(3) { height: 100%; }
.jg-voice-bar:nth-child(4) { height: 60%; }
.jg-voice-bar:nth-child(5) { height: 30%; }
@keyframes jg-voice-anim {
  0%, 100% { transform: scaleY(0.5); }
  50% { transform: scaleY(1); }
}
.jg-voice-duration {
  font-size: 12px;
  opacity: 0.8;
  flex-shrink: 0;
}
[data-bs-theme="dark"] .jg-voice-message {
  background: #374151;
}
[data-bs-theme="dark"] .jg-voice-message:hover {
  background: #4b5563;
}
</style>
