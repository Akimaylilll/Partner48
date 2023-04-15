<script setup lang="ts">

import flvjs from 'flv.js'
import { ref, onMounted, nextTick, computed, watch, createApp, h } from 'vue'
import { ipcRenderer } from 'electron'
import Hls from 'hls.js'
import DPlayer, { DPlayerEvents } from 'dplayer'
import { closeLiveWin, getIMKey } from '../renderer/index'
import Danmu from "./Danmu.vue";
import NimChatroomSocket from '../utils/NimChatroomSocket';
const videoDiv = ref<any>(null);

const count = ref(0)
const videoId = ref('')
let isLive = ref(true);
let isPause = ref(false);
let liveType = ref(1);
let now_time = ref(0);
let danmuData = ref([]);
let danmuBottom = ref(0);
const isDanmuShow = ref(true);
const isPointerEvents = ref(false);
const isScroll = ref(false);
let timer: any = null;
const screenWidth = ref(window.innerWidth || document.documentElement.clientWidth || document.body.clientWidth);
let room_id = "";
let flvPlayer: flvjs.Player | null = null;
const emit = defineEmits([ 'update:isPointerEvents', 'update:now_time']);

ipcRenderer.once('open-video-id', function (event, arg, userName, source, type, danmus, roomId) { // 接收到Main进程返回的消息
  videoId.value = arg;
  liveType.value = type;
  danmuData.value = danmus;
  document.title = userName;
  room_id = roomId;
  if(source.indexOf('.m3u8') > -1){
    isLive.value = false;
  }
  setTimeout(async () => {
    await initVideoSourc(source);
  }, 1000);
});

function recordPlaer (src: string) {
  const dp: DPlayer = new DPlayer({
    live: false,
    preload: 'auto',
    container: document.getElementById('myVideo'),
    danmaku: {
      id: '1234567890',
      api: 'http://localhost:8173/'
    },
    video: {
      url: src,
      type: 'customHls',
      customType: {
        customHls: function (video: any, player: any) {
          const hls = new Hls({enableWorker: false})
          hls.loadSource(video.src)
          hls.attachMedia(video)
        }
      }
    }
  });
  return dp;
}

function flvPlayerInit (src: string, video: any) {
  flvPlayer = flvjs.createPlayer({
    type: 'flv',
    url: src
  }, {
    enableWorker: false,
    enableStashBuffer: false,
    autoCleanupSourceBuffer: true,
    stashInitialSize: 128,
  })
  flvPlayer.attachMediaElement(video)
  flvPlayer.load()
}

function livePlaer (src: string) {
  const dp: DPlayer = new DPlayer({
    live: true,
    preload: 'auto',
    container: document.getElementById('myVideo'),
    danmaku: {
      id: '1234567890',
      api: 'http://localhost:8173/'
    },
    video: {
      url: src, // url地址
      type: 'customFlv',
      customType: {
        customFlv: function(video: any, player: any) {
          flvPlayerInit(src, video);
          // flvPlayer.play()
          flvPlayer?.on('error', e => {
            // 这里是视频加载失败
            console.log(e)
            if (flvPlayer) {
              flvPlayer.pause();
              flvPlayer.unload();
              flvPlayer.detachMediaElement();
              flvPlayer.destroy();
              flvPlayer = null;
              flvPlayerInit(src, video)
            }
          })
        }
      }
    }
  });
  return dp;
}

function handleNewMessage(t: NimChatroomSocket, event: Array<any>): void {
  for (const item of event) {
    // console.log(item);
    if(item.type === "text") {
      const custom = JSON.parse(item.custom);
      // console.log(custom);
      danmuData.value.push([0, 0, 16777215, custom.user.nickName, item.text] as never)
    }
  }
}

async function initVideoSourc(source: string) {
  const src = isLive.value ?
    `ws://localhost:8936/live/${videoId.value}.flv` :
      source;
  const dp: DPlayer = isLive.value ? livePlaer(src) : recordPlaer(src);
  dp.on('pause' as DPlayerEvents, function() {
    isPause.value = true;
  });
  dp.on('play' as DPlayerEvents, function() {
    isPause.value = false;
  });
  dp.on('ended' as DPlayerEvents, function() {
    alert('直播结束')
    closeLiveWin(videoId.value);
  });
  dp.on('playing' as DPlayerEvents, function() {
    now_time.value = dp.video.currentTime;
  });
  //退出全屏事件
  dp.on('webfullscreen_cancel' as DPlayerEvents,function() {
    dp.fullScreen.request('web');
  });
  dp.on('fullscreen_cancel' as DPlayerEvents,function() {
    dp.fullScreen.request('web');
  });
  dp.on('danmaku_show' as DPlayerEvents,function() {
    isDanmuShow.value = true;
  });
  dp.on('danmaku_hide' as DPlayerEvents,function() {
    isDanmuShow.value = false;
  });
  dp.fullScreen.request('web');
  dp.play();

  //dplayer-controller
  Object.keys(videoDiv.value.childNodes).map(index => {
    const item = videoDiv.value.childNodes[index];
    if(item.className === "dplayer-controller") {
      danmuBottom.value = item.clientHeight;
    }
  });
  const appKey = (await getIMKey()) as string;
  if(room_id) {
    const danmu = new NimChatroomSocket({
      roomId: room_id,
      onMessage: handleNewMessage
    });
    danmu.init(appKey);
  }
}

onMounted(async() => {
  window.onresize = () => {
    return (() => {
      screenWidth.value = window.innerWidth || document.documentElement.clientWidth || document.body.clientWidth
    })()
  }

  nextTick(() => {
    // initVideoSourc();
    setTimeout(() =>{
      //挂载danmu
      //TODO: 待优化
      const danmu = {
        render() {
          return h(Danmu, {
            danmuData: danmuData.value,
            isPause: isPause.value,
            isLive: isLive.value,
            isShow: isDanmuShow.value,
            isScroll: isScroll.value,
            isPointerEvents: isPointerEvents.value,
            "onUpdate:isPointerEvents": (value: boolean) => isPointerEvents.value = value,
            nowtime: now_time.value,
            "onUpdate:nowtime": (value: number) => now_time.value = value,
            onScroll: () => danmuScroll()
          });
        }
      }
      const dom$ = document.querySelector('.dplayer-menu');
      if(dom$){
        createApp(danmu).mount(dom$);
      }
    }, 2000);
    setInterval(() => {
      if (flvPlayer?.buffered.length && !isPause.value) {
        let end = flvPlayer.buffered.end(0);//获取当前buffered值
        let diff = end - flvPlayer.currentTime;//获取buffered与currentTime的差值
        if (diff >= 0.5) {//如果差值大于等于0.5 手动跳帧 这里可根据自身需求来定
          flvPlayer.currentTime = flvPlayer.buffered.end(0) - 1.5;//手动跳帧
        }
      }
    }, 2000); //2000毫秒执行一次
  })
});

watch(screenWidth, (newVal) => {
  screenWidth.value = newVal;
});

watch(isPointerEvents, (newVal) => {
    videoDiv?.value && videoDiv.value.style.setProperty("--danmu-pointer-events", newVal ? 'auto' : 'none');
  }, {
    immediate: true,
    deep: true
  }
);

const clcStyle = computed(() => {
  const style: any = {};
  style["width"] = "100% !important";
  style["--video-display"] = liveType.value === 1 ? "block" : "none";
  style["--danmu-pointer-events"] = isPointerEvents.value ? 'auto' : 'none';
  style["--danmu-bottom"] = `${danmuBottom.value + 3}px`;
  return style;
});

const danmuScroll = ()=> {
  isPointerEvents.value = true;
  isScroll.value = true;
  clearTimeout(timer);
  timer = setTimeout(() => {
    isScroll.value = false;
  }, 5000);
}
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
