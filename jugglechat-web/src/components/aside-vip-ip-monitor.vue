<template>
  <Asider :isShow="isShow" title="IP在线状态" @oncancel="onCancel">
    <div class="vip-ip-monitor">
      <!-- 搜索栏 -->
      <div class="search-bar">
        <input v-model="keyword" type="text" placeholder="搜索用户ID/昵称/IP" @keyup.enter="onSearch" />
        <button @click="onSearch">搜索</button>
      </div>

      <!-- 统计信息 -->
      <div class="stats-bar">
        <span>共 {{ total }} 个用户</span>
        <span>在线 {{ onlineCount }} 人</span>
      </div>

      <!-- 用户列表 -->
      <div v-if="users.length === 0" class="empty-tip">
        <p>暂无用户数据</p>
      </div>
      <div v-else class="user-list">
        <div v-for="user in users" :key="user.user_id" class="user-item" @click="onViewHistory(user)">
          <div class="user-avatar">
            <img v-if="user.avatar" :src="user.avatar" alt="" />
            <span v-else>{{ user.nickname ? user.nickname.charAt(0) : '?' }}</span>
          </div>
          <div class="user-info">
            <div class="user-name">
              {{ user.nickname || user.user_id }}
              <span class="online-status" :class="{ online: user.online_status === 1 }">
                {{ user.online_status === 1 ? '在线' : '离线' }}
              </span>
            </div>
            <div class="user-id">ID: {{ user.user_id }}</div>
            <div class="user-ip">
              <span class="ip-label">IP:</span>
              <span class="ip-value">{{ user.ip_address || '未知' }}</span>
              <span v-if="user.ip_location" class="ip-location">{{ user.ip_location }}</span>
            </div>
            <div v-if="user.device_info" class="user-device">设备: {{ user.device_info }}</div>
            <div v-if="user.login_time" class="user-login-time">最后登录: {{ user.login_time }}</div>
          </div>
          <div class="user-arrow">›</div>
        </div>
      </div>

      <!-- 分页 -->
      <div v-if="total > pageSize" class="pagination">
        <button @click="onPrevPage" :disabled="page <= 1">上一页</button>
        <span>第 {{ page }} / {{ Math.ceil(total / pageSize) }} 页</span>
        <button @click="onNextPage" :disabled="page >= Math.ceil(total / pageSize)">下一页</button>
      </div>
    </div>

    <!-- IP历史详情弹窗 -->
    <div v-if="showHistory" class="dialog-mask" @click.self="showHistory = false">
      <div class="dialog-box history-box">
        <div class="dialog-title">
          {{ currentUser.nickname || currentUser.user_id }} 的IP历史
        </div>
        <div class="dialog-body">
          <div v-if="ipHistory.length === 0" class="empty-tip">
            <p>暂无IP记录</p>
          </div>
          <div v-else class="history-list">
            <div v-for="(log, idx) in ipHistory" :key="idx" class="history-item">
              <div class="history-ip">
                <span class="ip-value">{{ log.ip_address }}</span>
                <span v-if="log.ip_location" class="ip-location">{{ log.ip_location }}</span>
              </div>
              <div class="history-time">{{ log.login_time }}</div>
              <div v-if="log.device_info" class="history-device">{{ log.device_info }}</div>
            </div>
          </div>
        </div>
        <div class="dialog-footer">
          <button class="btn-cancel" @click="showHistory = false">关闭</button>
        </div>
      </div>
    </div>
  </Asider>
</template>

<script setup>
import { reactive, onMounted, computed } from "vue";
import Asider from "./aside.vue";
import Vip from "../services/vipservice";

const props = defineProps(["isShow"]);
const emit = defineEmits(["oncancel"]);

let state = reactive({
  users: [],
  total: 0,
  page: 1,
  pageSize: 20,
  keyword: "",
  showHistory: false,
  currentUser: {},
  ipHistory: [],
});

const onlineCount = computed(() => state.users.filter(u => u.online_status === 1).length);

onMounted(() => {
  loadUsers();
});

async function loadUsers() {
  try {
    let data = await Vip.getAllUsersIpStatus(state.page, state.pageSize, state.keyword);
    state.users = data.list || [];
    state.total = data.total || 0;
  } catch (e) {
    console.error("加载用户IP状态失败", e);
  }
}

function onSearch() {
  state.page = 1;
  loadUsers();
}

function onPrevPage() {
  if (state.page > 1) {
    state.page--;
    loadUsers();
  }
}

function onNextPage() {
  if (state.page < Math.ceil(state.total / state.pageSize)) {
    state.page++;
    loadUsers();
  }
}

async function onViewHistory(user) {
  state.currentUser = user;
  state.showHistory = true;
  state.ipHistory = [];
  try {
    let data = await Vip.getUserIpHistory(user.user_id, 1, 50);
    state.ipHistory = data.list || [];
  } catch (e) {
    console.error("加载IP历史失败", e);
  }
}

function onCancel() {
  emit("oncancel");
}
</script>

<style scoped>
.vip-ip-monitor {
  padding: 16px;
}
.search-bar {
  display: flex;
  gap: 8px;
  margin-bottom: 12px;
}
.search-bar input {
  flex: 1;
  padding: 8px 12px;
  border: 1px solid #ddd;
  border-radius: 8px;
  font-size: 13px;
}
.search-bar button {
  padding: 8px 16px;
  background: #2563eb;
  color: #fff;
  border: none;
  border-radius: 8px;
  font-size: 13px;
  cursor: pointer;
}
.stats-bar {
  display: flex;
  gap: 16px;
  font-size: 12px;
  color: #666;
  margin-bottom: 12px;
}
.empty-tip {
  text-align: center;
  padding: 40px 20px;
  color: #999;
}

/* 深色模式空提示 */
[data-bs-theme="dark"] .empty-tip {
  color: var(--jg-text-muted);
}

.user-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.user-item {
  display: flex;
  align-items: flex-start;
  padding: 12px;
  background: #f8f9fa;
  border-radius: 10px;
  cursor: pointer;
  transition: background 0.2s;
}

/* 深色模式用户项 */
[data-bs-theme="dark"] .user-item {
  background: var(--jg-bg-card);
}

.user-item:hover {
  background: #eff6ff;
}

/* 深色模式用户项悬停 */
[data-bs-theme="dark"] .user-item:hover {
  background: var(--jg-bg-hover);
}
.user-avatar {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: #2563eb;
  color: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 16px;
  font-weight: 600;
  overflow: hidden;
  margin-right: 10px;
  flex-shrink: 0;
}
.user-avatar img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}
.user-info {
  flex: 1;
  min-width: 0;
}
.user-name {
  font-size: 14px;
  font-weight: 600;
  color: #333;
  display: flex;
  align-items: center;
  gap: 8px;
}
.online-status {
  font-size: 11px;
  padding: 2px 6px;
  border-radius: 4px;
  background: #e5e7eb;
  color: #6b7280;
}
.online-status.online {
  background: #dcfce7;
  color: #16a34a;
}
.user-id {
  font-size: 11px;
  color: #999;
  margin-top: 2px;
}
.user-ip {
  font-size: 12px;
  color: #555;
  margin-top: 4px;
  display: flex;
  align-items: center;
  gap: 6px;
  flex-wrap: wrap;
}
.ip-label {
  color: #999;
}
.ip-value {
  font-family: monospace;
  background: #eef2ff;
  padding: 1px 6px;
  border-radius: 4px;
  color: #4338ca;
}
.ip-location {
  color: #666;
}
.user-device, .user-login-time {
  font-size: 11px;
  color: #999;
  margin-top: 2px;
}
.user-arrow {
  color: #ccc;
  font-size: 20px;
  align-self: center;
}
.pagination {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 12px;
  margin-top: 16px;
  font-size: 13px;
}
.pagination button {
  padding: 6px 12px;
  border: 1px solid #ddd;
  background: #fff;
  border-radius: 6px;
  cursor: pointer;
  font-size: 12px;
}
.pagination button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
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
  max-width: 480px;
  background: #fff;
  border-radius: 12px;
  overflow: hidden;
  max-height: 80vh;
  display: flex;
  flex-direction: column;
}
.history-box {
  max-width: 520px;
}
.dialog-title {
  padding: 16px;
  font-size: 16px;
  font-weight: 600;
  border-bottom: 1px solid #eee;
}
.dialog-body {
  padding: 16px;
  overflow-y: auto;
  flex: 1;
}
.history-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}
.history-item {
  padding: 10px 12px;
  background: #f8f9fa;
  border-radius: 8px;
}
.history-ip {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}
.history-time {
  font-size: 12px;
  color: #999;
  margin-top: 4px;
}
.history-device {
  font-size: 11px;
  color: #bbb;
  margin-top: 2px;
}
.dialog-footer {
  display: flex;
  justify-content: flex-end;
  padding: 12px 16px;
  border-top: 1px solid #eee;
}
.btn-cancel {
  padding: 8px 20px;
  border: none;
  border-radius: 8px;
  font-size: 14px;
  cursor: pointer;
  background: #f3f4f6;
  color: #666;
}
</style>
