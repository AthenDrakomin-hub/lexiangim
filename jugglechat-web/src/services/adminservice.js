import { request } from './request'
import ADMIN_SERVER_PATH from './admin'
import { RESPONSE } from '../common/enum'

function buildUrl(base, params) {
  if (!params || Object.keys(params).length === 0) return base
  const query = Object.entries(params)
    .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(v)}`)
    .join('&')
  return base + (base.includes('?') ? '&' : '?') + query
}

function post(url, data) {
  return request(url, {
    method: 'POST',
    body: JSON.stringify(data || {})
  })
}

let Admin = {
  // 获取当前用户角色
  async getUserRole() {
    let res = await request(ADMIN_SERVER_PATH.GET_USER_ROLE)
    if (res.code == RESPONSE.SUCCESS) {
      return res.data
    }
    return { role: 0 }
  },

  // 设置用户角色（管理后台调用）
  async setUserRole(userId, role) {
    let res = await post(ADMIN_SERVER_PATH.SET_USER_ROLE, { user_id: userId, role })
    return res.code == RESPONSE.SUCCESS
  },

  // 添加多开账号
  async addMultiAccount(subUserId, subToken) {
    let res = await post(ADMIN_SERVER_PATH.ADD_MULTI_ACCOUNT, { sub_user_id: subUserId, sub_token: subToken })
    return res.code == RESPONSE.SUCCESS
  },

  // 获取多开账号列表
  async getMultiAccounts() {
    let res = await request(ADMIN_SERVER_PATH.GET_MULTI_ACCOUNTS)
    if (res.code == RESPONSE.SUCCESS) {
      return res.data.list || []
    }
    return []
  },

  // 切换多开账号
  async switchMultiAccount(subUserId) {
    let res = await post(ADMIN_SERVER_PATH.SWITCH_MULTI_ACCOUNT, { sub_user_id: subUserId })
    if (res.code == RESPONSE.SUCCESS) {
      return res.data
    }
    return null
  },

  // 移除多开账号
  async removeMultiAccount(subUserId) {
    let res = await post(ADMIN_SERVER_PATH.REMOVE_MULTI_ACCOUNT, { sub_user_id: subUserId })
    return res.code == RESPONSE.SUCCESS
  },

  // 获取所有用户IP状态
  async getAllUsersIpStatus(page = 1, pageSize = 20, keyword = '') {
    let params = { page, page_size: pageSize }
    if (keyword) params.keyword = keyword
    let res = await request(buildUrl(ADMIN_SERVER_PATH.GET_ALL_USERS_IP_STATUS, params))
    if (res.code == RESPONSE.SUCCESS) {
      return res.data
    }
    return { list: [], total: 0 }
  },

  // 获取用户IP历史
  async getUserIpHistory(userId, page = 1, pageSize = 20) {
    let params = { user_id: userId, page, page_size: pageSize }
    let res = await request(buildUrl(ADMIN_SERVER_PATH.GET_USER_IP_HISTORY, params))
    if (res.code == RESPONSE.SUCCESS) {
      return res.data
    }
    return { list: [], total: 0 }
  },

  // 获取IP变动通知
  async getIpChanges(page = 1, pageSize = 20, isRead = null) {
    let params = { page, page_size: pageSize }
    if (isRead !== null) params.is_read = isRead
    let res = await request(buildUrl(ADMIN_SERVER_PATH.GET_IP_CHANGES, params))
    if (res.code == RESPONSE.SUCCESS) {
      return res.data
    }
    return { list: [], total: 0, unread_count: 0 }
  },

  // 标记IP变动已读
  async markIpChangeRead(ids) {
    let res = await post(ADMIN_SERVER_PATH.MARK_IP_CHANGE_READ, { ids })
    return res.code == RESPONSE.SUCCESS
  },
}

export default Admin
