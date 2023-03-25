<script setup lang="ts">

import flvjs from 'flv.js'
import { ref, onMounted, nextTick } from 'vue'
import { ipcRenderer } from 'electron'
import Hls from 'hls.js'
import DPlayer from 'dplayer'

defineProps<{ msg: string }>()

const count = ref(0)
const videoId = ref('')
let isLive = true;
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
          const flvPlayer = flvjs.createPlayer({
            type: 'flv',
            url: src
          })
          flvPlayer.attachMediaElement(video)
          flvPlayer.load()
          // flvPlayer.play()
          flvPlayer.on('error', e => {
            // 这里是视频加载失败
          })
        }
      }
    }
  });
  return dp;
}

function initVideoSourc(source: string) {
  const src = isLive ?
    `http://localhost:8088/live/${videoId.value}.flv` :
      source;
  const dp: DPlayer = isLive ? livePlaer(src) : recordPlaer(src);
  dp.fullScreen.request('web');
  dp.play();
}

onMounted(async() => {
  nextTick(() => {
    // initVideoSourc();
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
</style>
