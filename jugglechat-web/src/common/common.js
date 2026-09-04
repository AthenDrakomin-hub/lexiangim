import utils from "./utils";
import { User, Group, Friend } from "../services/index";
import html2canvas from 'html2canvas';
import im from './im';
import { IGNORE_CONVERSATIONS, FILE_TYPE } from "../common/enum"
import  MarkdownIt from 'markdown-it';

function isElementTop(message){
  var chatNode = document.querySelector('.tyn-chat-body');
  var messageNode = document.querySelector(`div[messageid="${message.messageId}"]`);
  if(!messageNode){
    messageNode = document.querySelector(`div[messageid="${message.tid}"]`);
  }
  let num = chatNode.offsetTop-messageNode.getBoundingClientRect().bottom;
  return num > -200;
}
function isConversationElementTop(conversation){
  var chatNode = document.querySelector('.tyn-aside-list');
  var node = chatNode.querySelector(`li[uid="${conversation.conversationType}_${conversation.conversationId}"]`);
  let num = chatNode.offsetTop-node.getBoundingClientRect().bottom;
  return num > -200;
}
function getAvatars(){
  // 使用预生成的精美默认头像（8款不同风格）
  return [
    '/avatars/avatar-1.png',
    '/avatars/avatar-2.png',
    '/avatars/avatar-3.png',
    '/avatars/avatar-4.png',
    '/avatars/avatar-5.png',
    '/avatars/avatar-6.png',
    '/avatars/avatar-7.png',
    '/avatars/avatar-8.png',
  ];
}
function getAvatar(seed){
  let avatars = getAvatars();
  let index;
  if (seed) {
    let hash = 0;
    for (let i = 0; i < seed.length; i++) {
      hash = ((hash << 5) - hash) + seed.charCodeAt(i);
      hash |= 0;
    }
    index = Math.abs(hash) % avatars.length;
  } else {
    index = Math.floor(Math.random() * avatars.length);
  }
  return avatars[index];
}

let textAvatars = {};
let __textAvatarCount = 0;
const MAX_TEXT_AVATARS = 500;
function getTextAvatar(name, option = {}){
  let avatar = textAvatars[name];
  if(avatar){
    return avatar;
  }
  if(name.length == 0){
    name = 'JG'
  }
  let textLen = name.length;
  let text = name;
  if(textLen > 2){
    text = text.substr(textLen - 2);
  }
  let { height = 100, width = 100 } = option;
  let colors = [150, text.charCodeAt(0), 120];
  let cvs = document.createElement("canvas");
  cvs.setAttribute('width', width);
  cvs.setAttribute('height', height);
  let ctx = cvs.getContext("2d");
  ctx.fillStyle = `rgb(${colors.join(',')})`;
  ctx.fillRect(0, 0, width, height);
  ctx.fillStyle = '#FFF';
  let isZH = utils.isChinese(text);
  let size = isZH ? 0.38 : 0.4;
  ctx.font = `${ width * size }px Arial`;
  ctx.textBaseline = "middle";
  ctx.textAlign = "center";
  let fix = ctx.measureText(text).actualBoundingBoxDescent/2;
  ctx.fillText(text,width/2, height/2 + fix/2);
  let url = cvs.toDataURL('image/jpeg', 1);
  textAvatars[name] = url;
  return url;
}
function uploadBase64(str, callback){
  User.getFileToken({ file_type: FILE_TYPE.IMAGE, ext: 'png' }).then(({ code, data }) => {
    fetch(str).then((res) => {
      return res.blob()
    }).then((blob) => {
      let { OssOf: { PreSignResp: { url } }} = data;
      let xhr = new XMLHttpRequest();
      xhr.onreadystatechange=function(){
        if (utils.isEqual(xhr.readyState, 4)){
          url = url.split('?')[0]
          callback(url);
        }
      }
      xhr.open('PUT', url, true);
      xhr.setRequestHeader('Content-Type', '');
      let file = new File([blob], 'avatar.png', { type: 'image/png' });
      xhr.send(file);
    });
  });
}
/* 
let groupAvatars = [
  { avatar: 'https://file.lwoowl.cn/36dc-db4c.png?attname=36dc-db4c.png' },  
];
common.createGroupAvatar(groupAvatars, ({url}) => {
})
*/
function createGroupAvatar(members, callback){
  let memberLen = members.length;
  let parent = document.createElement('div');
  parent.classList = ['tyn-group-avatars'];
  parent.id = 'group_avatar_temp';
  parent.style.height = '100px';
  parent.style.width = '100px';
  utils.forEach(members, (member) => {
    let size = memberLen < 5 ? 45 : 28;
    let child = document.createElement('div');
    child.classList = ['tyn-group-avatar'];
    child.style.backgroundImage = `url(${member.avatar || member.portrait})`;
    child.style.height = `${size}%`;
    child.style.width = `${size}%`;
    parent.appendChild(child);
  });
  document.body.appendChild(parent);
  html2canvas(parent, { 
    useCORS: true,
  }).then(canvas => {
    let url = canvas.toDataURL('image/png', 1);
    document.body.removeChild(parent);
    uploadBase64(url, (avatar) => {
      callback(avatar);
    })
  });
}

function getConversationInfo(params, callback){
  let { type, id } = params;
  let juggle = im.getCurrent();
  let { ConversationType } = juggle;
  let isGroup = utils.isEqual(Number(type), ConversationType.GROUP);

  let isBot = utils.isInclude(id, 'botid');

  if(isBot){
    return Friend.getBots({ count: 50 }).then(result => {
      let { data = {}  }  = result;
      let { items } = data;
      items = items || [];
      let index = utils.find(items, (item) => {
        return utils.isEqual(item.bot_id, id);
      });
      let info = items[index] || { nickname: '', avatar: getAvatar(id) };
      callback(info);
    });
  }
  if(isGroup){
    return Group.get(params, callback);
  }
  if(!isGroup){
    Friend.get(params, callback);
  }
}

function htmlToContent(content){
  return content.replace(/<[^>]+>/gi, '');
}
function calcSize(params, patch = 20){
  let { width, height } = params;
  let maxWidth = 270;
  let maxHeight = 240;
  if(utils.isMobile()){
    maxWidth = 240;
  }
  width = width || maxWidth;
  height = height || maxHeight;

  let isWidth = true;
  if(height > width){
    isWidth = false;
  }

  let ratio = 1;
  if(width > maxWidth && isWidth){
    ratio = maxWidth / width;
  }

  if( height > maxHeight && !isWidth){
    ratio = maxHeight / height;
  }
  width = width * ratio;
  height = height * ratio + patch;
  return { width, height }
}
function formatTags(tags){
  let tagIcons = {
    jg_all: 'jg-icon-msg',
    jg_mentionme: 'jg-icon-mention',
    jg_private: 'jg-icon-user-group',
    jg_unread: 'jg-icon-unread',
    jg_group: 'jg-icon-group',
  };
  // let groups = utils.map(tags, (tag) => {
  //   let icon = tagIcons[tag.id] || 'jg-icon-tag';
  //   let isInner = tag.type > 0;
  //   let isActive = utils.isEqual(tag.id, 'jg_all');
  //   utils.extend(tag, { icon, isActive, isInner });
  //   return tag;
  // });

  //暂时只保留全部会话和自定义会话，和服务端约定后可删除
  let groups = [];
  utils.forEach(tags, (tag) => {
    if(!tagIcons[tag.id]){
      let icon = 'jg-icon-tag';
      let isInner = tag.type > 0;
      utils.extend(tag, { icon, isActive: false, isInner });
      groups.push(tag);
    }
  });
  groups.unshift({ id: 'jg_all', name: '消息', icon: 'jg-icon-msg', isActive: true, isInner: true})
  return groups;
}

function getConversationTime(sentTime) {
  let str = utils.getCurrentTime();
  let current = new Date(str);
  let time = utils.formatTime(sentTime, "MM-dd hh:mm");
  if (sentTime > current) {
    time = utils.formatTime(sentTime, "hh:mm");
  }
  return time;
}
function formatMention(conversation) {
  let { mentions = {} } = conversation;
  let f_mentionContent = "";
  if (mentions.isMentioned) {
    f_mentionContent = "有人@我";
  }
  return utils.extend(conversation, { f_mentionContent });
}
function formatSeconds(times) {
  var hh = parseInt(times / 60 / 60 );
  hh = hh < 10 ? '0' + hh : hh;
  var mm = parseInt(times / 60 % 60);
  mm = mm < 10 ? '0' + mm : mm;
  var ss = parseInt(times % 60);
  ss = ss < 10 ? '0' + ss : ss;
  let seconds =  mm + ':' + ss;
  return seconds;
}
function filterIgnoreConversations(conversations){
  return utils.filter(conversations, (item) => {
    return !utils.isInclude(IGNORE_CONVERSATIONS, item.conversationId);
  });
}

let md = MarkdownIt();
function formatMarkdown(content){
  return md.render(content);
}

// Async markdown renderer via Web Worker (Comlink) — avoids blocking main thread for long lists
export async function formatMarkdownAsync(content) {
  if (!content) return '';
  try {
    const { formatMarkdownAsync: fn } = await import('./markdown-worker.js');
    return await fn(content);
  } catch (e) {
    console.warn('[common] formatMarkdownAsync fallback:', e);
    return formatMarkdown(content);
  }
}

export default {
 isElementTop,
 getAvatar,
 getAvatars,
 getTextAvatar,
 createGroupAvatar,
 getConversationInfo,
 htmlToContent,
 calcSize,
 formatTags,
 isConversationElementTop,
 getConversationTime,
 formatMention,
 formatSeconds,
 filterIgnoreConversations,
 formatMarkdown,
 formatMarkdownAsync,
}
