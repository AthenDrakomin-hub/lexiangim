<script setup>
import { reactive, watch, getCurrentInstance } from "vue";
import utils from "../common/utils";
import common from "../common/common";
import emitter from "../common/emmit";
import Asider from "./aside.vue";
import im from "../common/im";
import { User, Friend } from "../services/index";
import { RESPONSE, STORAGE } from "../common/enum";
import Storage from "../common/storage";

const context = getCurrentInstance();
const props = defineProps(["isShow"]);
const emit = defineEmits(["oncancel"]);
let juggle = im.getCurrent();
let state = reactive({
  keyword: '',
  users: []
});
function onCancel() {
  emit('oncancel', {});
}
function onSearch() {
  let { keyword } = state;
  if (utils.isEmpty(keyword)) {
    return state.errorMsg = '搜索内容不能为空';
  }
  User.search({ keyword }).then((result) => {
    let { code, data } = result;
    if(!utils.isEqual(code, RESPONSE.SUCCESS)){
      utils.extend(state, { errorMsg: '没有找到用户', users: [] });
      return;
    }
    let { items } = data;
    let users = utils.map(items, (item) => {
      let { avatar, nickname } = item;
      item.avatar = avatar || common.getTextAvatar(nickname);
      return item;
    });
    utils.extend(state, { users });
  });
}
function onAdd(_user){
  if(_user.is_friend){
    return;
  }
  utils.extend(state, { keyword: '', users: [] });
  let friend = { friendId: _user.user_id };
  let user = Storage.get(STORAGE.USER_TOKEN);
  Friend.add(friend).then((result) => {
    let { code } = result;
    if(!utils.isEqual(code, RESPONSE.SUCCESS)){
      return context.proxy.$toast({
        text: `添加好友失败：${code}`,
        icon: 'error'
      });
    }
    context.proxy.$toast({
      text: `已发送好友添加请求`,
      icon: 'success'
    });
    setTimeout(() => {
      emit('oncancel', {});
    }, 200);
  });
}

function onInput(){
  state.errorMsg = '';
  if(utils.isEqual(0, state.keyword.length)){
    state.users = [];
  }
}
watch(() => props.isShow, () => {
  if(!props.isShow){
    utils.extend(state, { users: [], keyword: '' })
  }
});

</script>

<template>
  <Asider :is-show="props.isShow" :title="'添加好友'" @oncancel="onCancel">
    <div class="jg-aside-friend-body">
      <div class="tyn-aside-search">
        <div class="form-group tyn-pill">
          <div class="form-control-wrap">
            <div class="form-control-icon start wr jg-icon-search"></div>
            <input type="search" class="form-control form-control-solid" placeholder="输入账号/昵称/手机号搜索好友"
              @keydown.enter.self="onSearch" v-model="state.keyword" @input="onInput"/>
            <label class="form-label" for="email-address">
              <span class="small ms-2 text-danger">{{ state.errorMsg }}</span>
            </label>
          </div>
        </div>
      </div>
      <div class="form-check form-check-algin">
        <div class="form-check-label" v-for="user in state.users">
          <div class="tyn-media-group">
            <div class="tyn-media jg-size-md tyn-conver-avatar"
              :style="{ 'background-image': 'url(' + user.avatar + ')' }">
            </div>
            <div class="tyn-media-col">
              <div class="tyn-media-row m-friend-name">
                <h6 class="name">{{ user.nickname }}</h6>
              </div>
            </div>
            <div class="tyn-media-col">
              <div class="tyn-media-row m-friend-add-btn" @click.stop="onAdd(user)">
                <div class="wr" :class="[user.is_friend ? 'jg-icon-success' : 'jg-icon-add']"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </Asider>
</template>
