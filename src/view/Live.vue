<script setup lang="ts">

import { ref, onMounted, computed, watch, toRefs, createApp, h, reactive } from 'vue';
import Danmu from "../components/Danmu.vue";
import { initLive } from './Live';
import { closeLiveWin } from '../renderer/index';
const { props } = toRefs(reactive(initLive()));
const videoDiv = ref<any>(null);

const screenWidth = ref(window.innerWidth || document.documentElement.clientWidth || document.body.clientWidth);
let timer: any = null;

const danmuScroll = ()=> {
  props.value.isPointerEvents = true;
  props.value.isScroll = true;
  clearTimeout(timer);
  timer = setTimeout(() => {
    props.value.isScroll = false;
  }, 5000);
}

const renderDanmu = () => {
  setTimeout(() => {
    const danmu = {
      render() {
        return h(Danmu, {
          danmuData: props.value.danmuData,
          isPause: props.value.isPause,
          isLive: props.value.isLive,
          isShow: props.value.isDanmuShow,
          isScroll: props.value.isScroll,
          isPointerEvents: props.value.isPointerEvents,
          "onUpdate:isPointerEvents": (value: boolean) => props.value.isPointerEvents = value,
          nowtime: props.value.now_time,
          "onUpdate:nowtime": (value: number) => props.value.now_time = value,
          "onUpdate:isScroll": (value: boolean) => props.value.isScroll = value,
          onScroll: () => danmuScroll()
        });
      }
    }
    const dom$ = document.querySelector('.dplayer-menu');
    if(dom$){
      createApp(danmu).mount(dom$);
    };
    //dplayer-controller
    setTimeout(() => {
      Object.keys(videoDiv.value.childNodes).map(index => {
        const item = videoDiv.value.childNodes[index];
        if(item.className === "dplayer-controller") {
          props.value.danmuBottom = item.clientHeight;
        }
      });
    }, 2000);
  }, 2000);
}

onMounted(async() => {
  window.onresize = () => {
    return (() => {
      screenWidth.value = window.innerWidth || document.documentElement.clientWidth || document.body.clientWidth
    })();
  }
  renderDanmu();
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

watch(() => props.value.dPlayer, (newVal) => {
    renderDanmu();
  }, {
    immediate: true,
    deep: true
  }
);

watch(() => props.value.timeout, (newVal) => {
  if(newVal as number > 20 && props.value.isShowAlert) {
    props.value.closeLive && props.value.closeLive()
  }
});

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
