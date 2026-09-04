<script setup>
import { computed, getCurrentInstance, onMounted, reactive, ref } from 'vue';
import { useRouter } from 'vue-router';
import { request } from '../../services/request';

const router = useRouter();
const context = getCurrentInstance();
const appKey = router.currentRoute.value.params.app_key;

// 业务后端 API 地址（根据实际部署修改）
const JIM_API = '/jim';

const state = reactive({
  loading: false,
  keys: [],
  stats: { total_calls: 0, success_calls: 0, failed_calls: 0, total_tokens: 0, user_count: 0 },
  showDialog: false,
  dialogMode: 'add',
  form: {
    id: 0,
    name: '',
    api_key: '',
    api_url: 'https://api.agnes.com/v1/chat/completions',
    model: 'agnes-free',
    bind_type: 0,
    bind_user_id: '',
    status: 0,
    daily_limit: 0,
  },
});

const bindTypeOptions = [
  { value: 0, label: '全局共享（所有VIP用户轮询）' },
  { value: 1, label: '绑定指定VIP用户' },
];

const statusOptions = [
  { value: 0, label: '启用' },
  { value: 1, label: '禁用' },
];

function toast(icon, text) {
  context.proxy.$toast({ icon, text });
}

async function loadKeys() {
  state.loading = true;
  try {
    const res = await request(`${JIM_API}/admin/ai-keys/list?app_key=${appKey}`);
    if (res.code === 0) {
      state.keys = res.data.list || [];
    }
  } catch (e) {
    console.error(e);
  }
  state.loading = false;
}

async function loadStats() {
  try {
    const res = await request(`${JIM_API}/admin/ai-usage/stats?app_key=${appKey}`);
    if (res.code === 0) {
      state.stats = res.data;
    }
  } catch (e) {
    console.error(e);
  }
}

function openAddDialog() {
  state.dialogMode = 'add';
  state.form = {
    id: 0,
    name: '',
    api_key: '',
    api_url: 'https://api.agnes.com/v1/chat/completions',
    model: 'agnes-free',
    bind_type: 0,
    bind_user_id: '',
    status: 0,
    daily_limit: 0,
  };
  state.showDialog = true;
}

function openEditDialog(key) {
  state.dialogMode = 'edit';
  state.form = { ...key, api_key: '' };
  state.showDialog = true;
}

async function saveKey() {
  if (!state.form.name) {
    toast('error', '请输入名称');
    return;
  }
  if (state.dialogMode === 'add' && !state.form.api_key) {
    toast('error', '请输入 API Key');
    return;
  }
  if (state.form.bind_type === 1 && !state.form.bind_user_id) {
    toast('error', '绑定VIP用户时请输入用户ID');
    return;
  }
  try {
    const url = state.dialogMode === 'add'
      ? `${JIM_API}/admin/ai-keys/add`
      : `${JIM_API}/admin/ai-keys/update`;
    const res = await request(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(state.form),
    });
    if (res.code === 0) {
      toast('success', state.dialogMode === 'add' ? '添加成功' : '更新成功');
      state.showDialog = false;
      loadKeys();
      loadStats();
    } else {
      toast('error', res.msg || '操作失败');
    }
  } catch (e) {
    toast('error', '网络错误');
  }
}

async function deleteKey(key) {
  if (!confirm(`确定删除 Key「${key.name}」吗？`)) return;
  try {
    const res = await request(`${JIM_API}/admin/ai-keys/delete?id=${key.id}&app_key=${appKey}`);
    if (res.code === 0) {
      toast('success', '删除成功');
      loadKeys();
      loadStats();
    } else {
      toast('error', res.msg || '删除失败');
    }
  } catch (e) {
    toast('error', '网络错误');
  }
}

function getBindTypeText(type) {
  return type === 1 ? '绑定用户' : '全局共享';
}

function getStatusText(status) {
  return status === 0 ? '启用' : '禁用';
}

onMounted(() => {
  loadKeys();
  loadStats();
});
</script>

<template>
  <div class="ai-config-page">
    <!-- 用量统计 -->
    <div class="stats-row">
      <div class="stat-card">
        <div class="stat-label">总调用次数</div>
        <div class="stat-value">{{ stats.total_calls }}</div>
      </div>
      <div class="stat-card success">
        <div class="stat-label">成功</div>
        <div class="stat-value">{{ stats.success_calls }}</div>
      </div>
      <div class="stat-card failed">
        <div class="stat-label">失败</div>
        <div class="stat-value">{{ stats.failed_calls }}</div>
      </div>
      <div class="stat-card">
        <div class="stat-label">使用用户数</div>
        <div class="stat-value">{{ stats.user_count }}</div>
      </div>
    </div>

    <!-- API Key 列表 -->
    <div class="section">
      <div class="section-header">
        <h3>API Key 管理</h3>
        <button class="btn btn-primary" @click="openAddDialog">+ 添加 Key</button>
      </div>
      <div v-if="loading" class="loading">加载中...</div>
      <div v-else-if="keys.length === 0" class="empty">
        暂无 API Key，点击右上角添加。全局共享 Key 会被所有 VIP 用户轮询使用。
      </div>
      <table v-else class="key-table">
        <thead>
          <tr>
            <th>名称</th>
            <th>API Key</th>
            <th>绑定类型</th>
            <th>绑定用户</th>
            <th>状态</th>
            <th>今日用量</th>
            <th>累计用量</th>
            <th>操作</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="key in keys" :key="key.id">
            <td>{{ key.name }}</td>
            <td class="mono">{{ key.api_key_masked }}</td>
            <td>
              <span :class="['tag', key.bind_type === 1 ? 'tag-blue' : 'tag-green']">
                {{ getBindTypeText(key.bind_type) }}
              </span>
            </td>
            <td>{{ key.bind_user_id || '-' }}</td>
            <td>
              <span :class="['tag', key.status === 0 ? 'tag-green' : 'tag-gray']">
                {{ getStatusText(key.status) }}
              </span>
            </td>
            <td>
              {{ key.used_today }}
              <span v-if="key.daily_limit > 0"> / {{ key.daily_limit }}</span>
            </td>
            <td>{{ key.total_used }}</td>
            <td>
              <button class="btn-link" @click="openEditDialog(key)">编辑</button>
              <button class="btn-link danger" @click="deleteKey(key)">删除</button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- 新增/编辑弹窗 -->
    <div v-if="showDialog" class="dialog-mask" @click.self="showDialog = false">
      <div class="dialog">
        <div class="dialog-header">
          <h3>{{ dialogMode === 'add' ? '添加 API Key' : '编辑 API Key' }}</h3>
          <button class="close" @click="showDialog = false">×</button>
        </div>
        <div class="dialog-body">
          <div class="form-item">
            <label>名称 *</label>
            <input v-model="form.name" placeholder="如：免费Key-1" />
          </div>
          <div class="form-item">
            <label>API Key * {{ dialogMode === 'edit' ? '（留空不修改）' : '' }}</label>
            <input v-model="form.api_key" type="password" placeholder="sk-..." />
          </div>
          <div class="form-item">
            <label>API URL</label>
            <input v-model="form.api_url" placeholder="https://api.agnes.com/v1/chat/completions" />
          </div>
          <div class="form-item">
            <label>模型</label>
            <input v-model="form.model" placeholder="agnes-free" />
          </div>
          <div class="form-item">
            <label>绑定类型</label>
            <select v-model="form.bind_type">
              <option v-for="opt in bindTypeOptions" :key="opt.value" :value="opt.value">
                {{ opt.label }}
              </option>
            </select>
          </div>
          <div class="form-item" v-if="form.bind_type === 1">
            <label>绑定 VIP 用户 ID *</label>
            <input v-model="form.bind_user_id" placeholder="用户ID" />
          </div>
          <div class="form-item">
            <label>状态</label>
            <select v-model="form.status">
              <option v-for="opt in statusOptions" :key="opt.value" :value="opt.value">
                {{ opt.label }}
              </option>
            </select>
          </div>
          <div class="form-item">
            <label>每日调用上限（0=不限制）</label>
            <input v-model.number="form.daily_limit" type="number" min="0" />
          </div>
        </div>
        <div class="dialog-footer">
          <button class="btn" @click="showDialog = false">取消</button>
          <button class="btn btn-primary" @click="saveKey">保存</button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.ai-config-page { padding: 20px; }
.stats-row { display: flex; gap: 16px; margin-bottom: 24px; flex-wrap: wrap; }
.stat-card {
  flex: 1; min-width: 140px; padding: 16px; border-radius: 8px;
  background: #f8f9fa; border: 1px solid #e9ecef;
}
.stat-card.success { background: #f0fff4; border-color: #c6f6d5; }
.stat-card.failed { background: #fff5f5; border-color: #fed7d7; }
.stat-label { font-size: 13px; color: #6b7280; margin-bottom: 8px; }
.stat-value { font-size: 24px; font-weight: 600; color: #1a202c; }
.section { background: #fff; border-radius: 8px; padding: 20px; border: 1px solid #e9ecef; }
.section-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; }
.section-header h3 { margin: 0; font-size: 16px; }
.btn { padding: 8px 16px; border-radius: 6px; border: 1px solid #d1d5db; background: #fff; cursor: pointer; }
.btn-primary { background: #5865f2; color: #fff; border-color: #5865f2; }
.btn-link { background: none; border: none; color: #5865f2; cursor: pointer; padding: 4px 8px; }
.btn-link.danger { color: #ef4444; }
.loading, .empty { padding: 40px; text-align: center; color: #6b7280; }
.key-table { width: 100%; border-collapse: collapse; }
.key-table th, .key-table td { padding: 12px; text-align: left; border-bottom: 1px solid #e9ecef; font-size: 13px; }
.key-table th { background: #f8f9fa; font-weight: 600; color: #374151; }
.mono { font-family: monospace; color: #6b7280; }
.tag { padding: 2px 8px; border-radius: 4px; font-size: 12px; }
.tag-blue { background: #dbeafe; color: #1d4ed8; }
.tag-green { background: #dcfce7; color: #15803d; }
.tag-gray { background: #f3f4f6; color: #6b7280; }
.dialog-mask { position: fixed; inset: 0; background: rgba(0,0,0,0.5); display: flex; align-items: center; justify-content: center; z-index: 1000; }
.dialog { background: #fff; border-radius: 8px; width: 480px; max-height: 90vh; overflow-y: auto; }
.dialog-header { display: flex; justify-content: space-between; align-items: center; padding: 16px 20px; border-bottom: 1px solid #e9ecef; }
.dialog-header h3 { margin: 0; font-size: 16px; }
.close { background: none; border: none; font-size: 24px; cursor: pointer; color: #6b7280; }
.dialog-body { padding: 20px; }
.form-item { margin-bottom: 16px; }
.form-item label { display: block; margin-bottom: 6px; font-size: 13px; color: #374151; font-weight: 500; }
.form-item input, .form-item select { width: 100%; padding: 8px 12px; border: 1px solid #d1d5db; border-radius: 6px; font-size: 14px; box-sizing: border-box; }
.dialog-footer { display: flex; justify-content: flex-end; gap: 12px; padding: 16px 20px; border-top: 1px solid #e9ecef; }
</style>
