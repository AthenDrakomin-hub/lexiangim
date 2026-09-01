<script setup>
import { SelectRoot, SelectTrigger, SelectContent, SelectItem, SelectValue } from "reka-ui";
import { reactive, watch } from "vue";
import utils from "../common/utils";
import { EMOJI_POS_LIST } from "../common/enum";
const props = defineProps(['uid', 'current', 'list']);
const emit = defineEmits(["onchanged"]);

let state = reactive({
  current: props.current
});
function onChanged(value) {
  emit('onchanged', { value, uid: props.uid });
}
watch(() => props.current, () => {
  state.current = props.current;
})
</script>
<template>
  <div>
    <SelectRoot :model-value="state.current" @update:model-value="onChanged">
      <SelectTrigger class="jg-select">
        <SelectValue placeholder="请选择" />
      </SelectTrigger>
      <SelectContent class="form-select jg-select-content">
        <SelectItem v-for="item in props.list" :value="item.value" class="jg-select-item">
          {{ item.name }}
        </SelectItem>
      </SelectContent>
    </SelectRoot>
  </div>
</template>
