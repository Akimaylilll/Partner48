<script setup lang="ts">
import { ipcRenderer } from 'electron';
import { ref, onMounted, computed, watch, toRefs, createApp, h, reactive, nextTick } from 'vue';
import Danmu from "../components/Danmu.vue";
import { useDPlayerStore } from '../store/useDPlayerStore';
import { closeLiveWin } from '../renderer/index';
import { storeToRefs } from "pinia";

const dPlayerStore = useDPlayerStore();
const { initLive } = dPlayerStore;
const { danmuData, clcStyle, isPointerEvents } = storeToRefs(dPlayerStore);

nextTick(() => {
  ipcRenderer.send('modal-accomplish');
  initLive();
});
watch(isPointerEvents, (newVal) => {
  document.getElementById('myVideo')?.style.setProperty("--danmu-pointer-events", newVal ? 'auto' : 'none');
});
</script>

<template>
  <img src="../img/loading.svg" style="width: 50px;height:50px;margin: auto">
  <div id="myVideo" ref="videoDiv" :style="clcStyle">
  </div>
</template>

<style scoped>
.read-the-docs {
  color: #888;
}
#myVideo :deep(.dplayer-menu-show) {
  display: none !important;
}
#myVideo :deep(.dplayer-video-current) {
  display: var(--video-display) !important;
  transform: rotate(var(--danmu-transform)) !important;
}
#myVideo :deep(.dplayer-comment) {
  display: none;
}
#myVideo :deep(.dplayer-setting-danunlimit) {
  display: none;
}
#myVideo :deep(.dplayer-menu) {
  position: unset;
  display: block;
}
#myVideo :deep(.dplayer-full) {
  display: none;
}
#myVideo :deep(.dplayer-notice-list) {
  z-index: 4;
}
#myVideo :deep(.dplayer-setting-danmaku) {
  display: none;
}

</style>
