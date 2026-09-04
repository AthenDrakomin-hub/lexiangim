<script setup>
import utils from "../../common/utils";
import { useRouter } from "vue-router";
import im from "../../common/im";
import { CONTACT_TYPE, FRIEND_APPLY_STATUS, RESPONSE, EVENT_NAME } from "../../common/enum";
import { Friend } from "../../services";
import { reactive, getCurrentInstance } from "vue";
import emitter from "../../common/emmit";

let { ConversationType } = im.getCurrent();
const router = useRouter();
const props = defineProps(["current"]);
const emit = defineEmits(["onadded", "onremoved"]);
const context = getCurrentInstance();

function onConversation(){
  let { type, id, user } = props.current;
  if(utils.isEqual(type, CONTACT_TYPE.NEW_FRIEND)){
    id = user.user_id;
    type = CONTACT_TYPE.FRIEND;
  }
  
  if(utils.isEqual(type, CONTACT_TYPE.BOT)){
    type = CONTACT_TYPE.FRIEND;
  }

  // 先获取会话，再通过全局事件传递，避免hash模式下query参数被清除
  im.getCurrent().getConversation({ conversationType: type, conversationId: id }).then(({ conversation }) => {
    router.replace({ name: 'ConversationList' });
    setTimeout(() => {
      emitter.$emit(EVENT_NAME.ON_CONVERSATION_SEARCH_NAV, { conversation });
    }, 100);
  }).catch(() => {
    // 获取失败时直接跳转，用户可从列表选择
    router.replace({ name: 'ConversationList' });
  });
}
function onAddFriend(isAgree){
  let user = props.current.user;
  Friend.confirm({ sponsor_id: user.user_id, is_agree: isAgree }).then((result) => {
    let { code } = result;
    if(!utils.isEqual(code, RESPONSE.SUCCESS)){
      return context.proxy.$toast({
        text: `处理失败：${code}`,
        icon: 'error'
      });
    }
    context.proxy.$toast({
      text: isAgree ? `好友已添加` : `拒绝成功`,
      icon: 'success'
    });
    let _friend = {
      id: user.user_id,
      type: ConversationType.PRIVATE, 
      name: user.nickname, 
      avatar: user.avatar
    }
    emitter.$emit(EVENT_NAME.ON_ADDED_FRIEND, _friend);
    emit('onadded', { item: props.current })
  });
}

function onRemoveFriend(){
  let { id } = props.current;
  Friend.remove({ friendId: id }).then(({ code }) => {
    if(!utils.isEqual(code, RESPONSE.SUCCESS)){
      return context.proxy.$toast({
        text: `删除好友失败：${code}`,
        icon: 'error'
      });
    }
    context.proxy.$toast({
      text: '好友已删除',
      icon: 'success'
    });
    emit('onremoved', { item: props.current })
  });
}

// 备注编辑功能
const remarkState = reactive({
  isShowEdit: false,
  remark: ''
});

function onShowRemarkEdit(){
  remarkState.remark = props.current.remark || props.current.user?.nickname || '';
  remarkState.isShowEdit = true;
}

function onSaveRemark(){
  let { id, user } = props.current;
  let friendId = id || user?.user_id;
  Friend.updateRemark({ friend_id: friendId, remark: remarkState.remark }).then(({ code }) => {
    if(!utils.isEqual(code, RESPONSE.SUCCESS)){
      return context.proxy.$toast({ text: `保存备注失败：${code}`, icon: 'error' });
    }
    context.proxy.$toast({ text: '备注已保存', icon: 'success' });
    remarkState.isShowEdit = false;
    emitter.$emit(EVENT_NAME.ON_USER_INFO_UPDATE, { user: { ...user, remark: remarkState.remark } });
  }).catch(() => {
      return context.proxy.$toast({ text: `保存备注失败：${code}`, icon: 'error' });
  });
}
</script>
<template>
  <div class="tyn-main tyn-content-inner">
    <div class="contact-content">
      <div class="tyn-chat-head" v-if="!utils.isEmpty(props.current)">
        <div class="tyn-media-group">
          <div class="tyn-media jg-size-3xl tyn-conver-avatar" :style="{ 'background-image': 'url('+props.current.avatar+')' }"></div>
          <div class="tyn-media-col" v-if="utils.isEqual(props.current.type, CONTACT_TYPE.NEW_FRIEND)">
            <div class="tyn-media-row">
              <h3 class="name">{{ props.current.user.nickname }}</h3>
            </div>
            <div class="tyn-media-row has-dot-sap">
              <span class="meta">ID: {{ props.current.user.user_id }}</span>
            </div>
            <div class="tyn-media-row has-dot-sap" v-if="props.current.phone">
              <span class="meta">手机号: {{ props.current.phone }}</span>
            </div>
          </div>
          <div class="tyn-media-col" v-else>
            <div class="tyn-media-row">
              <h3 class="name">{{ props.current.name }}</h3>
            </div>
            <div class="tyn-media-row has-dot-sap">
              <span class="meta">ID: {{ props.current.id }}</span>
            </div>
            <div class="tyn-media-row has-dot-sap" v-if="props.current.phone">
              <span class="meta">手机号: {{ props.current.phone }}</span>
            </div>
          </div>
        </div>
        <div class="tyn-media-group">
          <div class="tyn-media-row">
            <div class="tyn-media-col" v-if="!utils.isEqual(props.current.type, CONTACT_TYPE.NEW_FRIEND) || (utils.isEqual(props.current.type, CONTACT_TYPE.NEW_FRIEND) && utils.isEqual(props.current.status, FRIEND_APPLY_STATUS.ACCEPTED))">
              <div class="wr jg-icon-message btn btn-light jg-size-md w-100 contact-send-msg" @click="onConversation">发起会话</div>
              <div class="wr jg-icon-edit btn btn-light jg-size-md w-100" @click="onShowRemarkEdit" v-if="utils.isEqual(props.current.type, ConversationType.PRIVATE)">设置备注</div>
              <div class="wr jg-icon-message btn btn-light jg-size-md w-100 jg-warn-bg" @click="onRemoveFriend" v-if="utils.isEqual(props.current.type, ConversationType.PRIVATE)" >删除好友</div>
            </div>
            <div class="tyn-media-col" v-else-if="!props.current.isOneSelf && utils.isEqual(props.current.status, FRIEND_APPLY_STATUS.APPLYING)">
              <div class="wr jg-icon-message btn btn-light jg-size-md w-100 contact-send-msg" @click="onAddFriend(true)">添加好友</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
  <!-- 备注编辑弹窗 -->
  <div class="jg-modal-overlay" v-if="remarkState.isShowEdit" @click.self="remarkState.isShowEdit = false">
    <div class="jg-modal-container" style="max-width:400px;">
      <div class="jg-modal-header">
        <div class="jg-modal-title">设置备注</div>
        <button class="jg-modal-close" @click="remarkState.isShowEdit = false">✕</button>
      </div>
      <div class="jg-modal-body">
        <input type="text" class="jg-modal-input" v-model="remarkState.remark" placeholder="请输入备注名" maxlength="20" />
      </div>
      <div class="jg-modal-footer">
        <button class="jg-modal-btn jg-modal-btn-cancel" @click="remarkState.isShowEdit = false">取消</button>
        <button class="jg-modal-btn jg-modal-btn-confirm" @click="onSaveRemark">保存</button>
      </div>
    </div>
  </div>
</template>