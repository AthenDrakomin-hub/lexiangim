<script setup>
import { SwitchRoot } from "reka-ui";
import { reactive, watch } from "vue";
import utils from "../common/utils";
const props = defineProps(['isChecked', 'uid']);
const emit = defineEmits(["onchanged"]);
let state = reactive({});

function onChanged(checked) {
  emit('onchanged', { uid: props.uid, isOpen: checked })
}
</script>
<template>
  <SwitchRoot
    class="jg-switch"
    :checked="props.isChecked"
    @update:checked="onChanged"
    aria-label="toggle"
  >
    <span class="jg-switch-slider" />
  </SwitchRoot>
</template>
