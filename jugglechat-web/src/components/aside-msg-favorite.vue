<script setup>
import { reactive, watch, nextTick, getCurrentInstance, ref } from "vue";
import utils from "../common/utils";
import common from "../common/common";
import emitter from "../common/emmit";
import Asider from "./aside.vue";
import im from "../common/im";
import { User } from "../services/index";
import { RESPONSE, STORAGE, EVENT_NAME } from "../common/enum";
import Storage from "../common/storage";

import Text from './message-text.vue';
import File from './message-file.vue';
import ImageMessage from './message-image.vue';
import Video from './message-video.vue';
import Merge from './message-merge.vue';

const props = defineProps(["isShow", "right"]);
const emit = defineEmits(["oncancel"]);
const { proxy } = getCurrentInstance();
const favmsgs = ref(null);
let juggle = im.getCurrent();
let { MessageType } = juggle;

let state = reactive({
  list: [],
  offset: '',
  limit: 20,
  hasMore: true,
  isPlaying: false,
  isLoading: false
});

function onCancel(){
  emit('oncancel', {});
}

let isFetching = false;
let canscroll = true;
function getMessages(params){
  if(isFetching){
    return;
  }
  if(!state.hasMore){
    return proxy.$toast({ text: `没有更多啦`, icon: 'warn' });
  }
  isFetching = true;
  state.isLoading = true;
  let { limit, offset } = params;
  let { list } = state;
  juggle.getFavoriteMessages(params).then((result) => {
    let _list = result.list || [];
    let hasMore = _list.length >= limit;
    state.list = list.concat(_list);
    utils.extend(state, { offset:result.offset, hasMore });
    isFetching = false;
    state.isLoading = false;
    canscroll = true;
  }, () => {
    isFetching = false;
    state.isLoading = false;
  })
}

function onRemove(message, index){
  let { sender, conversationType, conversationId, messageId } = message;
  juggle.removeFavoriteMessages({
    messages: [{ 
      conversationType: conversationType,
      conversationId: conversationId,
      messageId: messageId,
      senderId: sender.id,
    }]
  }).then((result) => {
    state.list.splice(index, 1);
    proxy.$toast({ text: '已取消收藏', icon: 'success' });
  }, (error) => {
    proxy.$toast({ text: `取消收藏失败: ${error.code}`, icon: 'error' });
  });
}
function onPlay() {
  let { isPlaying } = state;
  if (isPlaying) {
    video.pause();
  } else {
    video.play();
  }
  utils.extend(state, { isPlaying: !isPlaying });
}

nextTick(() => {
  if (favmsgs.value) {
    favmsgs.value.addEventListener("scroll", () => {
      let scrollTop = favmsgs.value.scrollTop;
      let scrollHeight = favmsgs.value.scrollHeight;
      let rectHeight = favmsgs.value.getBoundingClientRect().height;
      let isNeedLoad = scrollHeight - scrollTop - rectHeight < 100;
      if (isNeedLoad && canscroll) {
        canscroll = false;
        let { offset, limit } = state;
        getMessages({ offset, limit });
      }
    });
  }
});

watch(() => props.isShow, () => {
  if(props.isShow){
    let { offset, limit } = state;
    getMessages({ offset, limit });
  }else{
    utils.extend(state, { list: [], offset: '', hasMore: true });
  }
})

</script>

<template>
  <Asider :is-show="props.isShow" :title="'我的收藏'" :right="props.right" @oncancel="onCancel">
    <div class="jg-aside-favorite-body">
      <!-- 空状态 -->
      <div class="jg-empty-state" v-if="state.list.length === 0 && !state.isLoading">
        <div class="jg-empty-icon">⭐</div>
        <div class="jg-empty-title">暂无收藏</div>
        <div class="jg-empty-desc">在聊天中长按消息，选择收藏即可保存到这里</div>
      </div>
      <!-- 加载中 -->
      <div class="jg-loading-state" v-if="state.isLoading && state.list.length === 0">
        <div class="jg-loading-spinner"></div>
        <div class="jg-loading-text">加载中...</div>
      </div>
      <!-- 收藏列表 -->
      <ul class="jg-fav-list" ref="favmsgs" v-if="state.list.length > 0">
        <li class="jg-fav-item" v-for="(item, index) in state.list">
          <div class="jg-fav-msg" v-if="utils.isEqual(item.message.name, MessageType.TEXT)">
            <div class="jg-fav-msg-text">{{ item.message.content.content }}</div>
            <ul class="jg-fav-tools">
              <li class="jg-fav-tool wr jg-icon-delete warn" @click.stop="onRemove(item.message, index)"></li>
            </ul>
          </div>
          <div class="jg-fav-msg" v-if="utils.isEqual(item.message.name, MessageType.IMAGE)">
            <img :src="item.message.content.thumbnail" class="tyn-image fadein-o" alt/>
            <ul class="jg-fav-tools">
              <li class="jg-fav-tool wr jg-icon-delete warn" @click.stop="onRemove(item.message, index)"></li>
            </ul>
          </div>
          <div class="jg-fav-msg" v-if="utils.isEqual(item.message.name, MessageType.FILE)">
            <a :href="item.message.content.url" class="jg-file" :download="item.message.content.name">
              <div class="tyn-media-group">
                <div class="tyn-media jg-size-lg text-bg-light wr jg-icon-file tyb-msg-fileicon">
                </div>
                <div class="tyn-media-col">
                  <h6 class="name">{{ item.message.content.name }}</h6>
                  <div class="meta">{{ (Number(item.message.content.size) || 0).toFixed(2) }} KB</div>
                </div>
              </div>
            </a>
            <ul class="jg-fav-tools">
              <li class="jg-fav-tool wr jg-icon-delete warn" @click.stop="onRemove(item.message, index)"></li>
            </ul>
          </div>
          <div class="jg-fav-msg" v-if="utils.isEqual(item.message.name, MessageType.VIDEO)">
            <a class="glightbox" data-gallery="media-video">
              <video :src="item.message.content.url" class="tyn-image" controls></video>
            </a>
            <ul class="jg-fav-tools">
              <li class="jg-fav-tool wr jg-icon-delete warn" @click.stop="onRemove(item.message, index)"></li>
            </ul>
          </div>
          <div class="jg-fav-msg" v-if="utils.isEqual(item.message.name, MessageType.MERGE)">
            <div class="tyn-reply-merge">
              <div class="tyn-media-row">
                <span class="tyn-msg-mergetitle">{{ item.message.content.title }}</span>
              </div>
              <div class="tyn-media-row tyn-msg-merge-list" v-for="preview in item.message.content.previewList">
                <span class="sender">{{ preview.senderName }}:</span>
                <span class="message">{{ preview.content }}</span>
              </div>
            </div>
            <ul class="jg-fav-tools">
              <li class="jg-fav-tool wr jg-icon-delete warn" @click.stop="onRemove(item.message, index)"></li>
            </ul>
          </div>
          <div class="jg-fav-info">
            <div class="jg-fav-title">
              <div class="tyn-avatar tyn-s-avatar jg-fav-avatar" :style="{ 'background-image': 'url(' + item.message.sender.portrait + ')' }"></div>
              <div class="jg-fav-label jg-ellipsis">{{ item.message.sender.name }} 来自 {{ item.message.conversationTitle }}</div>
            </div>
            <div class="jg-fav-time">{{ utils.formatTime(item.message.sentTime, 'MM-dd hh:mm') }}</div>
          </div>
        </li>
      </ul>
      <!-- 加载更多 -->
      <div class="jg-load-more" v-if="state.isLoading && state.list.length > 0">
        <div class="jg-loading-spinner"></div>
        <span>加载更多...</span>
      </div>
    </div>
  </Asider>
</template>

<style scoped>
.jg-empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 60px 20px;
  text-align: center;
}
.jg-empty-icon {
  font-size: 48px;
  margin-bottom: 16px;
  opacity: 0.6;
}
.jg-empty-title {
  font-size: 16px;
  font-weight: 600;
  color: #333;
  margin-bottom: 8px;
}

/* 深色模式空状态标题 */
[data-bs-theme="dark"] .jg-empty-title {
  color: var(--jg-text-body);
}

.jg-empty-desc {
  font-size: 13px;
  color: #999;
  line-height: 1.6;
  max-width: 240px;
}

/* 深色模式空状态描述 */
[data-bs-theme="dark"] .jg-empty-desc {
  color: var(--jg-text-muted);
}

.jg-loading-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 60px 20px;
}

.jg-loading-spinner {
  width: 24px;
  height: 24px;
  border: 2px solid #f0f0f0;
  border-top-color: #2563EB;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
  margin-bottom: 12px;
}

/* 深色模式加载旋转器 */
[data-bs-theme="dark"] .jg-loading-spinner {
  border-color: var(--jg-border);
}

.jg-loading-text {
  font-size: 13px;
  color: #999;
}

/* 深色模式加载文本 */
[data-bs-theme="dark"] .jg-loading-text {
  color: var(--jg-text-muted);
}

.jg-load-more {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 16px;
  gap: 8px;
  font-size: 13px;
  color: #999;
}

/* 深色模式加载更多 */
[data-bs-theme="dark"] .jg-load-more {
  color: var(--jg-text-muted);
}
.jg-load-more .jg-loading-spinner {
  width: 16px;
  height: 16px;
  margin-bottom: 0;
}
@keyframes spin {
  to { transform: rotate(360deg); }
}
</style>
