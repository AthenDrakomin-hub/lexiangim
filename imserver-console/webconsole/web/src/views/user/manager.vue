<script setup>
import { reactive, getCurrentInstance } from 'vue';
import ModifyDialog from '../../components/dialog.vue';
import BindAppDialog from '../../components/dialog-bind-app.vue';
import { USER_STATE, ErrorType, ROLES, USER_ROLE_TYPE } from "../../common/enum";
import utils from '../../common/utils';
import { User, Application } from "../../services";
import { t } from '@/i18n';
import PageSection from '@/components/page-section.vue';

let context = getCurrentInstance();
let defaltUser = {
  account: '',
  password: '',
  confirmPasswrod: '',
  state: USER_STATE.ENABLE,
  role: USER_ROLE_TYPE.ADMIN,
  app_key: ''
}
let state = reactive({
  users: [],
  roles: utils.clone(ROLES),
  apps: [], // 应用列表
  radios: [
    { name: 'type', value: USER_STATE.ENABLE, label: 'Enable', labelKey: 'userManager.action.enable' },
    { name: 'type', value: USER_STATE.DISABLE, label: 'Disable', labelKey: 'userManager.action.disable' },
  ],
  isShowEdit: false,
  user: utils.clone(defaltUser),

  accountErrorMsg: '',
  pwdErrorMsg: '',
  conPwdErrorMsg: '',

  isShowBindApp: false,
  selectUser: {},

  // 修改角色弹窗
  showRoleDialog: false,
  roleUser: { account: '', role_type: USER_ROLE_TYPE.USER, app_key: '' },
  roleErrorMsg: '',
});

// 加载应用列表
function loadApps() {
  Application.getList().then(({ data }) => {
    if (data && data.items) {
      state.apps = data.items.map(item => ({
        app_key: item.app_key,
        app_name: item.app_name
      }));
    }
  }).catch(() => {
    // 加载失败时使用默认应用
    state.apps = [{ app_key: 'LXIM2026PROD001', app_name: '乐享通信' }];
  });
}
loadApps();

User.getUsers().then(({ data }) => {
  let { items } = data;
  state.users = items.map((item) => {
    item.time = utils.formatTime(item.created_time)
    return item;
  })
});
function onShowEdit(isShow, user) {
  state.isShowEdit = isShow;
  if(user){
    state.user = user;
  }
  if(!isShow){
    state.user = utils.clone(defaltUser);
  }
}
function onShowBindApp(isShow, user){
  state.isShowBindApp = isShow;
  state.selectUser = isShow ? user : {};
}
function onRadieChanged(type){
  state.user.state = type;
}
function onOperate(user){
  let userState;
  if(utils.isEqual(user.state, USER_STATE.ENABLE)){
    userState = USER_STATE.DISABLE;
  }
  if(utils.isEqual(user.state, USER_STATE.DISABLE)){
    userState = USER_STATE.ENABLE;
  }
  User.disable({ 
    accounts: [user.account],
    is_disable: userState
  }).then(() => {
    state.users.map((_user) => {
      if(utils.isEqual(user.account, _user.account)){
        utils.extend(_user, { state: userState });
      }
      return _user;
    });
    context.proxy.$toast({
      icon: 'success',
      text: t('userManager.feedback.operateSuccess'),
      duration: 4000
    })
  })
}
function onDelete(index){
  let user = state.users[index];
  User.remove({ accounts: [user.account] }).then(() => {
    state.users.splice(index, 1);
    context.proxy.$toast({
      icon: 'success',
      text: t('userManager.feedback.deleteSuccess'),
      duration: 4000
    });
  });
}
function onSave(){
  let { user } = state;
  let { account, password, confirmPasswrod, role } = user;
  if(utils.isEmpty(account)){
    return state.accountErrorMsg = t('userManager.validation.accountRequired');
  }
  if(utils.isEmpty(password)){
    return state.pwdErrorMsg = t('userManager.validation.passwordRequired');
  }
  if(!utils.isEqual(confirmPasswrod, password)){
    return state.conPwdErrorMsg = t('userManager.validation.passwordMismatch');
  }
  if(user.created_time){
    return User.updatePwd({
      account: account,
      password: password,
      new_password: confirmPasswrod,
      role_type: role,
    }).then(({ code, msg }) => {
      if(utils.isEqual(code, ErrorType.SUCCESS_0.code)){
        context.proxy.$toast({
          icon: 'success',
          text: t('userManager.feedback.passwordUpdated'),
          duration: 3000
        });
      }else{
        context.proxy.$toast({
          icon: 'error',
          text: `${code}:${msg}`,
          duration: 3000
        });
      }
    });
  }
  User.add({ account, password, state: user.state, role_type: role, app_key: user.app_key }).then(({ code }) => {
    let icon = 'success', text = t('userManager.feedback.saveSuccess');
    if(utils.isEqual(code, ErrorType.SUCCESS_0.code)){
      user.time = utils.formatTime(Date.now());
      state.users.push(user);
      onShowEdit(false);
    }else if(utils.isEqual(code, ErrorType.USER_EXISTS.code)){
      icon = 'error';
      text = t(ErrorType.USER_EXISTS.key);
    }else{
      icon = 'error';
      text = t('userManager.feedback.saveFailed');
    }
    context.proxy.$toast({
      icon,
      text,
      duration: 4000
    });
  });
}
function onInput(name){
  let events = {
    account: () => {
      state.accountErrorMsg = '';
    },
    pwd: () => {
      state.pwdErrorMsg = '';
    },
    confirm: () => {
      state.conPwdErrorMsg = '';
    }
  };
  events[name]();
}
function onBindApp(){
  let { selectUser } = state;
  onShowBindApp(false, {});
}

// 修改角色
function onShowRoleDialog(user){
  state.roleUser = { account: user.account, role_type: user.role_type, app_key: user.app_key || '' };
  state.roleErrorMsg = '';
  state.showRoleDialog = true;
}
function onRoleSave(){
  if (state.roleUser.role_type === undefined || state.roleUser.role_type === null) {
    state.roleErrorMsg = '请选择角色';
    return;
  }
  // 应用管理员必须绑定应用
  if (state.roleUser.role_type === USER_ROLE_TYPE.USER && !state.roleUser.app_key) {
    state.roleErrorMsg = '应用管理员必须选择绑定的应用';
    return;
  }
  User.updateRole({
    account: state.roleUser.account,
    role_type: state.roleUser.role_type,
    app_key: state.roleUser.app_key
  }).then(({ code, msg }) => {
    if(utils.isEqual(code, ErrorType.SUCCESS_0.code)){
      context.proxy.$toast({
        icon: 'success',
        text: '角色修改成功',
        duration: 3000
      });
      state.showRoleDialog = false;
      // 更新列表中的角色和应用
      let user = state.users.find(u => u.account === state.roleUser.account);
      if (user) {
        user.role_type = state.roleUser.role_type;
        user.app_key = state.roleUser.app_key;
      }
    }else{
      context.proxy.$toast({
        icon: 'error',
        text: `修改失败: ${code} ${msg || ''}`,
        duration: 3000
      });
    }
  });
}
</script>
<template>
  <PageSection title-key="menu.account.users">
    <template #actions>
      <div class="cicon cicon-add cim-button cim-button-bg" @click="onShowEdit(true)">{{ t('userManager.action.addUser') }}</div>
    </template>
    <table class="table cim-table">
      <thead>
        <tr>
          <th>{{ t('userManager.table.account') }}</th>
          <th>{{ t('userManager.table.role') }}</th>
          <th>{{ t('userManager.table.password') }}</th>
          <th>{{ t('userManager.table.status') }}</th>
          <th>{{ t('userManager.table.createdTime') }}</th>
          <th class="cim-td-c">{{ t('userManager.table.operation') }}</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="(user, index) in state.users">
          <td>{{ user.account }}</td>
          <td>
            <span :class="['role-badge', user.role_type == USER_ROLE_TYPE.ADMIN ? 'role-super' : 'role-normal']">
              {{ user.role_type == USER_ROLE_TYPE.ADMIN ? '系统管理员' : '应用管理员' }}
            </span>
          </td>
          <td>**** ****</td>
          <td class="cicon" :class="{ 'cicon-success': user.state == USER_STATE.ENABLE, 'cicon-error': user.state == USER_STATE.DISABLE }">
            {{ user.state == USER_STATE.ENABLE ? t('common.status.enabled') : t('common.status.disabled') }}
          </td>
          <td>{{ user.time }}</td>
          <td class="cim-td-c cim-td-operate">
            <a class="btn-link cim-btn-link" type="button" @click="onShowRoleDialog(user)">修改角色</a>
            <a class="btn-link cim-btn-link" type="button" v-if="user.role_type == USER_ROLE_TYPE.USER"  @click="onShowBindApp(true, user)">{{ t('userManager.action.bindApp') }}</a>
            <a class="btn-link cim-btn-link" type="button" v-if="user.role_type == USER_ROLE_TYPE.USER" @click="onOperate(user)">{{ user.state == USER_STATE.DISABLE ? t('userManager.action.enable') : t('userManager.action.disable')}}</a>
            <a class="btn-link cim-btn-link" type="button" v-if="user.role_type == USER_ROLE_TYPE.USER" @click="onDelete(index)">{{ t('userManager.action.delete') }}</a>
          </td>
        </tr>
      </tbody>
    </table>
    <ModifyDialog :show="state.isShowEdit" :title="t('userManager.dialog.title')" @hide="onShowEdit(false)" @save="onSave()">
      <div class="row g-2 cim-row">
        <div class="form-floating">
          <input class="form-control" :disabled="state.user.created_time" v-model="state.user.account" type="text" :placeholder="t('userManager.field.account')" autocomplete="off"  @input="onInput('account')">
          <label>{{ t('userManager.field.account') }}</label>
          <div class="invalid-feedback feedback" v-if="state.accountErrorMsg">{{ state.accountErrorMsg }}</div>
        </div>
        <div class="form-floating">
          <input class="form-control" v-model="state.user.password" type="text" :placeholder="t('userManager.field.password')" @input="onInput('pwd')">
          <label>{{ t('userManager.field.password') }}</label>
          <div class="invalid-feedback feedback" v-if="state.pwdErrorMsg">{{ state.pwdErrorMsg }}</div>
        </div>
        <div class="form-floating">
          <input class="form-control" v-model="state.user.confirmPasswrod" type="text" :placeholder="t('userManager.field.confirmPassword')" @input="onInput('confirm')">
          <label>{{ t('userManager.field.confirmPassword') }}</label>
          <div class="invalid-feedback feedback" v-if="state.conPwdErrorMsg">{{ state.conPwdErrorMsg }}</div>
        </div>
        <div class="form-floating">
          <select class="form-select" v-model="state.user.role">
            <option :value="item.value" v-for="item in state.roles" >{{ item.labelKey ? t(item.labelKey, {}, item.name) : item.name }}</option>
          </select>
          <label>{{ t('userManager.field.userRole') }}</label>
        </div>
        <!-- 应用选择（仅应用管理员需要） -->
        <div class="form-floating" v-if="state.user.role == USER_ROLE_TYPE.USER">
          <select class="form-select" v-model="state.user.app_key">
            <option value="" disabled>请选择绑定的应用</option>
            <option :value="app.app_key" v-for="app in state.apps" :key="app.app_key">{{ app.app_name }} ({{ app.app_key }})</option>
          </select>
          <label>绑定应用（应用管理员必填）</label>
        </div>
        <input type="password" autocomplete="new-password" style="display: none;" />
      </div>
    </ModifyDialog>

    <BindAppDialog :show="state.isShowBindApp" :title="t('userManager.dialog.bindTitle')" :account="state.selectUser.account" @hide="onShowBindApp(false)" @save="onBindApp()"></BindAppDialog>

    <!-- 修改角色弹窗 -->
    <div class="modal" v-if="state.showRoleDialog">
      <div class="modal-dialog">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title">修改管理员角色</h5>
            <button type="button" class="close" @click="state.showRoleDialog = false">&times;</button>
          </div>
          <div class="modal-body">
            <div class="form-group">
              <label>管理员账号</label>
              <input type="text" class="form-control" :value="state.roleUser.account" disabled>
            </div>
            <div class="form-group">
              <label>角色类型</label>
              <select class="form-control" v-model="state.roleUser.role_type">
                <option :value="USER_ROLE_TYPE.ADMIN">系统管理员（全局仅1个）</option>
                <option :value="USER_ROLE_TYPE.USER">应用管理员</option>
              </select>
              <div class="role-tip" v-if="state.roleUser.role_type == USER_ROLE_TYPE.ADMIN">
                注意：系统管理员全局只能有1个，设置后当前系统管理员将自动降级为应用管理员。
              </div>
              <!-- 应用选择（仅应用管理员需要） -->
              <div class="form-group" v-if="state.roleUser.role_type == USER_ROLE_TYPE.USER" style="margin-top: 15px;">
                <label>绑定应用</label>
                <select class="form-control" v-model="state.roleUser.app_key">
                  <option value="" disabled>请选择绑定的应用</option>
                  <option :value="app.app_key" v-for="app in state.apps" :key="app.app_key">{{ app.app_name }} ({{ app.app_key }})</option>
                </select>
                <small class="text-muted">应用管理员只能管理绑定的应用</small>
              </div>
              <span class="text-danger small" v-if="state.roleErrorMsg">{{ state.roleErrorMsg }}</span>
            </div>
          </div>
          <div class="modal-footer">
            <button type="button" class="btn btn-secondary" @click="state.showRoleDialog = false">取消</button>
            <button type="button" class="btn btn-primary" @click="onRoleSave">确认修改</button>
          </div>
        </div>
      </div>
    </div>
  </PageSection>
</template>

<style scoped>
.role-badge {
  display: inline-block;
  padding: 2px 8px;
  border-radius: 4px;
  font-size: 12px;
  font-weight: 500;
}
.role-super {
  background: #fef3c7;
  color: #92400e;
  border: 1px solid #fcd34d;
}
.role-normal {
  background: #dbeafe;
  color: #1e40af;
  border: 1px solid #93c5fd;
}
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
select.form-control {
  cursor: pointer;
}
.role-tip {
  margin-top: 8px;
  padding: 8px 12px;
  background: #fffbeb;
  border: 1px solid #fcd34d;
  border-radius: 4px;
  font-size: 12px;
  color: #92400e;
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
.text-danger {
  color: #dc2626;
}
.small {
  font-size: 12px;
}
.cim-td-operate {
  display: flex;
  gap: 10px;
  justify-content: center;
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
</style>
