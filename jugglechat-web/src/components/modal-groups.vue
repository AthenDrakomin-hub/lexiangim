<script setup>
import { reactive, watch, nextTick } from "vue";
import utils from "../common/utils";
import emitter from "../common/emmit";

const props = defineProps(["isShow"]);
const emit = defineEmits(["oncancel", "onconfirm"]);

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
  });
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
}

function scrollBottom() {
  nextTick(() => {
    let groups = document.querySelector('.jg-modal-groups-list');
    if (groups) {
      groups.scrollTop = groups.scrollHeight;
    }
  });
}

watch(() => props.isShow, (newVal) => {
  if (newVal) {
    // 可以在这里初始化列表数据
  }
});
</script>

<template>
  <div class="jg-modal-overlay" v-if="props.isShow" @click.self="onCancel">
    <div class="jg-modal-container">
      <div class="jg-modal-header">
        <div class="jg-modal-title">创建群组</div>
        <button class="jg-modal-close" @click="onCancel">
          <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M6 6L18 18M18 6L6 18" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
          </svg>
        </button>
      </div>
      <div class="jg-modal-body">
        <div class="jg-modal-form-group">
          <label class="jg-modal-label">群组名称</label>
          <input type="text" class="jg-modal-input" placeholder="请输入群组名称" maxlength="50">
        </div>
        <div class="jg-modal-form-group">
          <label class="jg-modal-label">群组描述</label>
          <textarea class="jg-modal-textarea" placeholder="请输入群组描述（选填）" maxlength="200" rows="3"></textarea>
        </div>
        <div class="jg-modal-form-group">
          <label class="jg-modal-label">选择成员</label>
          <div class="jg-modal-member-hint">暂未实现成员选择功能，创建后可在群组设置中添加成员</div>
        </div>
      </div>
      <div class="jg-modal-footer">
        <button class="jg-modal-btn jg-modal-btn-cancel" @click="onCancel">取消</button>
        <button class="jg-modal-btn jg-modal-btn-confirm" @click="onConfirm">创建</button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.jg-modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  backdrop-filter: blur(4px);
  -webkit-backdrop-filter: blur(4px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 9999;
  animation: jg-modal-fade-in 0.2s ease;
}

@keyframes jg-modal-fade-in {
  from { opacity: 0; }
  to { opacity: 1; }
}

.jg-modal-container {
  width: 90%;
  max-width: 480px;
  max-height: 85vh;
  background: var(--jg-bg-card, #ffffff);
  border-radius: 16px;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
  display: flex;
  flex-direction: column;
  overflow: hidden;
  animation: jg-modal-scale-in 0.25s ease;
}

@keyframes jg-modal-scale-in {
  from {
    opacity: 0;
    transform: scale(0.95) translateY(10px);
  }
  to {
    opacity: 1;
    transform: scale(1) translateY(0);
  }
}

.jg-modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 20px 24px;
  border-bottom: 1px solid var(--jg-border-color, #e5e7eb);
  flex-shrink: 0;
}

.jg-modal-title {
  font-size: 18px;
  font-weight: 600;
  color: var(--jg-text-body, #1f2937);
}

.jg-modal-close {
  width: 32px;
  height: 32px;
  border: none;
  background: transparent;
  color: var(--jg-text-muted, #9ca3af);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 8px;
  transition: all 0.2s ease;
  padding: 0;
}

.jg-modal-close:hover {
  background: var(--jg-bg-hover, #f3f4f6);
  color: var(--jg-text-body, #4b5563);
}

.jg-modal-close svg {
  width: 18px;
  height: 18px;
}

.jg-modal-body {
  flex: 1;
  overflow-y: auto;
  padding: 24px;
}

.jg-modal-form-group {
  margin-bottom: 20px;
}

.jg-modal-form-group:last-child {
  margin-bottom: 0;
}

.jg-modal-label {
  display: block;
  font-size: 14px;
  font-weight: 500;
  color: var(--jg-text-body, #374151);
  margin-bottom: 8px;
}

.jg-modal-input {
  width: 100%;
  height: 42px;
  padding: 0 14px;
  border: 1px solid var(--jg-border-color, #d1d5db);
  border-radius: 8px;
  font-size: 14px;
  color: var(--jg-text-body, #1f2937);
  background: var(--jg-bg-input, #fff);
  transition: all 0.2s ease;
  box-sizing: border-box;
}

.jg-modal-input:focus {
  outline: none;
  border-color: var(--jg-primary, #5865f2);
  box-shadow: 0 0 0 3px rgba(88, 101, 242, 0.1);
}

.jg-modal-input::placeholder {
  color: var(--jg-text-muted, #9ca3af);
}

.jg-modal-textarea {
  width: 100%;
  padding: 10px 14px;
  border: 1px solid var(--jg-border-color, #d1d5db);
  border-radius: 8px;
  font-size: 14px;
  color: var(--jg-text-body, #1f2937);
  background: var(--jg-bg-input, #fff);
  resize: vertical;
  transition: all 0.2s ease;
  box-sizing: border-box;
  font-family: inherit;
}

.jg-modal-textarea:focus {
  outline: none;
  border-color: var(--jg-primary, #5865f2);
  box-shadow: 0 0 0 3px rgba(88, 101, 242, 0.1);
}

.jg-modal-textarea::placeholder {
  color: var(--jg-text-muted, #9ca3af);
}

.jg-modal-member-hint {
  font-size: 13px;
  color: var(--jg-text-muted, #9ca3af);
  padding: 12px;
  background: var(--jg-bg-hover, #f9fafb);
  border-radius: 8px;
  line-height: 1.5;
}

.jg-modal-footer {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  padding: 16px 24px;
  border-top: 1px solid var(--jg-border-color, #e5e7eb);
  flex-shrink: 0;
}

.jg-modal-btn {
  height: 40px;
  padding: 0 24px;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
  border: none;
}

.jg-modal-btn-cancel {
  background: var(--jg-bg-hover, #f3f4f6);
  color: var(--jg-text-body, #4b5563);
}

.jg-modal-btn-cancel:hover {
  background: var(--jg-border-color, #e5e7eb);
}

.jg-modal-btn-confirm {
  background: linear-gradient(135deg, #5865f2 0%, #4752c4 100%);
  color: #ffffff;
}

.jg-modal-btn-confirm:hover {
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(88, 101, 242, 0.4);
}

/* 深色模式 */
[data-bs-theme="dark"] .jg-modal-container {
  background: var(--jg-bg-card, #1f2937);
}

[data-bs-theme="dark"] .jg-modal-header {
  border-bottom-color: var(--jg-border-color, #374151);
}

[data-bs-theme="dark"] .jg-modal-footer {
  border-top-color: var(--jg-border-color, #374151);
}

[data-bs-theme="dark"] .jg-modal-input,
[data-bs-theme="dark"] .jg-modal-textarea {
  background: var(--jg-bg-input, #111827);
  border-color: var(--jg-border-color, #374151);
}

[data-bs-theme="dark"] .jg-modal-member-hint {
  background: var(--jg-bg-hover, #111827);
}

[data-bs-theme="dark"] .jg-modal-btn-cancel {
  background: var(--jg-bg-hover, #374151);
  color: var(--jg-text-body, #d1d5db);
}
</style>
