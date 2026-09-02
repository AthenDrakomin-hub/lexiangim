<script setup>
import { reactive, watch, getCurrentInstance } from "vue";
import utils from "../common/utils";
import common from "../common/common";
import emitter from "../common/emmit";
import Asider from "./aside.vue";
import im from "../common/im";
import { User } from "../services/index";
import { RESPONSE, STORAGE, EVENT_NAME } from "../common/enum";
import Storage from "../common/storage";

const props = defineProps(["isShow", "disabledClose"]);
const emit = defineEmits(["oncancel", "onconfirm"]);
const { proxy } = getCurrentInstance();
let avatars = common.getAvatars();

let current = { };
let user = Storage.get(STORAGE.USER_TOKEN);
avatars = utils.map(avatars, (url) => {
  let isSelected = utils.isEqual(url, user.portrait);
  let _avatar = { url, isSelected };
  if(isSelected){
    current = _avatar;
  }
  return _avatar;
});
if(utils.isEmpty(current)){
  current = avatars[0];
  current.isSelected = true;
}

let state = reactive({
  avatars: avatars,
  current: current,
  username: user.name || '',
  signature: user.signature || user.motto || '',
  isNameError: false,
  isUploading: false,
});

function onCancel(){
  emit('oncancel', {});
}

let isSaveingUser = false;
function onConfirm(){
  let { current, username, signature } = state;
  if (utils.isEmpty(username)) {
    return state.isNameError = true;
  }
  let { id } = user;

  if(isSaveingUser){
    return;
  }
  isSaveingUser = true;
  let _user = { id, portrait: current.url, name: username, signature: signature };
  User.update(_user).then((result) => {
    isSaveingUser = false;
    if(!utils.isEqual(result.code, RESPONSE.SUCCESS)){
      let errorCode = result.code;
      return proxy.$toast({
        text: `保存失败：${errorCode}`,
        icon: 'error'
      });
    }
    
    let existUser = Storage.get(STORAGE.USER_TOKEN);
    existUser = utils.extend(existUser, _user);
    Storage.set(STORAGE.USER_TOKEN, existUser);
    emitter.$emit(EVENT_NAME.ON_USER_INFO_UPDATE, { user: existUser });

    proxy.$toast({
      text: '保存成功',
      icon: 'success'
    });
    onCancel();
  });
}

function onSelected(avatar){
  let list = utils.map(state.avatars, (_avatar) => {
    _avatar.isSelected = utils.isEqual(_avatar.url, avatar.url);
    return _avatar;
  });
  utils.extend(state, { current: avatar, avatars: list });
}
function onNameInput(){
  state.isNameError = false;
}

// 上传自定义头像
function onUploadAvatar(e) {
  const file = e.target.files[0];
  if (!file) return;
  
  // 文件类型校验
  if (!file.type.match(/^image\/(png|jpeg|jpg|gif|webp)$/)) {
    proxy.$toast({ text: '请选择图片文件', icon: 'error' });
    return;
  }
  // 文件大小校验（最大5MB）
  if (file.size > 5 * 1024 * 1024) {
    proxy.$toast({ text: '图片大小不能超过5MB', icon: 'error' });
    return;
  }

  state.isUploading = true;
  const reader = new FileReader();
  reader.onload = (event) => {
    const base64 = event.target.result;
    // 调用上传接口
    common.uploadBase64(base64, file.type).then((url) => {
      state.isUploading = false;
      if (url) {
        // 添加到头像列表并选中
        const newAvatar = { url, isSelected: true };
        state.avatars.unshift(newAvatar);
        state.current = newAvatar;
        // 更新其他头像的选中状态
        state.avatars.forEach((a, idx) => {
          if (idx > 0) a.isSelected = false;
        });
        proxy.$toast({ text: '头像上传成功', icon: 'success' });
      } else {
        proxy.$toast({ text: '头像上传失败', icon: 'error' });
      }
    }).catch(() => {
      state.isUploading = false;
      proxy.$toast({ text: '头像上传失败', icon: 'error' });
    });
  };
  reader.readAsDataURL(file);
  // 清空input，允许重复选择同一文件
  e.target.value = '';
}

</script>

<template>
  <Asider :is-show="props.isShow" :title="'修改信息'" @oncancel="onCancel" :disabled-close="props.disabledClose">
    <div class="jg-aside-userupdate-body">
      <div class="form-group">
        <label class="form-label">昵称</label>
        <input type="text" class="form-control" :class="{'form-control-warn': state.isNameError}" placeholder="输入昵称" v-model="state.username" @input="onNameInput()">
      </div>
      <div class="form-group">
        <label class="form-label">个性签名</label>
        <input type="text" class="form-control" placeholder="输入个性签名（选填）" v-model="state.signature" maxlength="50">
      </div>
      <div class="form-group form-avatars">
        <label class="form-label">选择头像</label>
        <div class="form-avatars-grid">
          <div class="form-avatar wr" @click.stop="onSelected(avatar)" :class="{'jg-icon-mark form-avatar-selected': avatar.isSelected}" v-for="avatar in state.avatars" :style="{ 'background-image': 'url(' + avatar.url + ')' }"></div>
          <!-- 上传自定义头像按钮 -->
          <label class="form-avatar form-avatar-upload" :class="{ 'form-avatar-uploading': state.isUploading }">
            <input type="file" accept="image/png,image/jpeg,image/jpg,image/gif,image/webp" @change="onUploadAvatar" style="display:none;">
            <span v-if="!state.isUploading" class="form-avatar-upload-icon">+</span>
            <span v-else class="form-avatar-upload-loading">...</span>
          </label>
        </div>
      </div>
      <div class="form-group">
        <div class="form-control-wrap">
          <a class="btn btn-primary-soft w-100" @click="onConfirm()">保存</a>
        </div>
      </div>
    </div>
  </Asider>
</template>

<style scoped>
.form-label {
  display: block;
  font-size: 14px;
  color: #666;
  margin-bottom: 8px;
  font-weight: 500;
}
.form-avatars-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 12px;
}
.form-avatar {
  width: 100%;
  aspect-ratio: 1;
  border-radius: 12px;
  background-size: cover;
  background-position: center;
  cursor: pointer;
  border: 2px solid transparent;
  transition: all 0.2s ease;
  position: relative;
}
.form-avatar:hover {
  transform: scale(1.05);
}
.form-avatar-selected {
  border-color: #2563EB;
  box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.2);
}
.form-avatar-upload {
  display: flex;
  align-items: center;
  justify-content: center;
  background: #f5f5f5;
  border: 2px dashed #ddd;
  cursor: pointer;
}

/* 深色模式头像上传 */
[data-bs-theme="dark"] .form-avatar-upload {
  background: var(--jg-bg-input);
  border-color: var(--jg-border);
}

.form-avatar-upload:hover {
  border-color: #2563EB;
  background: #f0f7ff;
}

/* 深色模式头像上传悬停 */
[data-bs-theme="dark"] .form-avatar-upload:hover {
  background: var(--jg-bg-hover);
}

.form-avatar-upload-icon {
  font-size: 32px;
  color: #999;
  font-weight: 300;
}

/* 深色模式上传图标 */
[data-bs-theme="dark"] .form-avatar-upload-icon {
  color: var(--jg-text-muted);
}
.form-avatar-uploading {
  border-color: #2563EB;
  background: #f0f7ff;
}
.form-avatar-upload-loading {
  font-size: 24px;
  color: #2563EB;
  animation: pulse 1s infinite;
}
@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.5; }
}
</style>
