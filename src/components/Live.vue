<script setup lang="ts">

import flvjs from 'flv.js'
import { ref, onMounted, nextTick } from 'vue'
import { ipcRenderer } from 'electron'
import Hls from 'hls.js'
import DPlayer, { DPlayerEvents } from 'dplayer'
import { closeLiveWin } from '../renderer/index'

defineProps<{ msg: string }>()

const count = ref(0)
const videoId = ref('')
let isLive = true;
let isPause = true;
let flvPlayer: flvjs.Player | null = null;
ipcRenderer.once('open-video-id', function (event, arg, userName, source) { // 接收到Main进程返回的消息
  videoId.value = arg;
  document.title = userName;
  if(source.indexOf('.m3u8') > -1){
    isLive = false;
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

function initVideoSourc(source: string) {
  const src = isLive ?
    `http://localhost:8936/live/${videoId.value}.flv` :
      source;
  const dp: DPlayer = isLive ? livePlaer(src) : recordPlaer(src);
  dp.on('pause' as DPlayerEvents, function() {
    isPause = false;
  });
  dp.on('play' as DPlayerEvents, function() {
    isPause = true;
  });
  dp.on('ended' as DPlayerEvents, function() {
    alert('直播结束')
    closeLiveWin(videoId.value);
  });
  dp.fullScreen.request('web');
  dp.play();
}

onMounted(async() => {
  nextTick(() => {
    // initVideoSourc();
    setInterval(() => {
      if (flvPlayer?.buffered.length && isPause) {
        let end = flvPlayer.buffered.end(0);//获取当前buffered值
        let diff = end - flvPlayer.currentTime;//获取buffered与currentTime的差值
        if (diff >= 0.5) {//如果差值大于等于0.5 手动跳帧 这里可根据自身需求来定
          flvPlayer.currentTime = flvPlayer.buffered.end(0) - 1.5;//手动跳帧
        }
      }
    }, 2000); //2000毫秒执行一次
  })
});

</script>

<template>
  <div id="myVideo" style="width: 100%;"></div>
</template>

<style scoped>
.read-the-docs {
  color: #888;
}
/deep/.dplayer-menu-show {
  display: none !important;
}
</style>
