<script setup lang="ts">

import { ref, onMounted, computed, watch, toRefs } from 'vue';
import NimChatroomSocket from '../utils/NimChatroomSocket';
import { initLive } from './Live'
const emit = defineEmits([ 'update:isPointerEvents', 'update:now_time']);
const { props } = toRefs(initLive());
const isPointerEvents = ref(false);
const radian = ref(0);
const screenWidth = ref(window.innerWidth || document.documentElement.clientWidth || document.body.clientWidth);


onMounted(async() => {
  window.onresize = () => {
    return (() => {
      screenWidth.value = window.innerWidth || document.documentElement.clientWidth || document.body.clientWidth
    })();
  }
});

watch(screenWidth, (newVal) => {
  screenWidth.value = newVal;
});

watch(() => props.value.isPointerEvents, (newVal) => {
  props.value.videoDiv && props.value.videoDiv.style.setProperty("--danmu-pointer-events", newVal ? 'auto' : 'none');
  }, {
    immediate: true,
    deep: true
  }
);

const clcStyle = computed(() => {
  const style: any = {};
  style["width"] = "100% !important";
  style["--video-display"] = props.value.liveType === 1 ? "block" : "none";
  style["--danmu-pointer-events"] = props.value.isPointerEvents ? 'auto' : 'none';
  style["--danmu-bottom"] = `${(props.value.danmuBottom || 0) + 3}px`;
  style["--danmu-transform"] = `${props.value.radian}deg`;
  return style;
});
</script>

<template>
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
