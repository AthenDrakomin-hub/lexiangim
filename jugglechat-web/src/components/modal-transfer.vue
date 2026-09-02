<script setup>
import { DialogRoot, DialogOverlay, DialogContent } from "reka-ui";
import im from "../common/im";
import common from "../common/common";
import { reactive } from "vue";
import utils from "../common/utils";

const props = defineProps(["isShow"]);
const emit = defineEmits(["oncancel", "onconfirm"]);
let juggle = im.getCurrent();
let state = reactive({
  conversations: []
});

if(im.isConnected()){
  juggle.getConversations({}).then(({ conversations }) => {
    conversations = common.filterIgnoreConversations(conversations);
    utils.extend(state, { conversations })
  });
}

function onCancel(){
  emit('oncancel', {});
}
function onConfirm(){
  let list = utils.filter(state.conversations, (item) => {
    return item.isTransferChecked;
  });
  let conversations = utils.clone(list)
  emit('onconfirm', { conversations });
  utils.forEach(list, (item) => {
    utils.extend(item, { isTransferChecked: false });
  });
}
function onSelected(item){
  item.isTransferChecked = !item.isTransferChecked;
}
</script>
<template>
  <DialogRoot :open="props.isShow" @update:open="(v) => !v && onCancel()">
    <DialogContent root-class="modal tyn-modal" :class="[props.isShow ? 'fade show' : '']">
      <div class="modal-dialog modal-dialog-centered modal-sm">
        <div class="modal-content border-0">
          <div class="modal-body">
            <h4 class="pb-2">最近联系人</h4>
            <ul class="tyn-media-list gap gap-2">
              <li v-for="item in state.conversations" @click="onSelected(item)">
                <div class="form-check form-check-algin">
                  <span class="wr tyn-tfcontact-s" :class="[item.isTransferChecked ? 'jg-icon-success-square tyn-contact-checked' : 'jg-icon-square']"></span>
                  <div class="form-check-label">
                    <div class="tyn-media-group">
                    <div class="tyn-media jg-size-md tyn-conver-avatar"
                      :style="{ 'background-image': 'url(' + item.conversationPortrait + ')' }">
                    </div>
                    <div class="tyn-media-col">
                      <div class="tyn-media-row">
                        <h6 class="name">{{ item.conversationTitle }}</h6>
                      </div>
                    </div>
                  </div>
                  </div>
                </div>
              </li>
            </ul>
            <ul class="tyn-list-inline gap gap-3 pt-3 tny-content-center">
              <li>
                <button class="btn btn-md btn-success" @click="onConfirm()">确认</button>
              </li>
              <li>
                <button class="btn btn-md btn-light" @click="onCancel()">取消</button>
              </li>
            </ul>
          </div>
          <button @click="onCancel()" class="btn btn-md btn-icon btn-pill btn-white shadow position-absolute top-0 end-0 mt-n3 me-n3 wr jg-icon-close"></button>
        </div>
      </div>
    </DialogContent>
    <DialogOverlay :class="{'show': props.isShow}" class="modal-backdrop fade" />
  </DialogRoot>
</template>
