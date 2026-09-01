import { CONFIG } from '../config'
import utils from '../common/utils'

let ADMIN_SERVER_PATH = {
  GET_USER_ROLE: 'admin/role',
  SET_USER_ROLE: 'admin/role/set',
  ADD_MULTI_ACCOUNT: 'admin/multi-accounts/add',
  GET_MULTI_ACCOUNTS: 'admin/multi-accounts/list',
  SWITCH_MULTI_ACCOUNT: 'admin/multi-accounts/switch',
  REMOVE_MULTI_ACCOUNT: 'admin/multi-accounts/remove',
  GET_ALL_USERS_IP_STATUS: 'admin/users/ip-status',
  GET_USER_IP_HISTORY: 'admin/users/ip-history',
  GET_IP_CHANGES: 'admin/ip-changes',
  MARK_IP_CHANGE_READ: 'admin/ip-changes/read',
};

utils.forEach(ADMIN_SERVER_PATH, (url, name) => {
  let protoclName = location.protocol;
  if(protoclName == 'file:'){
    protoclName = 'https:';
  }
  ADMIN_SERVER_PATH[name] = `${protoclName}//${CONFIG.API}/jim/${url}`;
});

export default ADMIN_SERVER_PATH;
