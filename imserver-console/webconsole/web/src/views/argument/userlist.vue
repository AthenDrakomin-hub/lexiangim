<script setup>
import { reactive, getCurrentInstance } from 'vue';
import utils from '../../common/utils';
import { useRouter } from "vue-router";
import { UserManager } from "../../services";
import { ErrorType, STORAGE, RESPONSE, LOG_PULL_STATUS, PLATFORMAS } from '../../common/enum';
import Avatar from "../../components/avatar.vue";
import Storage from "../../common/storage";
import { t } from '@/i18n';
import PageSection from '@/components/page-section.vue';

const context = getCurrentInstance();
let router = useRouter();
let { currentRoute: { _rawValue: { params: { app_key } } } } = router;
let defaultParams = {
  offset: '',
  limit: 50,
  app_key: app_key,
  user_id: '',
  keywords: '',
};
let state = reactive({
  params: utils.clone(defaultParams),
  list: [],
  isFinished: false,
  // 编辑用户弹窗
  showEditDialog: false,
  editUser: { user_id: '', nickname: '' },
  editErrorMsg: '',
  // 重置密码弹窗
  showResetPwdDialog: false,
  resetPwdUser: { user_id: '', new_password: '', confirm_password: '' },
  resetPwdErrorMsg: '',
  // 删除确认
  showDeleteConfirm: false,
  deleteUser: { user_id: '', nickname: '' },
});
function format(date, fmt = 'yyyy-MM-dd') {
  return utils.formatTime(new Date(date).getTime(), fmt);
}

function onSearch(){
  search(true);
}
function onNext(){
  let { offset } = state.params;
  search(false);
}
function onUnban(item){
  UserManager.unban({ app_key, items: [{ user_id: item.user_id }] }).then(result => {
    onCallback(result, t('userManager.userList.feedback.unbanned'));
  });
  item.status = 0;
  item.statusName = t('userManager.userList.status.normal');
}
function onBan(item){
  UserManager.ban({ app_key, items: [{ user_id: item.user_id }] }).then(result => {
    onCallback(result, t('userManager.userList.feedback.banned'));
  });
  item.status = 1;
  item.statusName = t('userManager.userList.status.blocked');
}
function onCallback(result, text){
  let { code, msg } = result;
  if(utils.isEqual(code, RESPONSE.SUCCESS)){
    context.proxy.$toast({ icon: 'success', text: text });
  }else{
    context.proxy.$toast({ icon: 'error', text: t('userManager.userList.feedback.requestFailed', { code, msg }, `Error: ${code} ${msg}`) });
  }
}

// 编辑用户
function onShowEdit(item){
  state.editUser = { user_id: item.user_id, nickname: item.nickname };
  state.editErrorMsg = '';
  state.showEditDialog = true;
}
function onEditSave(){
  if (!state.editUser.nickname.trim()) {
    state.editErrorMsg = '昵称不能为空';
    return;
  }
  UserManager.updateProfile({
    app_key: app_key,
    user_id: state.editUser.user_id,
    nickname: state.editUser.nickname.trim()
  }).then(result => {
    let { code } = result;
    if(utils.isEqual(code, RESPONSE.SUCCESS)){
      context.proxy.$toast({ icon: 'success', text: '用户昵称更新成功' });
      state.showEditDialog = false;
      // 更新列表中的昵称
      let user = state.list.find(u => u.user_id === state.editUser.user_id);
      if (user) user.nickname = state.editUser.nickname.trim();
    }else{
      context.proxy.$toast({ icon: 'error', text: `更新失败: ${code}` });
    }
  });
}

// 重置密码
function onShowResetPwd(item){
  state.resetPwdUser = { user_id: item.user_id, new_password: '', confirm_password: '' };
  state.resetPwdErrorMsg = '';
  state.showResetPwdDialog = true;
}
function onResetPwdSave(){
  if (!state.resetPwdUser.new_password) {
    state.resetPwdErrorMsg = '新密码不能为空';
    return;
  }
  if (state.resetPwdUser.new_password.length < 6) {
    state.resetPwdErrorMsg = '密码至少6位';
    return;
  }
  if (state.resetPwdUser.new_password !== state.resetPwdUser.confirm_password) {
    state.resetPwdErrorMsg = '两次密码不一致';
    return;
  }
  UserManager.resetPassword({
    app_key: app_key,
    user_id: state.resetPwdUser.user_id,
    new_password: state.resetPwdUser.new_password
  }).then(result => {
    let { code } = result;
    if(utils.isEqual(code, RESPONSE.SUCCESS)){
      context.proxy.$toast({ icon: 'success', text: '密码重置成功' });
      state.showResetPwdDialog = false;
    }else{
      context.proxy.$toast({ icon: 'error', text: `重置失败: ${code}` });
    }
  });
}

// 删除用户
function onShowDelete(item){
  state.deleteUser = { user_id: item.user_id, nickname: item.nickname };
  state.showDeleteConfirm = true;
}
function onDeleteConfirm(){
  UserManager.deleteUser({
    app_key: app_key,
    user_id: state.deleteUser.user_id
  }).then(result => {
    let { code } = result;
    if(utils.isEqual(code, RESPONSE.SUCCESS)){
      context.proxy.$toast({ icon: 'success', text: '用户删除成功' });
      state.showDeleteConfirm = false;
      // 从列表中移除
      state.list = state.list.filter(u => u.user_id !== state.deleteUser.user_id);
    }else{
      context.proxy.$toast({ icon: 'error', text: `删除失败: ${code}` });
    }
  });
}

function search(isSearch){
  let params = { ...state.params };
  UserManager.getList(params).then((result) => {
    let { code, data, msg = '' } = result;
    if(utils.isEqual(code, RESPONSE.SUCCESS)){
      let { items, offset = '' } = data;
      items = utils.map(items, (item) => {
        item.statusName = item.status == 0 ? t('userManager.userList.status.normal') : t('userManager.userList.status.blocked');
        item.phone = item.phone || '-';
        item.account = item.account || '-';
        item.email = item.email || '-';
        item.time = format(item.created_time, 'yyyy-MM-dd hh:mm:ss');
        return item;
      });
      if(isSearch){
        state.list = items;
      }else{
        state.list = state.list.concat(items);
        state.params.offset = offset;
      }
      if(offset == '' && !isSearch){
        state.isFinished = true;
      }
    }else{
      context.proxy.$toast({ icon: 'error', text: `Error: ${code} ${msg}` });
    }
  });
}
search(true)

</script>
<template>
   <PageSection title-key="menu.user.users" body-class="cim-log-contanier">
    <div class="cim-log-header">
      <ul class="cim-log-header-lf-box">
        <li class="cim-log-lf-item">
          <input class="form-control" type="text" v-model="state.params.user_id" :placeholder="t('userManager.userList.field.userId')" autocomplete="off" @keydown.enter="onSearch">
        </li>
        <li class="cim-log-lf-item">
          <input class="form-control" type="text" v-model="state.params.keywords" :placeholder="t('userManager.userList.field.userName')" autocomplete="off" @keydown.enter="onSearch">
        </li>
        <li class="cim-log-lf-item">
          <div class="cim-button cim-button-bg" @click="onSearch">{{ t('common.action.search') }}</div>
        </li>
      </ul>
    </div>
    <div class="cim-log-body">
      <table class="table cim-table">
        <thead>
          <tr>
            <th class="cim-td-c">{{ t('userManager.userList.table.nickname') }}</th>
            <th class="cim-td-c">{{ t('userManager.userList.table.userId') }}</th>
            <th class="cim-td-c">{{ t('userManager.userList.table.registeredTime') }}</th>
            <th class="cim-td-c">{{ t('userManager.userList.table.account') }}</th>
            <th class="cim-td-c">{{ t('userManager.userList.table.phone') }}</th>
            <th class="cim-td-c">{{ t('userManager.userList.table.email') }}</th>
            <th class="cim-td-c">{{ t('userManager.userList.table.status') }}</th>
            <th class="cim-td-c">{{ t('userManager.userList.table.operation') }}</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="item in state.list">
            <td class="cim-td-c">
              <div class="cim-userlist-info">
                <Avatar :user-id="item.user_id" :name="item.nickname" :avatar="item.avatar" :cls="'cim-small-avatar'"></Avatar>
                <div class="nickname">{{ item.nickname }}</div>
              </div>
            </td>
            <td class="cim-td-c">{{ item.user_id }}</td>
            <td class="cim-td-c">{{ item.time}}</td>
            <td class="cim-td-c">{{ item.account}}</td>
            <td class="cim-td-c">{{ item.phone}}</td>
            <td class="cim-td-c">{{ item.email}}</td>
            <td class="cim-td-c display_layout">
              <span class="cicon cim-log-status" :class="['cicon-user-state-' + item.status]">{{ item.statusName }}</span>
            </td>
            <td class="cim-td-c">
              <ul class="cim-table-tools">
                <li class="cim-table-tool">
                  <a class="btn-link" href="#" @click.prevent="onShowEdit(item)">编辑</a>
                </li>
                <li class="cim-table-tool">
                  <a class="btn-link" href="#" @click.prevent="onShowResetPwd(item)">重置密码</a>
                </li>
                <li class="cim-table-tool">
                  <a class="btn-link" href="#" v-if="item.status == 0" @click.prevent="onBan(item)">{{ t('common.action.ban') }}</a>
                  <a class="btn-link" href="#" v-else  @click.prevent="onUnban(item)">{{ t('common.action.unban') }}</a>
                </li>
                <li class="cim-table-tool">
                  <a class="btn-link text-danger" href="#" @click.prevent="onShowDelete(item)">删除</a>
                </li>
              </ul>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
    <div class="cim-log-footer">
      <nav class="cim-navigation">
        <ul class="pagination">
          <li class="page-item">
            <a class="page-link" href="#" v-if="!state.isFinished"  aria-label="Next" @click.prevent="onNext">
              <span aria-hidden="true">{{ t('common.action.nextPage') }}</span>
            </a>
          </li>
        </ul>
      </nav>
    </div>

    <!-- 编辑用户弹窗 -->
    <div class="modal" v-if="state.showEditDialog">
      <div class="modal-dialog">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title">编辑用户</h5>
            <button type="button" class="close" @click="state.showEditDialog = false">&times;</button>
          </div>
          <div class="modal-body">
            <div class="form-group">
              <label>用户ID</label>
              <input type="text" class="form-control" :value="state.editUser.user_id" disabled>
            </div>
            <div class="form-group">
              <label>昵称</label>
              <input type="text" class="form-control" v-model="state.editUser.nickname" placeholder="请输入昵称">
              <span class="text-danger small" v-if="state.editErrorMsg">{{ state.editErrorMsg }}</span>
            </div>
          </div>
          <div class="modal-footer">
            <button type="button" class="btn btn-secondary" @click="state.showEditDialog = false">取消</button>
            <button type="button" class="btn btn-primary" @click="onEditSave">保存</button>
          </div>
        </div>
      </div>
    </div>

    <!-- 重置密码弹窗 -->
    <div class="modal" v-if="state.showResetPwdDialog">
      <div class="modal-dialog">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title">重置密码</h5>
            <button type="button" class="close" @click="state.showResetPwdDialog = false">&times;</button>
          </div>
          <div class="modal-body">
            <div class="form-group">
              <label>用户ID</label>
              <input type="text" class="form-control" :value="state.resetPwdUser.user_id" disabled>
            </div>
            <div class="form-group">
              <label>新密码</label>
              <input type="password" class="form-control" v-model="state.resetPwdUser.new_password" placeholder="请输入新密码（至少6位）">
            </div>
            <div class="form-group">
              <label>确认密码</label>
              <input type="password" class="form-control" v-model="state.resetPwdUser.confirm_password" placeholder="请再次输入新密码">
              <span class="text-danger small" v-if="state.resetPwdErrorMsg">{{ state.resetPwdErrorMsg }}</span>
            </div>
          </div>
          <div class="modal-footer">
            <button type="button" class="btn btn-secondary" @click="state.showResetPwdDialog = false">取消</button>
            <button type="button" class="btn btn-primary" @click="onResetPwdSave">确认重置</button>
          </div>
        </div>
      </div>
    </div>

    <!-- 删除确认弹窗 -->
    <div class="modal" v-if="state.showDeleteConfirm">
      <div class="modal-dialog">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title">确认删除</h5>
            <button type="button" class="close" @click="state.showDeleteConfirm = false">&times;</button>
          </div>
          <div class="modal-body">
            <p>确定要删除用户 <strong>{{ state.deleteUser.nickname }}</strong>（ID: {{ state.deleteUser.user_id }}）吗？</p>
            <p class="text-danger">此操作不可恢复，用户的所有数据将被删除。</p>
          </div>
          <div class="modal-footer">
            <button type="button" class="btn btn-secondary" @click="state.showDeleteConfirm = false">取消</button>
            <button type="button" class="btn btn-danger" @click="onDeleteConfirm">确认删除</button>
          </div>
        </div>
      </div>
    </div>
  </PageSection>
</template>

<style scoped>
.modal {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0,0,0,0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 9999;
}
.modal-dialog {
  width: 480px;
  max-width: 90vw;
}
.modal-content {
  background: #fff;
  border-radius: 8px;
  box-shadow: 0 4px 20px rgba(0,0,0,0.15);
}
.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 20px;
  border-bottom: 1px solid #e5e7eb;
}
.modal-title {
  margin: 0;
  font-size: 16px;
  font-weight: 600;
}
.close {
  background: none;
  border: none;
  font-size: 20px;
  cursor: pointer;
  color: #6b7280;
}
.modal-body {
  padding: 20px;
}
.form-group {
  margin-bottom: 16px;
}
.form-group label {
  display: block;
  margin-bottom: 6px;
  font-size: 14px;
  color: #374151;
}
.form-control {
  width: 100%;
  height: 38px;
  padding: 0 12px;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  font-size: 14px;
  box-sizing: border-box;
}
.form-control:focus {
  outline: none;
  border-color: #2563eb;
  box-shadow: 0 0 0 3px rgba(37,99,235,0.1);
}
.form-control:disabled {
  background: #f3f4f6;
  color: #6b7280;
}
.modal-footer {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  padding: 16px 20px;
  border-top: 1px solid #e5e7eb;
}
.btn {
  padding: 8px 16px;
  border-radius: 6px;
  font-size: 14px;
  cursor: pointer;
  border: none;
}
.btn-secondary {
  background: #f3f4f6;
  color: #374151;
}
.btn-primary {
  background: #2563eb;
  color: #fff;
}
.btn-danger {
  background: #dc2626;
  color: #fff;
}
.text-danger {
  color: #dc2626;
}
.small {
  font-size: 12px;
}
.cim-table-tools {
  display: flex;
  gap: 12px;
  list-style: none;
  margin: 0;
  padding: 0;
}
.btn-link {
  color: #2563eb;
  text-decoration: none;
  font-size: 13px;
  cursor: pointer;
}
.btn-link:hover {
  text-decoration: underline;
}
.btn-link.text-danger {
  color: #dc2626;
}
</style>
