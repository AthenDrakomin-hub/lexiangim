<script setup>
import { reactive, watch, getCurrentInstance } from "vue";
import utils from "../common/utils";
import { Group, User } from "../services";
import Storage from "../common/storage";
import { STORAGE, RESPONSE } from "../common/enum";
import Asider from "./aside.vue";

const props = defineProps(["isShow", "right", "title", "desc", "isGroup", "uid"]);
const emit = defineEmits(["oncancel", "onfinish"]);
const { proxy } = getCurrentInstance();

let state = reactive({
  qrcode: '',
  isLoading: false,
  isError: false
});
function onCancel() {
  emit('oncancel', {});
}
function handler(result){
  state.isLoading = false;
  let { code, data } = result;
  if(!utils.isEqual(code, RESPONSE.SUCCESS)){
    state.isError = true;
    return proxy.$toast({
      text: `获取二维码失败 ${code}`,
      icon: 'error'
    });
  }
  let { qr_code } = data;
  state.qrcode = qr_code;
  state.isError = false;
}
function getQrCode(){
  state.isLoading = true;
  state.isError = false;
  let { uid } = props;
  if(props.isGroup){
    return Group.getQrCode({ group_id: uid }).then(handler).catch(() => {
      state.isLoading = false;
      state.isError = true;
    });
  }
  User.getCurrentQRCode().then(handler).catch(() => {
    state.isLoading = false;
    state.isError = true;
  });
}
watch(() => props.isShow, () => {
  if(props.isShow){
    getQrCode();
  }else{
    state.qrcode = '';
    state.isLoading = false;
    state.isError = false;
  }
});

</script>

<template>
  <Asider :is-show="props.isShow" :title="props.title" @oncancel="onCancel" :right="props.right">
    <div class="jg-aside-qrcode-body">
      <!-- 加载中 -->
      <div class="jg-qrcode-loading" v-if="state.isLoading">
        <div class="jg-loading-spinner"></div>
        <div class="jg-loading-text">二维码生成中...</div>
      </div>
      <!-- 错误状态 -->
      <div class="jg-qrcode-error" v-else-if="state.isError">
        <div class="jg-error-icon">⚠️</div>
        <div class="jg-error-text">二维码获取失败</div>
        <a class="btn btn-primary-soft" @click="getQrCode()">重新获取</a>
      </div>
      <!-- 二维码 -->
      <template v-else>
        <div class="jg-aside-qrcode-img" :style="{ 'background-image': 'url(data:image/png;base64,' + state.qrcode + ')' }" v-if="state.qrcode">
          <div class="jg-nlogin-icon"></div>
        </div>
        <div class="jg-aside-qrcode-desc">{{ props.desc }}</div>
      </template>
    </div>
  </Asider>
</template>

<style scoped>
.jg-aside-qrcode-body {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 40px 20px;
}
.jg-aside-qrcode-img {
  width: 200px;
  height: 200px;
  background-size: contain;
  background-position: center;
  background-repeat: no-repeat;
  border: 1px solid #eee;
  border-radius: 8px;
  margin-bottom: 16px;
  position: relative;
}
.jg-aside-qrcode-desc {
  font-size: 14px;
  color: #666;
  text-align: center;
}
.jg-qrcode-loading, .jg-qrcode-error {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 60px 20px;
  text-align: center;
}
.jg-loading-spinner {
  width: 32px;
  height: 32px;
  border: 3px solid #f0f0f0;
  border-top-color: #2563EB;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
  margin-bottom: 16px;
}
.jg-loading-text {
  font-size: 14px;
  color: #999;
}
.jg-error-icon {
  font-size: 48px;
  margin-bottom: 16px;
}
.jg-error-text {
  font-size: 14px;
  color: #666;
  margin-bottom: 20px;
}
@keyframes spin {
  to { transform: rotate(360deg); }
}
</style>
