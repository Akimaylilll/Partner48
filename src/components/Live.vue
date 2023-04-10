<script setup lang="ts">

import flvjs from 'flv.js'
import { ref, onMounted, nextTick, computed, watch } from 'vue'
import { ipcRenderer } from 'electron'
import Hls from 'hls.js'
import DPlayer, { DPlayerEvents } from 'dplayer'
import { closeLiveWin } from '../renderer/index'
import Danmu from "./Danmu.vue";
import NimChatroomSocket from '../utils/NimChatroomSocket';
import { NONAME } from 'dns'

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

ipcRenderer.once('open-video-id', function (event, arg, userName, source, type, danmus, roomId) { // 接收到Main进程返回的消息
  videoId.value = arg;
  liveType.value = type;
  danmuData.value = danmus;
  document.title = userName;
  room_id = roomId;
  if(source.indexOf('.m3u8') > -1){
    isLive.value = false;
  }
  setTimeout(() => {
    initVideoSourc(source);
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
          const hls = new Hls()
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
    enableWorker: true,
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
  const filterMessage: Array<any> = [];
  for (const item of event) {
    // console.log(item);
    if(item.type === "text") {
      const custom = JSON.parse(item.custom);
      // console.log(custom);
      danmuData.value.push([0, 0, 16777215, custom.user.nickName, item.text] as never)
    }
  }
}

function initVideoSourc(source: string) {
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
  if(room_id) {
    const danmu = new NimChatroomSocket({
      roomId: room_id,
      onMessage: handleNewMessage
    });
    danmu.init();
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

const clcStyle = computed(() => {
  const style: any = {};
  style["width"] = "100% !important";
  style["--video-display"] = liveType.value === 1 ? "block" : "none";
  return style;
});
const clcDanmuStyle = computed(() => {
  const style: any = {};
  style["--danmu-width"] = (screenWidth.value - 10) + "px";
  style["--danmu-bottom"] = (danmuBottom.value + 5) + "px";
  style["--danmu-pointer-events"] = isPointerEvents.value ? 'auto' : 'none';
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
  <Danmu class="danmu"
    :style="clcDanmuStyle"
    v-model:nowtime="now_time"
    :danmuData="danmuData"
    :is-live="isLive"
    :is-pause = "isPause"
    :is-show = "isDanmuShow"
    :is-scroll="isScroll"
    v-model:is-pointer-events = "isPointerEvents"
    @scroll="danmuScroll()"
  >
  </Danmu>
</template>

<style scoped>
.read-the-docs {
  color: #888;
}
.danmu {
  bottom: var(--danmu-bottom) !important;
  width: var(--danmu-width) !important;
  position: absolute;
  z-index: 100000;
  left: 0;
  background-color: transparent;
  pointer-events: var(--danmu-pointer-events);
  max-height: 30%;
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
#myVideo :deep(.dplayer-setting-danmaku) {
  display: none;
}
#myVideo :deep(.dplayer-full) {
  display: none;
}
</style>
