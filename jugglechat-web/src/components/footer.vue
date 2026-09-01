<script setup>
import im from "../common/im";
let juggle = im.getCurrent();
</script>

<template>
  <div class="jg-footer" v-if="!juggle.isDesktop()">
    <img src="/logo.png" class="jg-footer-logo" alt="乐享">
    <span>Copyright © 2026 乐享 版权所有</span>
  </div>
</template>
