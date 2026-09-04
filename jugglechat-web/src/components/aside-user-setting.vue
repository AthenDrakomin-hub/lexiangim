<script setup>
import { reactive, watch, getCurrentInstance } from "vue";
import utils from "../common/utils";
import common from "../common/common";
import emitter from "../common/emmit";
import Asider from "./aside.vue";

import AsiderUserUpdate from "./aside-user-update.vue";
import AsiderUserConfig from "./aside-user-config.vue";
import AsiderUserAccount from "./aside-user-account.vue";
import AsiderQrCode from "./aside-qrcode.vue";
import AsideFavoriteMsg from "./aside-msg-favorite.vue";
import AsideUserAgreement from "./aside-user-agreement.vue";
import VipMultiAccount from "./aside-vip-multi-account.vue";
import VipIpMonitor from "./aside-vip-ip-monitor.vue";
import VipIpChanges from "./aside-vip-ip-changes.vue";
import VipService from "../services/vipservice";

import { User } from "../services/index";
import { RESPONSE, STORAGE, ASIDE_MENU_TYPE, EVENT_NAME, SETTING_CARDS, USER_AGREEMENT } from "../common/enum";
import Storage from "../common/storage";

const context = getCurrentInstance();
const props = defineProps(["isShow"]);
const emit = defineEmits(["oncancel"]);

let user = Storage.get(STORAGE.USER_TOKEN);
let state = reactive({
  user: user,
  cards: SETTING_CARDS,
  isShowUserUpdateAsider: false,
  isShowUserSettingAsider: false,
  isShowAccountAsider: false,
  isShowUserQrcode: false,
  isShowFavoriteMsg: false,
  isShowUserAgreement: false,
  isShowVipMultiAccount: false,
  isShowVipIpMonitor: false,
  isShowVipIpChanges: false,
  userAgreentUrl: '',
  userAgreentTitle: '',
});

function onLogout(){
  emitter.$emit(EVENT_NAME.UN_UNATHORIZED);
}

function onClick(menu){
  let { event } = menu;
  if(utils.isEqual(event, ASIDE_MENU_TYPE.USER_UPDATE)){
    onShowUserUpdateAsider(true);
  }
  if(utils.isEqual(event, ASIDE_MENU_TYPE.USER_SETTING)){
    onShowUserSettingAsider(true);
  }
  if(utils.isEqual(event, ASIDE_MENU_TYPE.USER_ACCOUNT)){
    onShowAccountAsider(true);
  }
  if(utils.isEqual(event, ASIDE_MENU_TYPE.USER_QRCODE)){
    onShowUserQrCode(true);
  }
  if(utils.isEqual(event, ASIDE_MENU_TYPE.USER_FAV)){
    onShowFavoriteMsg(true);
  }
  if(utils.isEqual(event, ASIDE_MENU_TYPE.USER_AGREENMENT)){
    onShowUserAgreement(true, USER_AGREEMENT.USER, '用户协议');
  }
  if(utils.isEqual(event, ASIDE_MENU_TYPE.USER_PRIVACY)){
    onShowUserAgreement(true, USER_AGREEMENT.PRIVACY, '隐私协议');
  }
  if(utils.isEqual(event, ASIDE_MENU_TYPE.USER_LOGOUT)){
    emitter.$emit(EVENT_NAME.UN_UNATHORIZED);
  }
  // VIP功能
  if(utils.isEqual(event, ASIDE_MENU_TYPE.ADMIN_MULTI_ACCOUNT)){
    state.isShowVipMultiAccount = true;
  }
  if(utils.isEqual(event, ASIDE_MENU_TYPE.ADMIN_IP_MONITOR)){
    state.isShowVipIpMonitor = true;
  }
  if(utils.isEqual(event, ASIDE_MENU_TYPE.ADMIN_IP_CHANGES)){
    state.isShowVipIpChanges = true;
  }
}
function onShowFavoriteMsg(isShow){
  state.isShowFavoriteMsg = isShow;
}
function onShowUserAgreement(isShow, url, title){
  utils.extend(state, { isShowUserAgreement: isShow, userAgreentUrl: url, userAgreentTitle: title });
}
function onShowUserQrCode(isShow){
  state.isShowUserQrcode = isShow;
}
function onShowUserUpdateAsider(isShow){
  state.isShowUserUpdateAsider = isShow;
}
function onShowUserSettingAsider(isShow){
  state.isShowUserSettingAsider = isShow;
}
function onShowAccountAsider(isShow){
  state.isShowAccountAsider = isShow;
}
function onCancel() {
  emit('oncancel', {});
}

// VIP角色检测
let isVip = false;
async function checkVipRole() {
  try {
    let data = await VipService.getUserRole();
    isVip = data && data.role === 1;
    state.cards = SETTING_CARDS.filter(card => {
      if (card.isVip && !isVip) return false;
      return true;
    });
  } catch (e) {
    console.error('检查VIP角色失败', e);
  }
}
checkVipRole();

emitter.$on(EVENT_NAME.ON_USER_INFO_UPDATE, ({ user }) => {
  utils.extend(state.user, { ...user });
});
</script>

<template>
  <Asider :is-show="props.isShow" :title="'个人设置'" @oncancel="onCancel" :cls="'jg-aside-ust-box'">
    <div class="jg-aside-userst-body jg-setting-aside">
      <ul class="jg-cards">
          <li class="jg-card jg-card-userinfo">
            <ul class="jg-ul">
              <li class="jg-li jg-card-li-userinfo">
                <div class="tyn-avatar jg-header-user-avatar" :style="{ 'background-image': 'url(' + state.user.portrait + ')' }"></div>
                <div class="jg-header-user-name">{{ state.user.name }}</div>
              </li>
              <li class="jg-li">
                <div class="label">用户 ID</div>
                <div class="value">{{ state.user.id }}</div>
              </li>
            </ul>
          </li>
          <li class="jg-card" v-for="card in state.cards">
            <ul class="jg-ul">
              <li class="jg-li" v-for="menu in card.menus" @click.prevent="onClick(menu)">
                <a class="wr " :class="{ ['wr-' + menu.icon]: true, 'jg-force-warn-letter': menu.isWarn }">{{ menu.name }}</a>
              </li>
            </ul>
          </li>
        </ul>
    </div>
  </Asider>
  <AsiderUserUpdate :is-show="state.isShowUserUpdateAsider" @oncancel="onShowUserUpdateAsider(false)"></AsiderUserUpdate>
  <AsiderUserConfig :is-show="state.isShowUserSettingAsider" @oncancel="onShowUserSettingAsider(false)"></AsiderUserConfig>
  <AsiderUserAccount :is-show="state.isShowAccountAsider" @oncancel="onShowAccountAsider(false)"></AsiderUserAccount>
  <AsideFavoriteMsg :is-show="state.isShowFavoriteMsg" @oncancel="onShowFavoriteMsg(false)"></AsideFavoriteMsg>

  <AsideUserAgreement
    :is-show="state.isShowUserAgreement"
    :right="0"
    :url="state.userAgreentUrl"
    :title="state.userAgreentTitle"
    @oncancel="onShowUserAgreement(false)"></AsideUserAgreement>

  <AsiderQrCode
    :is-show="state.isShowUserQrcode"
    :right="0"
    :title="'我的二维码'"
    :desc="'扫一扫二维码，加我为好友'"
    :isGroup="0"
    :uid="state.user.id"
    @oncancel="onShowUserQrCode(false)">
  </AsiderQrCode>

  <!-- VIP功能组件 -->
  <VipMultiAccount :is-show="state.isShowVipMultiAccount" @oncancel="state.isShowVipMultiAccount = false"></VipMultiAccount>
  <VipIpMonitor :is-show="state.isShowVipIpMonitor" @oncancel="state.isShowVipIpMonitor = false"></VipIpMonitor>
  <VipIpChanges :is-show="state.isShowVipIpChanges" @oncancel="state.isShowVipIpChanges = false"></VipIpChanges>

</template>
