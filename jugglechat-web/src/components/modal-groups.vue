<script setup>
import { DialogRoot, DialogOverlay, DialogContent } from "reka-ui";
import im from "../common/im";
import common from "../common/common";
import { reactive, watch, getCurrentInstance } from "vue";
import utils from "../common/utils";
import { Group } from "../services";
import Storage from "../common/storage";
import emitter from "../common/emmit";
const props = defineProps(["isShow"]);
const emit = defineEmits(["oncancel", "onconfirm"]);
let context = getCurrentInstance();

let juggle = im.getCurrent();

let state = reactive({
  list: []
});

function onSelected(item){
  utils.map(state.list, (_item) => {
    _item.checked = false;
    if(utils.isEqual(item.time, _item.time)){
      _item.checked = !item.checked;
    }
  })
}
function onCancel() {
  emit('oncancel', {});
}

function onConfirm() {
  let item = utils.filter(state.list, (item) => {
    return item.checked;
  })[0];
  emit('onconfirm', item);
}

function onAdd(){
  let tag = { id: `T${Date.now()}`, name: '', isInner: false, type: '' }
  state.list.push(tag)
  scrollBottom();
}
function onRemove(index){
  let item = state.list[index];
  if(item.isInner){
    return;
  }
  state.list.splice(index, 1);
  emitter && emitter.$emit('CONVERSATION_TAG_CHANGED', { isRemove: true, tag: item })
}
function onSave(index){
  let item = state.list[index];
  if(utils.isEqual(item.name.length, 0)){
    return;
  }
  context.proxy.$toast({ text: `保存成功`, icon: 'success' });
}
function scrollBottom() {
  nextTick(() => {
    let { groups } = context.refs;
    if (groups) {
      groups.scrollTop = groups.scrollHeight;
    }
  });
}
</script>
<template>
  <DialogRoot :open="props.isShow" @update:open="(v) => !v && onCancel()">
    <DialogContent root-class="modal tyn-modal jg-conver-group-modal" :class="[props.isShow ? 'fade show' : '']">
      <div class="modal-dialog modal-dialog-centered modal-sm">
        <div class="modal-content border-0">
          <div class="modal-body">
            <div class="jg-modal-header">
              <div class="title">会话分组</div>
              <ul class="jg-conversations-tools">
                <li class="jg-conversation-tool wr wr-cir-add jg-modal-add" @click="onAdd">添加</li>
              </ul>
            </div>
            <ul class="tyn-media-list" ref="groups">
              <li v-for="(item, index) in state.list" class="jg-conver-modal-group">
                <div class="jg-conver-group-name" :class="{ 'wr-asterisk jg-text-danger': item.name.length == 0 }">
                  <span class="wr wr-cir-remove jg-text-danger" :class="{'jg-text-disable': item.isInner}" @click="onRemove(index)"></span>
                  <input type="text" class="form-control" placeholder="请输入分组名称（回车保存）" :disabled="item.isInner" v-model="item.name" @keydown.enter="onSave(index)">
                </div>
                <div class="jg-conver-group-desc" :class="{'jg-conver-group-desc-custom': !item.isInner}">{{ item.isInner ? '系统分组' : '自定义分组' }}</div>
              </li>
            </ul>
            <ul class="tyn-list-inline gap gap-3 pt-3 tny-content-center">
              <li>
                <button class="btn btn-sm btn-light" @click="onCancel()">取消</button>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </DialogContent>
    <DialogOverlay :class="{ 'show': props.isShow }" class="modal-backdrop fade" />
  </DialogRoot>
</template>
