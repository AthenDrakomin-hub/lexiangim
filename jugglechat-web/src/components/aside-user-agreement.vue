<script setup>
import { reactive, watch, getCurrentInstance } from "vue";
import utils from "../common/utils";
import { Group, User } from "../services";
import Storage from "../common/storage";
import { STORAGE, RESPONSE, USER_AGREEMENT } from "../common/enum";
import Asider from "./aside.vue";

const props = defineProps(["isShow", "right", "title", "url"]);
const emit = defineEmits(["oncancel", "onfinish"]);
const { proxy } = getCurrentInstance();

let state = reactive({
  url: '',
  title: '',
  type: '',
  content: ''
});

// 乐享用户协议内容
const userAgreementContent = `
乐享IM用户服务协议

更新日期：2026年9月1日
生效日期：2026年9月1日

欢迎使用乐享IM！请您仔细阅读本协议的全部内容。

一、服务说明
1.1 乐享IM是一款即时通讯应用，为用户提供文字、语音、视频、文件传输等通讯服务。
1.2 本服务由乐享通信团队提供。

二、账号注册与使用
2.1 用户需通过企业号注册账号，确保提供真实、准确的信息。
2.2 用户应妥善保管账号和密码，对账号下的所有行为负责。
2.3 用户不得将账号转让、出借给他人使用。

三、用户行为规范
3.1 用户在使用本服务时，应遵守中华人民共和国相关法律法规。
3.2 用户不得利用本服务从事以下活动：
  （1）发布、传播违法违规内容；
  （2）侵犯他人合法权益；
  （3）进行任何可能影响服务正常运行的行为。

四、隐私保护
4.1 我们重视用户隐私保护，具体请参阅《乐享IM隐私政策》。
4.2 未经用户同意，我们不会向第三方披露用户个人信息。

五、服务变更与终止
5.1 我们有权根据业务发展需要，变更或终止部分服务。
5.2 用户违反本协议时，我们有权暂停或终止提供服务。

六、免责声明
6.1 因不可抗力导致服务中断的，我们不承担责任。
6.2 用户因使用本服务产生的任何损失，我们在法律允许的范围内不承担责任。

七、协议修改
7.1 我们有权随时修改本协议，修改后的协议将在应用内公示。
7.2 用户继续使用本服务即视为接受修改后的协议。

八、联系我们
如您对本协议有任何疑问，请通过应用内反馈渠道联系我们。
`;

// 乐享隐私政策内容
const privacyPolicyContent = `
乐享IM隐私政策

更新日期：2026年9月1日
生效日期：2026年9月1日

我们深知个人信息对您的重要性，将按照法律法规要求，采取相应安全保护措施。

一、我们收集的信息
1.1 账号信息：您注册时提供的昵称、头像、企业号等。
1.2 通讯信息：您在使用服务过程中产生的聊天记录、文件等。
1.3 设备信息：设备型号、操作系统版本、IP地址等。
1.4 日志信息：服务访问时间、访问记录等。

二、信息使用
2.1 用于提供、维护和改进我们的服务。
2.2 用于向您发送服务通知和更新。
2.3 用于安全防护，防止欺诈和滥用。

三、信息共享
3.1 未经您的同意，我们不会向第三方共享您的个人信息。
3.2 法律法规要求或为保护公共利益时除外。

四、信息存储
4.1 您的信息存储在中华人民共和国境内的服务器上。
4.2 我们采取加密、访问控制等安全措施保护您的信息。

五、您的权利
5.1 您有权访问、更正、删除您的个人信息。
5.2 您有权注销账号。
5.3 您有权撤回授权同意。

六、未成年人保护
6.1 我们非常重视未成年人个人信息保护。
6.2 如您是未成年人，请在监护人指导下使用本服务。

七、联系我们
如您对本隐私政策有任何疑问，请通过应用内反馈渠道联系我们。
`;

// 关于乐享内容
const aboutContent = `
关于乐享IM

版本：1.0.0
更新日期：2026年9月1日

乐享IM - 沟通无界，协同有度

乐享IM是一款专为团队协作打造的即时通讯应用，致力于为用户提供安全、高效、愉悦的沟通体验。

核心功能：
• 即时消息：支持文字、表情、图片、文件、视频等多种消息类型
• 群组聊天：支持创建群组，方便团队沟通协作
• 语音视频：高清语音视频通话，让沟通更亲近
• 文件传输：便捷的文件分享，支持多种格式
• 消息收藏：重要消息一键收藏，随时查看
• 多端同步：支持多设备登录，消息实时同步

品牌理念：
乐享，让沟通更快乐。我们相信，好的沟通工具应该是简单、高效、令人愉悦的。

技术支持：
如您在使用过程中遇到任何问题，请通过以下方式联系我们：
• 应用内反馈
• 邮箱：support@lexiangim.com

乐享通信团队 版权所有
`;

function getContentByType(type) {
  if (type === USER_AGREEMENT.USER) return userAgreementContent;
  if (type === USER_AGREEMENT.PRIVACY) return privacyPolicyContent;
  if (type === 'about') return aboutContent;
  return '';
}

function onCancel() {
  emit('oncancel', {});
}

watch(() => props.isShow, () => {
  if(props.isShow){
    utils.extend(state, { 
      url: props.url, 
      title: props.title,
      type: props.url,
      content: getContentByType(props.url)
    });
  }else{
    utils.extend(state, { url: '', title: '', type: '', content: '' });
  }
});

</script>

<template>
  <Asider :is-show="props.isShow" :title="state.title" @oncancel="onCancel" :right="props.right">
    <div class="jg-aside-uagreement-body">
      <!-- 本地内容展示 -->
      <div class="jg-agreement-content" v-if="state.content">
        <pre class="jg-agreement-text">{{ state.content }}</pre>
      </div>
      <!-- 外部链接（备用） -->
      <iframe class="content" :src="state.url" frameborder="0" v-else-if="state.url && state.url.startsWith('http')"></iframe>
      <!-- 空状态 -->
      <div class="jg-agreement-empty" v-else>
        <div class="jg-empty-icon">📄</div>
        <div class="jg-empty-text">内容加载中...</div>
      </div>
    </div>
  </Asider>
</template>

<style scoped>
.jg-aside-uagreement-body {
  height: 100%;
  overflow: hidden;
}
.jg-agreement-content {
  height: 100%;
  overflow-y: auto;
  padding: 20px;
}
.jg-agreement-text {
  white-space: pre-wrap;
  word-wrap: break-word;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  font-size: 14px;
  line-height: 1.8;
  color: #333;
  margin: 0;
}

/* 深色模式协议文本 */
.jg-agreement-text {
  color: var(--jg-text-body);
}

.content {
  width: 100%;
  height: 100%;
  border: none;
}

.jg-agreement-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  padding: 40px;
}

.jg-empty-icon {
  font-size: 48px;
  margin-bottom: 16px;
  opacity: 0.6;
}

.jg-empty-text {
  font-size: 14px;
  color: #999;
}

/* 深色模式空状态文本 */
.jg-empty-text {
  color: var(--jg-text-muted);
}
</style>
