<script setup>
import { reactive, getCurrentInstance, onMounted } from 'vue';
import { useRouter } from "vue-router";
import utils from '../../common/utils';
import { R3d } from "../../services";
import { RESPONSE } from '../../common/enum';
import { t } from '@/i18n';
import PageSection from '@/components/page-section.vue';

let router = useRouter();
let { currentRoute: { _rawValue: { params: { app_key } } } } = router;
const context = getCurrentInstance();

let state = reactive({
  list: [],
  isShowDialog: false,
  isEditing: false,
  editItem: null,
  form: {
    code: '',
    description: '',
    max_uses: 0
  },
  loading: false
});

function formatDate(timestamp) {
  if (!timestamp) return '-';
  const date = new Date(timestamp * 1000);
  return date.toLocaleString('zh-CN', { hour12: false });
}

function getStatusText(status) {
  const statusMap = {
    0: t('inviteCode.status.active'),
    1: t('inviteCode.status.disabled')
  };
  return statusMap[status] || '-';
}

function openCreateDialog() {
  state.isEditing = false;
  state.editItem = null;
  state.form = { code: '', description: '', max_uses: 0 };
  state.isShowDialog = true;
}

function openEditDialog(item) {
  state.isEditing = true;
  state.editItem = item;
  state.form = {
    code: item.code,
    description: item.description || '',
    max_uses: item.max_uses || 0
  };
  state.isShowDialog = true;
}

function onSave() {
  if (!state.form.code.trim()) {
    context.proxy.$toast({ icon: 'error', text: t('inviteCode.field.code') + ' ' + t('inviteCode.feedback.createFailed', { code: '必填' }) });
    return;
  }
  
  state.loading = true;
  const params = {
    code: state.form.code.trim(),
    description: state.form.description,
    max_uses: state.form.max_uses
  };
  
  R3d.createInviteCode(params).then((result) => {
    state.loading = false;
    let { code, msg } = result;
    if (!utils.isEqual(code, RESPONSE.SUCCESS)) {
      return context.proxy.$toast({ icon: 'error', text: t('inviteCode.feedback.createFailed', { code }) });
    }
    context.proxy.$toast({ icon: 'success', text: t('inviteCode.feedback.success') });
    onLoadList();
    state.isShowDialog = false;
  }).catch(() => {
    state.loading = false;
    context.proxy.$toast({ icon: 'error', text: t('inviteCode.feedback.createFailed', { code: '网络错误' }) });
  });
}

function onDelete(item) {
  context.proxy.$confirm?.(t('inviteCode.action.delete') + ' ' + item.code + '?', '提示', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning'
  }).then(() => {
    R3d.deleteInviteCode({ code: item.code }).then((result) => {
      let { code } = result;
      if (!utils.isEqual(code, RESPONSE.SUCCESS)) {
        return context.proxy.$toast({ icon: 'error', text: t('inviteCode.feedback.deleteFailed', { code }) });
      }
      context.proxy.$toast({ icon: 'success', text: t('inviteCode.feedback.success') });
      onLoadList();
    });
  }).catch(() => {});
}

function onToggleStatus(item) {
  const newStatus = item.status === 0 ? 1 : 0;
  R3d.updateInviteCodeStatus({ code: item.code, status: newStatus }).then((result) => {
    let { code } = result;
    if (!utils.isEqual(code, RESPONSE.SUCCESS)) {
      return context.proxy.$toast({ icon: 'error', text: t('inviteCode.feedback.updateFailed', { code }) });
    }
    context.proxy.$toast({ icon: 'success', text: t('inviteCode.feedback.success') });
    onLoadList();
  });
}

function onLoadList() {
  state.loading = true;
  R3d.listInviteCodes({ app_key }).then((result) => {
    state.loading = false;
    let { code, data } = result;
    if (!utils.isEqual(code, RESPONSE.SUCCESS)) {
      return context.proxy.$toast({ icon: 'error', text: t('inviteCode.feedback.fetchFailed', { code }) });
    }
    state.list = data || [];
  }).catch(() => {
    state.loading = false;
    context.proxy.$toast({ icon: 'error', text: t('inviteCode.feedback.fetchFailed', { code: '网络错误' }) });
  });
}

onMounted(() => {
  onLoadList();
});
</script>

<template>
  <PageSection :title="t('menu.app.inviteCodeSettings')" body-class="cim-invitecode-container">
    <div class="cim-invitecode-header">
      <button class="cim-btn-primary" @click="openCreateDialog">
        {{ t('inviteCode.action.create') }}
      </button>
      <button class="cim-btn-default" @click="onLoadList">
        {{ t('inviteCode.action.refresh') }}
      </button>
    </div>
    
    <div class="cim-invitecode-table" v-if="!state.loading && state.list.length > 0">
      <table>
        <thead>
          <tr>
            <th>{{ t('inviteCode.field.code') }}</th>
            <th>{{ t('inviteCode.field.description') }}</th>
            <th>{{ t('inviteCode.field.maxUses') }}</th>
            <th>{{ t('inviteCode.field.usedCount') }}</th>
            <th>{{ t('inviteCode.field.status') }}</th>
            <th>{{ t('inviteCode.field.createdAt') }}</th>
            <th>{{ t('inviteCode.action').create }}</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="item in state.list" :key="item.code">
            <td>{{ item.code }}</td>
            <td>{{ item.description || '-' }}</td>
            <td>{{ item.max_uses || '∞' }}</td>
            <td>{{ item.used_count || 0 }}</td>
            <td>
              <span :class="['life-status', item.status === 0 ? 'active' : 'disabled']">
                {{ getStatusText(item.status) }}
              </span>
            </td>
            <td>{{ formatDate(item.created_at) }}</td>
            <td class="cim-invitecode-actions">
              <button class="cim-btn-small" @click="onToggleStatus(item)">
                {{ item.status === 0 ? t('inviteCode.action.disable') : t('inviteCode.action.enable') }}
              </button>
              <button class="cim-btn-small cim-btn-danger" @click="onDelete(item)">
                {{ t('inviteCode.action.delete') }}
              </button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
    
    <div v-else-if="!state.loading" class="cim-empty-state">
      {{ t('inviteCode.feedback.fetchFailed', { code: '暂无数据' }) }}
    </div>
    
    <div v-else class="cim-loading">
      加载中...
    </div>

    <!-- 创建/编辑对话框 -->
    <div class="cim-dialog-overlay" v-if="state.isShowDialog">
      <div class="cim-dialog">
        <div class="cim-dialog-header">
          <span>{{ state.isEditing ? t('inviteCode.dialog.editTitle') : t('inviteCode.dialog.title') }}</span>
          <button class="cim-dialog-close" @click="state.isShowDialog = false">×</button>
        </div>
        <div class="cim-dialog-body">
          <div class="cim-form-item">
            <label>{{ t('inviteCode.dialog.code') }}</label>
            <input 
              v-model="state.form.code" 
              :placeholder="t('inviteCode.dialog.code')"
              :disabled="state.isEditing"
              class="cim-form-input"
            >
          </div>
          <div class="cim-form-item">
            <label>{{ t('inviteCode.dialog.description') }}</label>
            <input 
              v-model="state.form.description" 
              :placeholder="t('inviteCode.dialog.description')"
              class="cim-form-input"
            >
          </div>
          <div class="cim-form-item">
            <label>{{ t('inviteCode.dialog.maxUses') }}</label>
            <input 
              v-model.number="state.form.max_uses" 
              type="number"
              :placeholder="t('inviteCode.dialog.maxUsesPlaceholder')"
              class="cim-form-input"
            >
          </div>
        </div>
        <div class="cim-dialog-footer">
          <button class="cim-btn-default" @click="state.isShowDialog = false">取消</button>
          <button class="cim-btn-primary" @click="onSave" :disabled="state.loading">
            {{ state.loading ? '保存中...' : '保存' }}
          </button>
        </div>
      </div>
    </div>
  </PageSection>
</template>

<style scoped>
.cim-invitecode-container {
  padding: 20px;
}

.cim-invitecode-header {
  margin-bottom: 20px;
  display: flex;
  gap: 10px;
}

.cim-btn-primary {
  background: #1890ff;
  color: white;
  border: none;
  padding: 8px 16px;
  border-radius: 4px;
  cursor: pointer;
}

.cim-btn-default {
  background: white;
  color: #333;
  border: 1px solid #d9d9d9;
  padding: 8px 16px;
  border-radius: 4px;
  cursor: pointer;
}

.cim-btn-small {
  background: white;
  color: #1890ff;
  border: 1px solid #1890ff;
  padding: 4px 8px;
  border-radius: 4px;
  cursor: pointer;
  font-size: 12px;
  margin-right: 5px;
}

.cim-btn-danger {
  color: #ff4d4f;
  border-color: #ff4d4f;
}

.cim-invitecode-table {
  width: 100%;
  border-collapse: collapse;
}

.cim-invitecode-table th,
.cim-invitecode-table td {
  padding: 12px;
  text-align: left;
  border-bottom: 1px solid #f0f0f0;
}

.cim-invitecode-table th {
  background: #fafafa;
  font-weight: 600;
}

.life-status {
  padding: 2px 8px;
  border-radius: 10px;
  font-size: 12px;
}

.life-status.active {
  background: #f6ffed;
  color: #52c41a;
}

.life-status.disabled {
  background: #fff2f0;
  color: #ff4d4f;
}

.cim-empty-state, .cim-loading {
  text-align: center;
  padding: 40px;
  color: #999;
}

/* 对话框样式 */
.cim-dialog-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.cim-dialog {
  background: white;
  border-radius: 8px;
  width: 400px;
  max-width: 90%;
}

.cim-dialog-header {
  padding: 16px;
  border-bottom: 1px solid #f0f0f0;
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-weight: 600;
}

.cim-dialog-close {
  background: none;
  border: none;
  font-size: 20px;
  cursor: pointer;
  color: #999;
}

.cim-dialog-body {
  padding: 16px;
}

.cim-form-item {
  margin-bottom: 16px;
}

.cim-form-item label {
  display: block;
  margin-bottom: 4px;
  font-size: 14px;
  color: #333;
}

.cim-form-input {
  width: 100%;
  padding: 8px;
  border: 1px solid #d9d9d9;
  border-radius: 4px;
  box-sizing: border-box;
}

.cim-dialog-footer {
  padding: 16px;
  border-top: 1px solid #f0f0f0;
  display: flex;
  justify-content: flex-end;
  gap: 10px;
}
</style>
