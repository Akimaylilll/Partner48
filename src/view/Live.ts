import DPlayer, { DPlayerEvents } from 'dplayer';
import { closeLiveWin, getIMKey, getPort } from '../renderer/index';
import { DANMAKU_ID, DANMAKU_API, LIVE_PORT, LIVE_HOST } from '../config/index';
import { ipcRenderer } from 'electron';
import NimChatroomSocket from '../utils/NimChatroomSocket';
import { reactive, onMounted, nextTick } from 'vue';
import flvjs from 'flv.js';
import Hls from 'hls.js';

interface LiveProps {
  videoId?: string,
  liveType?: number,
  danmuData?: Array<any>,
  roomId?: string,
  isLive?: boolean,
  isPause?: boolean,
  now_time?: number,
  isDanmuShow?: boolean,
  isScroll?: boolean,
  isPointerEvents?: boolean,
  radian?: number,
  videoDiv?: any,
  danmuBottom?: number
}
const initLive = () => {
  const props: LiveProps = reactive({});
  props.videoDiv = null;
  props.videoId = '';
  props.isPointerEvents = false;
  props.isScroll = false;
  props.isPause = false;
  props.isLive = true;
  props.radian = 0;
  props.danmuBottom = 0;
  props.now_time = 0;
  props.danmuData = [];

  ipcRenderer.once('open-video-id', function (event, arg, userName, source, type, danmus, roomId) { // 接收到Main进程返回的消息
    props.videoId = arg;
    props.liveType = type;
    props.danmuData = danmus;
    document.title = userName;
    // props.roomId = roomId;
    if(source.indexOf('.m3u8') > -1){
      props.isLive = false;
    }
    setTimeout(async () => {
      getPort().then(item => {
        const danmu_port = (item as any)?.danmu_port || 8173;
        const live_port = (item as any)?.live_port || 8936;
        const dp = initVideoPlayer(source, props.videoId || '', props.isLive === undefined ? true : props.isLive, live_port, danmu_port);
        dp.on('pause' as DPlayerEvents, function() {
          props.isPause = true;
        });
        dp.on('play' as DPlayerEvents, function() {
          props.isPause = false;
        });
        dp.on('playing' as DPlayerEvents, function() {
          props.now_time = dp.video.currentTime;
        });
        dp.on('danmaku_show' as DPlayerEvents,function() {
          props.isDanmuShow = true;
        });
        dp.on('danmaku_hide' as DPlayerEvents,function() {
          props.isDanmuShow = false;
        });
      });
      getIMKey().then(value => {
        if(roomId) {
            const danmu = new NimChatroomSocket({
              roomId: roomId,
              onMessage: handleNewMessage
            });
            danmu.init(value as string);
          }
      });
    }, 1000);
  });

  onMounted(async() => {
    nextTick(() => {
      setTimeout(() =>{
        const rotationButton = insertRotationButton();
        rotationButton.onclick = () => {
          props.radian = props.radian ? props.radian + 90 : 90;
          if(props.radian > 360) {
            props.radian = 0;
          }
          props.videoDiv && props.videoDiv.style.setProperty("--danmu-transform", `${props.radian}deg`);
        };
      }, 2000);
    })
  });

  function handleNewMessage(t: NimChatroomSocket, event: Array<any>): void {
    for (const item of event) {
      if(item.type === "text") {
        const custom = JSON.parse(item.custom);
        if(!props.danmuData) {
          props.danmuData = [];
        }
        props.danmuData.push([0, 0, 16777215, custom.user?.nickName || "", item.text] as never)
      }
    }
  }

  return { props }
}

const initVideoPlayer = (source: string, videoId: string, isLive: boolean, live_port: number, danmu_port: number): DPlayer => {
  const src = isLive ?
    `ws://${LIVE_HOST}:${live_port}/live/${videoId}.flv` :
      source;
  const dp: DPlayer = isLive ? livePlayer(src, danmu_port) : recordPlayer(src, danmu_port);
  dp.on('ended' as DPlayerEvents, function() {
    alert('直播结束')
    closeLiveWin(videoId);
  });
  //退出全屏事件
  dp.on('webfullscreen_cancel' as DPlayerEvents,function() {
    dp.fullScreen.request('web');
  });
  dp.on('fullscreen_cancel' as DPlayerEvents,function() {
    dp.fullScreen.request('web');
  });
  dp.fullScreen.request('web');
  dp.play();
  return dp;
}

function livePlayer (src: string, danmu_port: number) {
  let flvPlayer: flvjs.Player | null = null;
  let interval: number | null = null;
  const dp: DPlayer = new DPlayer({
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
        customFlv: function(video: any, player: any) {
          flvPlayer = flvPlayerInit(src, video);
          flvPlayer?.on('error', e => {
            // 这里是视频加载失败
            console.log(e);
            if (flvPlayer) {
              flvPlayer.pause();
              flvPlayer.unload();
              flvPlayer.detachMediaElement();
              flvPlayer.destroy();
              flvPlayer = null;
              flvPlayer = flvPlayerInit(src, video);
            }
          })
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
  const flvPlayer = flvjs.createPlayer({
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
  console$?.appendChild(child);
  return child;
}

export {
  initLive
}