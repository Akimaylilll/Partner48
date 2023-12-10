import { defineStore } from "pinia";
import { ref, computed, h, createApp } from 'vue';
import Danmu from "../components/Danmu.vue";
import { getIMKey, closeLiveWin } from '../renderer/index';
import { ipcRenderer } from 'electron';
import DPlayer, { DPlayerEvents } from 'dplayer';
import { DANMAKU_ID, DANMAKU_API, LIVE_HOST } from '../config/index';
import NimChatroomSocket from '../utils/NimChatroomSocket';
import flvjs from 'flv.js';
import Hls from 'hls.js';
interface LivePalyer extends DPlayer{
  restartFlvPlayer?: Function | null,
  flvPlayer?: flvjs.Player | null
}

// defineStore 接受两个参数
//  参数1：仓库的id（字符串）
//  参数2：options（对象）
export const useDPlayerStore = defineStore('dPlayer', () => {
  // 定义数据
  const danmuData = ref([] as any);
  const isLive = ref(true);
  let dPlayer: null | DPlayer = null;
  const isPause = ref(false);
  const now_time = ref(0);
  const timeout = ref(0);
  const isDanmuShow = ref(true);
  const isPointerEvents = ref(false);
  const isScroll = ref(false);
  const radian = ref(0);
  const liveType = ref(1);
  const danmuBottom = ref(0);
  const videoId = ref("");

  let timeouter: null | number = null;
  let timer: null | number = null;
  let danmu: NimChatroomSocket | null  = null;
  let isOpenLivePage = true;

  const initLive = () => {
    ipcRenderer.on('video-id', function (event, id: string){
      videoId.value = id;
    });
    ipcRenderer.on('open-video-id', function (event, videoId, userName, source, type, danmus, roomId, danmu_port, live_port) { // 接收到Main进程返回的消息
      console.log("open-video-id", videoId)
      liveType.value = type;
      danmuData.value = danmus;
      if(dPlayer) {
        ((dPlayer as any).flvPlayer as any).pause();
        ((dPlayer as any).flvPlayer as any).unload();
        ((dPlayer as any).flvPlayer as any).detachMediaElement();
        ((dPlayer as any).flvPlayer as any).destroy();
        (dPlayer as any).flvPlayer = null;
        dPlayer.destroy();
        dPlayer = null;
      }
      if(source.indexOf('.m3u8') > -1) {
        isLive.value = false;
      }
      dPlayer = initVideoPlayer(source, videoId || '', isLive.value === undefined ? true : isLive.value, live_port, danmu_port);
      initDanmu(roomId);
      insertRotationButton();
      isOpenLivePage = false;
      // ipcRenderer.on("ffmpeg-server-close", function() {
      //   closeLive(source, videoId);
      // });
      ipcRenderer.send('video-init-success');
    });
    setTimeout(() => {
      if(isOpenLivePage) {
        alert('直播异常');
        ipcRenderer.send('video-init-success');
        closeLiveWin(videoId.value || '');
      }
    }, 10000);
  }

  const initVideoPlayer = (source: string, videoId: string, isLive: boolean, live_port: number, danmu_port: number): DPlayer => {
    const src = isLive ?
      `ws://${LIVE_HOST}:${live_port}/live/${videoId}.flv` :
        source;
    const dp: DPlayer = isLive ? livePlayer(src, danmu_port) : recordPlayer(src, danmu_port);
    //退出全屏事件
    dp.on('webfullscreen_cancel' as DPlayerEvents,function() {
      dp.fullScreen.request('web');
    });
    dp.on('fullscreen_cancel' as DPlayerEvents,function() {
      dp.fullScreen.request('web');
    });
    dp.on('pause' as DPlayerEvents, function() {
      isPause.value = true;
    });
    dp.on('play' as DPlayerEvents, function() {
      isPause.value = false;
      if(liveType.value != 1 && liveType.value != 5) {
        // const radioBackground = {
        //   render() {
        //     return h(RadioBackground, {});
        //   }
        // }
        // const dom$ = document.querySelector('.dplayer-video-wrap');
        // if(dom$){
        //   createApp(radioBackground).mount(dom$);
        // };
        // dp.play();
      }
    });
    dp.on('waiting' as DPlayerEvents, function() {
      !timeouter && (timeouter = window.setInterval(() => {
        if(timeout.value === undefined) {
          timeout.value = 0;
        }
        timeout.value  = timeout.value++;
      }, 1000));
    });
    dp.on('playing' as DPlayerEvents, function() {
      now_time.value = dPlayer?.video.currentTime || 0;
      timeouter && clearInterval(timeouter);
      timeout.value = 0;
      timeouter = null;
    });
    dp.on('danmaku_show' as DPlayerEvents,function() {
      isDanmuShow.value = true;
    });
    dp.on('danmaku_hide' as DPlayerEvents,function() {
      isDanmuShow.value = false;
    });
    dp.fullScreen.request('web');
    dp.play();
    return dp;
  }

  function handleNewMessage(t: NimChatroomSocket, event: Array<any>): void {
    const danmu$ = document.querySelector('.danmu');
    if(!danmu$) {
      renderDanmu();
    }
    for (const item of event) {
      if(item.type === "text") {
        const custom = JSON.parse(item.custom);
        if(!danmuData) {
          danmuData.value = [];
        }
        danmuData.value.push([0, 0, 16777215, custom.user?.nickName || "", item.text] as never)
      }
    }
  }

  function livePlayer (src: string, danmu_port: number) {
    let interval: number | null = null;
    let flvPlayer: flvjs.Player | null = null;
    const dp: LivePalyer = new DPlayer({
      live: true,
      preload: 'auto',
      container: document.getElementById('myVideo'),
      danmaku: {
        id: DANMAKU_ID,
        api: DANMAKU_API.replace( "8173", danmu_port.toString())
      },
      video: {
        url: src, // url地址
        type: 'customFlv',
        customType: {
          customFlv: function (video: any, player: any) {
            flvPlayer = flvPlayerInit(src, video);
            flvPlayer?.on('error', e => {
              // 这里是视频加载失败
              console.log(e);
            });
          }
        }
      }
    });
    dp.on('pause' as DPlayerEvents , function() {
      if(interval) {
        clearInterval(interval);
        interval = null;
      }
    });
    dp.on('play' as DPlayerEvents , function() {
      if(!interval) {
        interval = window.setInterval(() => {
          if (flvPlayer?.buffered.length) {
            let end = flvPlayer.buffered.end(0);//获取当前buffered值
            let diff = end - flvPlayer.currentTime;//获取buffered与currentTime的差值
            if (diff >= 0.5) {//如果差值大于等于0.5 手动跳帧 这里可根据自身需求来定
              flvPlayer.currentTime = flvPlayer.buffered.end(0) - 1.5;//手动跳帧
            }
          }
        }, 2000); //2000毫秒执行一次
      }
    });
    dp.flvPlayer = flvPlayer;
    return dp;
  }
  
  function recordPlayer (src: string, danmu_port: number) {
    const dp: DPlayer = new DPlayer({
      live: false,
      preload: 'auto',
      container: document.getElementById('myVideo'),
      danmaku: {
        id: DANMAKU_ID,
        api: DANMAKU_API.replace( "8173", danmu_port.toString())
      },
      video: {
        url: src,
        type: 'customHls',
        customType: {
          customHls: function (video: any, player: any) {
            const hls = new Hls({enableWorker: false});
            hls.loadSource(video.src);
            hls.attachMedia(video);
          }
        }
      }
    });
    return dp;
  }

  function flvPlayerInit (src: string, video: any) {
    let flvPlayer = flvjs.createPlayer({
      type: 'flv',
      url: src
    }, {
      enableWorker: false,
      enableStashBuffer: false,
      autoCleanupSourceBuffer: true,
      stashInitialSize: 128,
    });
    flvPlayer.attachMediaElement(video);
    flvPlayer.load();
    return flvPlayer;
  }

  const renderDanmu = () => {
    setTimeout(() => {
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
            "onUpdate:isScroll": (value: boolean) => isScroll.value = value,
            onScroll: () => danmuScroll()
          });
        }
      }
      const dom$ = document.querySelector('.dplayer-menu');
      if(dom$){
        createApp(danmu).mount(dom$);
      };
      //dplayer-controller
      const childNodes: any = document.getElementById('myVideo')?.childNodes || {};
      Object.keys(childNodes).map(index => {
        const item = childNodes[index];
        if(item.className === "dplayer-controller") {
          danmuBottom.value = item.clientHeight;
        }
      });
    }, 2000);
  }

  const danmuScroll = ()=> {
    isPointerEvents.value = true;
    isScroll.value = true;
    timer && clearTimeout(timer);
    timer = window.setTimeout(() => {
      isScroll.value = false;
    }, 5000);
  }

  const insertRotationButton = () => {
    const console$ = document.querySelector('.dplayer-setting-origin-panel');
    const child = document.createElement('p');
    child.innerText = "旋转";
    child.className = "dplayer-setting-item";
    child.style.setProperty("margin", "0");
    child.style.setProperty("font-size", "13px");
    child.style.setProperty("height", "25px");
    child.style.setProperty("line-height", "25px");
    child.style.setProperty("padding", "0");
    child.onclick = () => {
      ipcRenderer.send('video-restart', videoId.value);
      radian.value = radian.value ? radian.value + 90 : 90;
      if(radian.value > 360) {
        radian.value = 0;
      }
      document.getElementById('myVideo')?.style.setProperty("--danmu-transform", `${radian.value}deg`);
    };
    console$?.appendChild(child);
    return child;
  }

  const clcStyle = computed(() => {
    const style: any = {};
    style["width"] = "100% !important";
    style["--video-display"] = liveType.value === 1 || liveType.value === 5 ? "block" : "none";
    style["--danmu-pointer-events"] = isPointerEvents.value ? 'auto' : 'none';
    style["--danmu-bottom"] = `${(danmuBottom.value || 0) + 3}px`;
    style["--danmu-transform"] = `${radian.value}deg`;
    return style;
  });

  const initDanmu = (roomId: string) => {
    if(!isLive.value){
      renderDanmu();
      return;
    }
    getIMKey().then(value => {
      if(roomId && value  && !danmu) {
        if(danmu) {
          return;
        }
        danmu = new NimChatroomSocket({
          roomId: roomId,
          onMessage: handleNewMessage
        });
        danmu.init(value as string);
      }
    });
  }

  return {
    initLive,
    clcStyle,
    danmuData,
    isPointerEvents
  }
})