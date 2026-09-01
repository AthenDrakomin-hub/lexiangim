<script setup>
import { PopoverRoot, PopoverTrigger, PopoverContent } from "reka-ui";
import { reactive, watch } from "vue";
import im from "../common/im";
import utils from "../common/utils";
import common from "../common/common";
const props = defineProps(['isShow', 'menus']);
const emit = defineEmits(["onhide", "onemit"]);

let state = reactive({
});
</script>
<template>
 <ul class="jg-media-option-list">
    <li class="dropdown">
      <PopoverRoot root-class="header-menu-popover" :open="props.isShow" @update:open="(v) => v && emit('onhide')">
        <PopoverTrigger as-child>
          <span style="display:none" />
        </PopoverTrigger>
        <PopoverContent
          class="dropdown-menu dropdown-menu-end jg-cndrop-show jg-footer-dropdownmenu"
          :class="{'show fadeoutxr': props.isShow}"
          :side-offset="4"
          :align="'end'"
          side="bottom"
        >
          <ul class="tyn-list-links">
            <li @click.stop="emit('onemit', menu)" v-for="menu in props.menus" :class="[ menu.type == 'line' ? 'dropdown-divider' : 'tyn-list-link' ]">
              <a  class="wr " :class="{ ['wr-' + menu.icon]: true, 'jg-force-warn-letter': menu.isWarn }">{{ menu.name }}</a>
            </li>
          </ul>
        </PopoverContent>
      </PopoverRoot>
    </li>
    <div class="dropmenu-backdrop" :class="{'show-menu-back': props.isShow}" @click.stop="emit('onhide')"></div>
  </ul>
</template>
