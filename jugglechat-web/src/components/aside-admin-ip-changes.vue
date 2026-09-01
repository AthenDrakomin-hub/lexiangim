<template>
  <Asider :isShow="isShow" title="IP变动通知" @oncancel="onCancel">
    <div class="admin-ip-changes">
      <!-- 未读统计 -->
      <div class="stats-bar">
        <span>未读: <b class="unread-count">{{ unreadCount }}</b></span>
        <button v-if="unreadCount > 0" class="btn-read-all" @click="onMarkAllRead">全部已读</button>
      </div>

      <!-- 筛选 -->
      <div class="filter-bar">
        <button :class="{ active: filter === 'all' }" @click="onFilter('all')">全部</button>
        <button :class="{ active: filter === 'unread' }" @click="onFilter('unread')">未读</button>
        <button :class="{ active: filter === 'read' }" @click="onFilter('read')">已读</button>
      </div>

      <!-- 通知列表 -->
      <div v-if="notifications.length === 0" class="empty-tip">
        <p>暂无IP变动通知</p>
      </div>
      <div v-else class="notification-list">
        <div v-for="item in notifications" :key="item.id" class="notification-item" :class="{ unread: item.is_read === 0 }" @click="onViewDetail(item)">
          <div class="notif-icon">
            <span class="icon-ip">IP</span>
            <span v-if="item.is_read === 0" class="dot"></span>
          </div>
          <div class="notif-content">
            <div class="notif-title">
              {{ item.target_nickname || item.target_user_id }} 的IP发生变动
            </div>
            <div class="notif-ip-change">
              <span class="old-ip">{{ item.old_ip || '未知' }}</span>
              <span class="arrow">→</span>
              <span class="new-ip">{{ item.new_ip }}</span>
            </div>
            <div v-if="item.new_location" class="notif-location">新位置: {{ item.new_location }}</div>
            <div class="notif-time">{{ item.change_time }}</div>
          </div>
          <div class="notif-status">
            <span v-if="item.is_read === 0" class="status-unread">未读</span>
            <span v-else class="status-read">已读</span>
          </div>
        </div>
      </div>

      <!-- 分页 -->
      <div v-if="total > pageSize" class="pagination">
        <button @click="onPrevPage" :disabled="page <= 1">上一页</button>
        <span>第 {{ page }} / {{ Math.ceil(total / pageSize) }} 页</span>
        <button @click="onNextPage" :disabled="page >= Math.ceil(total / pageSize)">下一页</button>
      </div>
    </div>
  </Asider>
</template>

<script setup>
import { reactive, onMounted } from "vue";
import Asider from "./aside.vue";
import Admin from "../services/adminservice";

const props = defineProps(["isShow"]);
const emit = defineEmits(["oncancel"]);

let state = reactive({
  notifications: [],
  total: 0,
  unreadCount: 0,
  page: 1,
  pageSize: 20,
  filter: "all",
});

onMounted(() => {
  loadNotifications();
});

async function loadNotifications() {
  try {
    let isRead = state.filter === "unread" ? 0 : state.filter === "read" ? 1 : null;
    let data = await Admin.getIpChanges(state.page, state.pageSize, isRead);
    state.notifications = data.list || [];
    state.total = data.total || 0;
    state.unreadCount = data.unread_count || 0;
  } catch (e) {
    console.error("加载IP变动通知失败", e);
  }
}

function onFilter(type) {
  state.filter = type;
  state.page = 1;
  loadNotifications();
}

async function onMarkAllRead() {
  try {
    let unreadIds = state.notifications.filter(n => n.is_read === 0).map(n => n.id);
    if (unreadIds.length > 0) {
      await Admin.markIpChangeRead(unreadIds);
    }
    loadNotifications();
  } catch (e) {
    console.error("标记已读失败", e);
  }
}

async function onViewDetail(item) {
  if (item.is_read === 0) {
    try {
      await Admin.markIpChangeRead([item.id]);
      item.is_read = 1;
      state.unreadCount = Math.max(0, state.unreadCount - 1);
    } catch (e) {
      console.error("标记已读失败", e);
    }
  }
}

function onPrevPage() {
  if (state.page > 1) {
    state.page--;
    loadNotifications();
  }
}

function onNextPage() {
  if (state.page < Math.ceil(state.total / state.pageSize)) {
    state.page++;
    loadNotifications();
  }
}

function onCancel() {
  emit("oncancel");
}
</script>

<style scoped>
.admin-ip-changes {
  padding: 16px;
}
.stats-bar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
  font-size: 13px;
  color: #666;
}
.unread-count {
  color: #dc2626;
  font-size: 16px;
}
.btn-read-all {
  padding: 4px 12px;
  background: #2563eb;
  color: #fff;
  border: none;
  border-radius: 6px;
  font-size: 12px;
  cursor: pointer;
}
.filter-bar {
  display: flex;
  gap: 8px;
  margin-bottom: 12px;
}
.filter-bar button {
  padding: 6px 14px;
  border: 1px solid #ddd;
  background: #fff;
  border-radius: 20px;
  font-size: 12px;
  cursor: pointer;
  color: #666;
}
.filter-bar button.active {
  background: #2563eb;
  color: #fff;
  border-color: #2563eb;
}
.empty-tip {
  text-align: center;
  padding: 40px 20px;
  color: #999;
}
.notification-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}
.notification-item {
  display: flex;
  align-items: flex-start;
  padding: 12px;
  background: #f8f9fa;
  border-radius: 10px;
  cursor: pointer;
  transition: background 0.2s;
}
.notification-item.unread {
  background: #eff6ff;
  border-left: 3px solid #2563eb;
}
.notification-item:hover {
  background: #eef2ff;
}
.notif-icon {
  position: relative;
  width: 36px;
  height: 36px;
  border-radius: 8px;
  background: linear-gradient(135deg, #2563eb, #7c3aed);
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: 10px;
  flex-shrink: 0;
}
.icon-ip {
  color: #fff;
  font-size: 11px;
  font-weight: 700;
}
.dot {
  position: absolute;
  top: -2px;
  right: -2px;
  width: 10px;
  height: 10px;
  background: #dc2626;
  border-radius: 50%;
  border: 2px solid #fff;
}
.notif-content {
  flex: 1;
  min-width: 0;
}
.notif-title {
  font-size: 13px;
  font-weight: 600;
  color: #333;
}
.notif-ip-change {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-top: 6px;
  font-size: 12px;
}
.old-ip {
  font-family: monospace;
  color: #999;
  text-decoration: line-through;
}
.arrow {
  color: #2563eb;
  font-weight: bold;
}
.new-ip {
  font-family: monospace;
  background: #dcfce7;
  padding: 1px 6px;
  border-radius: 4px;
  color: #16a34a;
  font-weight: 600;
}
.notif-location {
  font-size: 11px;
  color: #666;
  margin-top: 4px;
}
.notif-time {
  font-size: 11px;
  color: #999;
  margin-top: 4px;
}
.notif-status {
  flex-shrink: 0;
  margin-left: 8px;
}
.status-unread {
  font-size: 11px;
  color: #dc2626;
  background: #fee2e2;
  padding: 2px 8px;
  border-radius: 4px;
}
.status-read {
  font-size: 11px;
  color: #999;
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
</style>
