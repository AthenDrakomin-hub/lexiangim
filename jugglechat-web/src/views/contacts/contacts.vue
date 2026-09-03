<script setup>
import utils from "../../common/utils";
import ContactDetail from "./detail.vue";
import AsiderContactDetail from "../../components/aside-contact-detail.vue";
import AsiderFriendAdd from "../../components/aside-friend-add.vue";
import AsiderGroupAddMember from "../../components/aside-group-add-member.vue";
import { useRouter } from "vue-router";
import Dropmenu from "./dropmenu.vue";
import { reactive, getCurrentInstance, watch } from "vue";
import { CONTACT_TAB_TYPE, RESPONSE, EVENT_NAME, CONTACT_TYPE, FRIEND_APPLY_STATUS, IGNORE_CONVERSATIONS, SYS_CONVERSATION_FRIEND }  from "../../common/enum";

import H5TBar from "../conversation/conversation-tbar.vue";
import H5Header from "../conversation/conversation-header.vue";

import im from "../../common/im";
import { STORAGE } from "../../common/enum";
import Storage from "../../common/storage";
import { Friend, Group } from "../../services/index";
import common from "../../common/common";
import emitter from "../../common/emmit";

let juggle = im.getCurrent();
let { ConversationType, Event, ConnectionState } = juggle;

let tabs = [
    { id: Date.now(), name: '联系人', type: CONTACT_TYPE.FRIEND, icon: 'contact', isActive: true },
    { id: SYS_CONVERSATION_FRIEND, name: '新朋友', type: CONTACT_TYPE.NEW_FRIEND, unreadCount: 0, icon: 'adduser', isActive: false },
    { id: Date.now(), name: '群组', type: CONTACT_TYPE.GROUP, icon: 'group', isActive: false },
    { id: Date.now(), name: '智能体', type: CONTACT_TYPE.BOT, icon: 'bot', isActive: false },
  ];
let contacts = [];
let groups = [];
let newContacts = [];
const { proxy } = getCurrentInstance();
let state = reactive({
  tabs: tabs,
  currentTab: tabs[0].type,
  contacts: contacts,
  groups: groups,
  currentList: contacts,
  current: {},
  isShowAddFriend: false,
  isShowDetail: false,
  isShowCreateGroup: false,
});

function onConversationChanged({ conversations }){
  utils.forEach(conversations, (conversation) => {
    let { conversationId } = conversation;
    if(!utils.isInclude(IGNORE_CONVERSATIONS, conversationId)){
      return;
    }
    utils.forEach(state.tabs, (menu) => {
      if(utils.isEqual(menu.id, conversationId)){
        let { latestUnreadIndex, unreadCount } = conversation;
        utils.extend(menu, { latestUnreadIndex, unreadCount  });
      }
    });
  });
}
juggle.on(Event.CONVERSATION_CHANGED, onConversationChanged);
juggle.on(Event.CONVERSATION_ADDED, onConversationChanged);

let user = Storage.get(STORAGE.USER_TOKEN);
im.connect(user, {
  success: (_user) => {
    juggle.getConversation({ conversationId: SYS_CONVERSATION_FRIEND, conversationType: ConversationType.SYSTEM }).then(({ conversation }) => {
      let index = utils.find(state.tabs, (menu) => { 
        return utils.isEqual(menu.type, CONTACT_TYPE.NEW_FRIEND)
      });
      let menu = state.tabs[index];
      let { latestUnreadIndex, unreadCount } = conversation;
      utils.extend(menu, { latestUnreadIndex, unreadCount  });
    });
  },
  error: () => {}
});


emitter.$on(EVENT_NAME.ON_ADDED_FRIEND, (friend) => {
  state.contacts.push(friend);
  if(utils.isEqual(state.currentTab, CONTACT_TAB_TYPE.FRIEND )){
    state.currentList.push(friend);
  }
});
function onShowProfile(item){
  state.currentList.map((_item) => {
    _item.isSelected = utils.isEqual(item.id, _item.id);
    return _item;
  });
  state.current = item;
  onShowDetail(true)
}
function onShowDetail(isShow){
  state.isShowDetail = isShow;
}
function onShowAddFriend(isShow){
  state.isShowAddFriend = isShow;
}
function onShowCreateGroup(isShow){
  state.isShowCreateGroup = isShow;
}
function onTab(tab){
  if(utils.isEqual(tab.type, CONTACT_TYPE.FRIEND)){
    getFriends();
  }
  if(utils.isEqual(tab.type, CONTACT_TYPE.GROUP)){
    getGroups();
  }
  if(utils.isEqual(tab.type, CONTACT_TYPE.NEW_FRIEND)){
    getNewFriends();
    juggle.clearUnreadcount({ conversationType: ConversationType.SYSTEM, conversationId: SYS_CONVERSATION_FRIEND, unreadIndex: tab.latestUnreadIndex });
  }
  if(utils.isEqual(tab.type, CONTACT_TYPE.BOT)){
    getBots();
  }
  state.current = {};
  utils.map(state.tabs, (_tab) => {
    let isActive = utils.isEqual(_tab.type, tab.type);
    _tab.isActive = isActive;
    return _tab;
  });
}
function getBots(){
  Friend.getBots({ count: 50 }).then((result) => {
    let { data: { items }, code } = result;
    if(!utils.isEqual(code, RESPONSE.SUCCESS)){
      return proxy.$toast({ text: `获取失败`, icon: 'error' });
    }
    let list = utils.map(items, (item) => {
      let { bot_id, nickname, avatar } = item;
      return {
        id: bot_id,
        type: CONTACT_TYPE.BOT, 
        name: nickname, 
        avatar: avatar || common.getTextAvatar(nickname), 
        isSelected: false
      };
    });
    state.currentList = list;
  });
}

function getNewFriends(start = 0){
  Friend.getNewList({ start, count: 50, order: 0 }).then((result) => {
    let { data: { items = [] }, code } = result;
    if(!utils.isEqual(code, RESPONSE.SUCCESS)){
      return proxy.$toast({ text: `获取失败`, icon: 'error' });
    }

    let user = Storage.get(STORAGE.USER_TOKEN);

    let list = utils.map(items, (item) => {
      let { id, target_user, is_sponsor = false, status = FRIEND_APPLY_STATUS.APPLYING } = item;
      
      let _user = target_user;
      let avatar = target_user.avatar || common.getTextAvatar(target_user.nickname || target_user.user_id);
      let content = `${target_user.nickname || target_user.user_id} 添加你为好友`;
      if(is_sponsor){
        content = `你添加 ${target_user.nickname || target_user.user_id} 为好友`;
      }
      return {
        id: utils.getUUID(),
        type: CONTACT_TYPE.NEW_FRIEND, 
        name: content, 
        avatar: avatar,
        status: status,
        user: _user,
        isOneSelf: is_sponsor,
        statusName: getFriendApplyName(status),
        isSelected: false
      };
    });
    if(start == 0){
      newContacts = list;
    }else{
      newContacts = newContacts.concat(list);
    }
    
    state.currentList = newContacts;
  });
}
let statusMap = {};
statusMap[FRIEND_APPLY_STATUS.APPLYING] = '待处理';
statusMap[FRIEND_APPLY_STATUS.ACCEPTED] = '已添加';
statusMap[FRIEND_APPLY_STATUS.DECLINED] = '已拒绝';
statusMap[FRIEND_APPLY_STATUS.EXPIRED] = '已过期';
function onAddFriend({ item }){
  item.status = FRIEND_APPLY_STATUS.ACCEPTED;
  item.statusName = statusMap[item.status];
  onShowDetail(false);
}
function onRemoveFriend({ item }){
  let index = utils.find(state.currentList, (contact) => {
    return utils.isEqual(contact.id, item.id);
  });
  if(index > -1){
    state.currentList.splice(index, 1);
  }
  state.current = {};
  onShowDetail(false);
}
function getFriendApplyName(status){
  return statusMap[status] || '';
}
function getFriends(startUserId = ''){
  if(!utils.isEmpty(contacts) && utils.isEmpty(startUserId)){
    return state.currentList = contacts;
  }
  let user = Storage.get(STORAGE.USER_TOKEN);
  Friend.getList({ userId: user.id, count: 20, startUserId }).then((result) => {
    let { data: { items }, code } = result;
    if(!utils.isEqual(code, RESPONSE.SUCCESS)){
      return proxy.$toast({ text: `获取失败`, icon: 'error' });
    }

    let list = utils.map(items, (item) => {
      let { user_id, nickname, avatar, signature } = item;
      return {
        id: user_id,
        type: CONTACT_TYPE.FRIEND, 
        name: nickname, 
        avatar: avatar || common.getTextAvatar(nickname), 
        signature: signature || '',
        isSelected: false
      };
    });
    contacts = contacts.concat(list);
    state.currentList = contacts;
  });
}

function getGroups(startId = ''){
  if(!utils.isEmpty(groups) && utils.isEmpty(startId)){
    return state.currentList = groups;
  }
  let user = Storage.get(STORAGE.USER_TOKEN);
  Group.getList({ count: 20, startId }).then((result) => {
    let { data: { items }, code } = result;
    if(!utils.isEqual(code, RESPONSE.SUCCESS)){
      return proxy.$toast({ text: `获取失败`, icon: 'error' });
    }

    let list = utils.map(items, (item) => {
      let { group_id, group_name, group_portrait } = item;
      return {
        id: group_id,
        type: CONTACT_TYPE.GROUP, 
        name: group_name, 
        avatar: group_portrait, 
        isSelected: false
      };
    });
    groups = groups.concat(list);
    state.currentList = groups;
  });
}

const router = useRouter();
let useRouterCurrent = reactive(router);
watch(useRouterCurrent, (val) => {
  getFriends();
})
getFriends();
</script>
<template>
  <div class="tyn-contact tyn-content tyn-content-full-height tyn-chat has-aside-base">
    <div class="tyn-aside tyn-contact-aside">
      <H5Header></H5Header>
      <div class="tyn-aside-row pt-1 tyn-aside-contact-row">
        <ul class="nav nav-tabs nav-tabs-line jg-contact-navs">
          <li class="nav-item" v-for="tab in state.tabs">
            <div class="nav-unreadcount" v-if="tab.unreadCount > 0">{{ tab.unreadCount }}</div>
            <button class="nav-link wr" :class="{['wr-' + tab.icon]: true, 'active': tab.isActive}" type="button" @click="onTab(tab)">{{ tab.name }}</button>
          </li>
        </ul>
        <!-- 操作按钮 -->
        <div class="jg-contact-actions">
          <button class="jg-contact-action-btn wr jg-icon-user-add" title="添加好友" @click="onShowAddFriend(true)"></button>
          <button class="jg-contact-action-btn wr jg-icon-group" title="创建群组" @click="onShowCreateGroup(true)"></button>
        </div>
      </div>
      <div class="tyn-aside-body">
        <div class="tab-content">
          <div class="tab-pane show active">
            <ul class="tyn-aside-list">
              <li class="tyn-aside-item js-toggle-main" 
                v-for="item in state.currentList" 
                :class="{'active': item.isSelected}" 
                @click="onShowProfile(item)">
                <div class="tyn-media-group">
                  <div class="tyn-media jg-size-rg contact-avatar" :style="{'background-image': 'url(' + item.avatar +')'}"></div>
                  <div class="tyn-media-col">
                    <div class="tyn-media-row"><h6 class="name">{{ item.name }}</h6></div>
                    <div class="tyn-media-row jg-contact-signature" v-if="item.signature">{{ item.signature }}</div>
                  </div>
                  <div class="jg-friend-applystatus" v-if="utils.isEqual(item.type, CONTACT_TYPE.NEW_FRIEND)">{{ item.statusName }}</div>
                </div>
              </li>
              <!-- 空状态 -->
              <li class="jg-contact-empty" v-if="state.currentList.length == 0">
                <div class="jg-empty-icon">
                  <template v-if="utils.isEqual(state.currentTab, CONTACT_TYPE.FRIEND)">👥</template>
                  <template v-else-if="utils.isEqual(state.currentTab, CONTACT_TYPE.NEW_FRIEND)">📨</template>
                  <template v-else-if="utils.isEqual(state.currentTab, CONTACT_TYPE.GROUP)">👨‍👩‍👧‍👦</template>
                  <template v-else>🤖</template>
                </div>
                <div class="jg-empty-title">
                  <template v-if="utils.isEqual(state.currentTab, CONTACT_TYPE.FRIEND)">暂无联系人</template>
                  <template v-else-if="utils.isEqual(state.currentTab, CONTACT_TYPE.NEW_FRIEND)">暂无新好友请求</template>
                  <template v-else-if="utils.isEqual(state.currentTab, CONTACT_TYPE.GROUP)">暂无群组</template>
                  <template v-else>暂无智能体</template>
                </div>
                <div class="jg-empty-desc">
                  <template v-if="utils.isEqual(state.currentTab, CONTACT_TYPE.FRIEND)">点击右上角添加好友按钮开始添加</template>
                  <template v-else-if="utils.isEqual(state.currentTab, CONTACT_TYPE.GROUP)">点击右上角创建群组按钮创建群组</template>
                  <template v-else>暂无内容</template>
                </div>
              </li>
            </ul>
          </div>
        </div>
      </div>
      <!-- <H5TBar></H5TBar> -->
    </div>
    <ContactDetail v-if="state.isShowDetail && !utils.isMobile()" :current="state.current" @onadded="onAddFriend" @onremoved="onRemoveFriend"></ContactDetail>
  </div>
  <AsiderContactDetail :is-show="state.isShowDetail && utils.isMobile()" :current="state.current" @onadded="onAddFriend" @onremoved="onRemoveFriend" @oncancel="onShowDetail(false)"></AsiderContactDetail>
  <AsiderFriendAdd :is-show="state.isShowAddFriend" @oncancel="onShowAddFriend(false)"></AsiderFriendAdd>
  <AsiderGroupAddMember :is-show="state.isShowCreateGroup" :conversation="null" :members="[]" :right="false" @oncancel="onShowCreateGroup(false)" @onconfirm="onGroupCreated"></AsiderGroupAddMember>
</template>

<style scoped>
.jg-contact-actions {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-left: auto;
  padding-right: 12px;
}
.jg-contact-action-btn {
  width: 32px;
  height: 32px;
  border: none;
  background: transparent;
  cursor: pointer;
  border-radius: 6px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background 0.2s;
}
.jg-contact-action-btn:hover {
  background: #f0f0f0;
}

/* 深色模式联系人操作按钮 */
.jg-contact-action-btn:hover {
  background: var(--jg-bg-hover);
}

.jg-contact-signature {
  font-size: 12px;
  color: #999;
  margin-top: 2px;
  max-width: 180px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

/* 深色模式联系人签名 */
.jg-contact-signature {
  color: var(--jg-text-muted);
}
.jg-contact-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 60px 20px;
  text-align: center;
}
.jg-empty-icon {
  font-size: 48px;
  margin-bottom: 16px;
  opacity: 0.6;
}
.jg-empty-title {
  font-size: 16px;
  font-weight: 600;
  color: #333;
  margin-bottom: 8px;
}

/* 深色模式空状态标题 */
.jg-empty-title {
  color: var(--jg-text-body);
}

.jg-empty-desc {
  font-size: 13px;
  color: #999;
  line-height: 1.6;
  max-width: 240px;
}

/* 深色模式空状态描述 */
.jg-empty-desc {
  color: var(--jg-text-muted);
}
</style>
