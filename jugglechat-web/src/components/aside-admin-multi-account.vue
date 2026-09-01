<template>
  <Asider :isShow="isShow" title="账号多开" @oncancel="onCancel">
    <div class="admin-multi-account">
      <div class="section-header">
        <span class="title">已保存账号</span>
        <button class="btn-add" @click="showAddDialog = true">+ 添加账号</button>
      </div>
      <div v-if="accounts.length === 0" class="empty-tip">
        <p>暂无多开账号</p>
        <p class="sub">点击右上角添加账号，实现快速切换</p>
      </div>
      <div v-else class="account-list">
        <div v-for="acc in accounts" :key="acc.sub_user_id" class="account-item" :class="{ active: acc.is_current }">
          <div class="account-avatar">
            <img v-if="acc.avatar" :src="acc.avatar" alt="" />
            <span v-else>{{ acc.nickname ? acc.nickname.charAt(0) : '?' }}</span>
          </div>
          <div class="account-info">
            <div class="nickname">{{ acc.nickname || acc.sub_user_id }}</div>
            <div class="user-id">ID: {{ acc.sub_user_id }}</div>
            <div v-if="acc.is_current" class="current-tag">当前使用</div>
          </div>
          <div class="account-actions">
            <button v-if="!acc.is_current" class="btn-switch" @click="onSwitch(acc)">切换</button>
            <button class="btn-remove" @click="onRemove(acc)">移除</button>
          </div>
        </div>
      </div>
    </div>

    <!-- 添加账号弹窗 -->
    <div v-if="showAddDialog" class="dialog-mask" @click.self="showAddDialog = false">
      <div class="dialog-box">
        <div class="dialog-title">添加多开账号</div>
        <div class="dialog-body">
          <div class="form-item">
            <label>用户ID</label>
            <input v-model="addForm.userId" type="text" placeholder="请输入用户ID" />
          </div>
          <div class="form-item">
            <label>登录Token</label>
            <textarea v-model="addForm.token" placeholder="请输入登录Token（从该账号登录后获取）" rows="3"></textarea>
          </div>
          <p class="tip">提示：Token可在目标账号登录后，从浏览器开发者工具的LocalStorage中获取</p>
        </div>
        <div class="dialog-footer">
          <button class="btn-cancel" @click="showAddDialog = false">取消</button>
          <button class="btn-confirm" @click="onAdd" :disabled="adding">
            {{ adding ? '添加中...' : '确认添加' }}
          </button>
        </div>
      </div>
    </div>
  </Asider>
</template>

<script setup>
import { reactive, onMounted } from "vue";
import Asider from "./aside.vue";
import Admin from "../services/adminservice";
import utils from "../common/utils";
import emitter from "../common/emmit";
import { EVENT_NAME, STORAGE } from "../common/enum";
import Storage from "../common/storage";

const props = defineProps(["isShow"]);
const emit = defineEmits(["oncancel"]);

let state = reactive({
  accounts: [],
  showAddDialog: false,
  adding: false,
  addForm: { userId: "", token: "" },
});

onMounted(() => {
  loadAccounts();
});

async function loadAccounts() {
  try {
    state.accounts = await Admin.getMultiAccounts();
  } catch (e) {
    console.error("加载多开账号失败", e);
  }
}

async function onAdd() {
  if (!state.addForm.userId || !state.addForm.token) {
    utils.toast("请填写用户ID和Token");
    return;
  }
  state.adding = true;
  try {
    let success = await Admin.addMultiAccount(state.addForm.userId, state.addForm.token);
    if (success) {
      utils.toast("添加成功");
      state.showAddDialog = false;
      state.addForm = { userId: "", token: "" };
      loadAccounts();
    } else {
      utils.toast("添加失败");
    }
  } catch (e) {
    utils.toast("添加失败：" + e.message);
  } finally {
    state.adding = false;
  }
}

async function onSwitch(acc) {
  try {
    let data = await Admin.switchMultiAccount(acc.sub_user_id);
    if (data && data.token) {
      // 保存新的用户信息
      let user = Storage.get(STORAGE.USER_TOKEN);
      user.id = acc.sub_user_id;
      user.token = data.token;
      Storage.set(STORAGE.USER_TOKEN, user);
      utils.toast("切换成功，正在重新连接...");
      // 触发重新登录
      setTimeout(() => {
        emitter.$emit(EVENT_NAME.UN_UNATHORIZED);
      }, 1000);
    } else {
      utils.toast("切换失败");
    }
  } catch (e) {
    utils.toast("切换失败：" + e.message);
  }
}

async function onRemove(acc) {
  if (!confirm(`确定要移除账号 ${acc.nickname || acc.sub_user_id} 吗？`)) return;
  try {
    let success = await Admin.removeMultiAccount(acc.sub_user_id);
    if (success) {
      utils.toast("移除成功");
      loadAccounts();
    } else {
      utils.toast("移除失败");
    }
  } catch (e) {
    utils.toast("移除失败：" + e.message);
  }
}

function onCancel() {
  emit("oncancel");
}
</script>

<style scoped>
.admin-multi-account {
  padding: 16px;
}
.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}
.section-header .title {
  font-size: 15px;
  font-weight: 600;
  color: #333;
}
.btn-add {
  padding: 6px 14px;
  background: #2563eb;
  color: #fff;
  border: none;
  border-radius: 6px;
  font-size: 13px;
  cursor: pointer;
}
.empty-tip {
  text-align: center;
  padding: 40px 20px;
  color: #999;
}
.empty-tip .sub {
  font-size: 12px;
  margin-top: 8px;
}
.account-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}
.account-item {
  display: flex;
  align-items: center;
  padding: 12px;
  background: #f8f9fa;
  border-radius: 10px;
  border: 1px solid transparent;
}
.account-item.active {
  border-color: #2563eb;
  background: #eff6ff;
}
.account-avatar {
  width: 44px;
  height: 44px;
  border-radius: 50%;
  background: #2563eb;
  color: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 18px;
  font-weight: 600;
  overflow: hidden;
  margin-right: 12px;
}
.account-avatar img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}
.account-info {
  flex: 1;
}
.account-info .nickname {
  font-size: 14px;
  font-weight: 600;
  color: #333;
}
.account-info .user-id {
  font-size: 12px;
  color: #999;
  margin-top: 2px;
}
.current-tag {
  display: inline-block;
  margin-top: 4px;
  padding: 2px 8px;
  background: #2563eb;
  color: #fff;
  font-size: 11px;
  border-radius: 4px;
}
.account-actions {
  display: flex;
  gap: 8px;
}
.btn-switch, .btn-remove {
  padding: 6px 12px;
  border: none;
  border-radius: 6px;
  font-size: 12px;
  cursor: pointer;
}
.btn-switch {
  background: #2563eb;
  color: #fff;
}
.btn-remove {
  background: #fee2e2;
  color: #dc2626;
}
.dialog-mask {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0,0,0,0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}
.dialog-box {
  width: 90%;
  max-width: 400px;
  background: #fff;
  border-radius: 12px;
  overflow: hidden;
}
.dialog-title {
  padding: 16px;
  font-size: 16px;
  font-weight: 600;
  border-bottom: 1px solid #eee;
}
.dialog-body {
  padding: 16px;
}
.form-item {
  margin-bottom: 16px;
}
.form-item label {
  display: block;
  font-size: 13px;
  color: #666;
  margin-bottom: 6px;
}
.form-item input, .form-item textarea {
  width: 100%;
  padding: 10px 12px;
  border: 1px solid #ddd;
  border-radius: 8px;
  font-size: 14px;
  box-sizing: border-box;
}
.form-item textarea {
  resize: vertical;
  font-family: inherit;
}
.tip {
  font-size: 12px;
  color: #999;
  margin-top: 8px;
}
.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  padding: 12px 16px;
  border-top: 1px solid #eee;
}
.btn-cancel, .btn-confirm {
  padding: 8px 20px;
  border: none;
  border-radius: 8px;
  font-size: 14px;
  cursor: pointer;
}
.btn-cancel {
  background: #f3f4f6;
  color: #666;
}
.btn-confirm {
  background: #2563eb;
  color: #fff;
}
.btn-confirm:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}
</style>
