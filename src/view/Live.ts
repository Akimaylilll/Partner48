import DPlayer, { DPlayerEvents } from 'dplayer';
import { getIMKey, restartFfmpegServer, closeLiveWin } from '../renderer/index';
import { DANMAKU_ID, DANMAKU_API, LIVE_HOST } from '../config/index';
import { ipcRenderer } from 'electron';
import NimChatroomSocket from '../utils/NimChatroomSocket';
import { reactive, onMounted, nextTick } from 'vue';
import flvjs from 'flv.js';
import Hls from 'hls.js';

interface LivePalyer extends DPlayer{
  restartFlvPlayer?: Function | null,
  flvPlayer?: flvjs.Player | null
}
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
  danmuBottom?: number,
  dPlayer?: LivePalyer | null,
  source?: string
  timeout?: number,
  isShowAlert?: boolean,
  closeLive?: Function | null,
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
  props.dPlayer = null;
  props.source = '';
  props.timeout = 0;
  props.isShowAlert = true;
  let danmu: NimChatroomSocket | null  = null;
  let repeat = 3;
  let timer: number | null = null;
  let timeouter: number | null = null;
  props.closeLive = null;

  ipcRenderer.on('open-video-id', function (event, arg, userName, source, type, danmus, roomId, danmu_port, live_port) { // 接收到Main进程返回的消息
    props.videoId = arg;
    props.liveType = type;
    props.danmuData = danmus;
    props.source = source;
    document.title = userName;

    if(source.indexOf('.m3u8') > -1) {
      props.isLive = false;
    } else {
      // addLiveClosedListener(props.videoId || "");
    }
    if(props.dPlayer) {
      props.dPlayer.destroy();
      props.dPlayer = null;
    }
    props.dPlayer = initVideoPlayer(source, props.videoId || '', props.isLive === undefined ? true : props.isLive, live_port, danmu_port);

    // props.dPlayer.volume(volume, true, false);
    props.dPlayer.on('pause' as DPlayerEvents, function() {
      props.isPause = true;
    });
    props.dPlayer.on('play' as DPlayerEvents, function() {
      props.isPause = false;
    });
    props.dPlayer.on('loadeddata' as DPlayerEvents, function() {
      localStorage.setItem('isOpenLivePage', "false");
    });
    props.dPlayer.on('waiting' as DPlayerEvents, function() {
      !timeouter && (timeouter = window.setInterval(() => {
        if(props.timeout === undefined) {
          props.timeout = 0;
        }
        props.timeout  = props.timeout++;
      }, 1000));
    });
    props.dPlayer.on('playing' as DPlayerEvents, function() {
      props.now_time = props.dPlayer?.video.currentTime;
      timer && clearInterval(timer);
      repeat = 3;
      timeouter && clearInterval(timeouter);
      props.timeout = 0;
      timeouter = null;
    });
    props.dPlayer.on('danmaku_show' as DPlayerEvents,function() {
      props.isDanmuShow = true;
    });
    props.dPlayer.on('danmaku_hide' as DPlayerEvents,function() {
      props.isDanmuShow = false;
    });

    getIMKey().then(value => {
      if(roomId && value  && !danmu) {
          danmu = new NimChatroomSocket({
            roomId: roomId,
            onMessage: handleNewMessage
          });
          danmu.init(value as string);
        }
    });
  });

  function closeLive() {
    if(props?.source && props.source.indexOf('.m3u8') === -1) {
      if(repeat == 0) {
        if(props.isShowAlert) {
          props.isShowAlert = false;
          alert('直播结束');
          closeLiveWin(props?.videoId || '');
        }
      } else {
        restartFfmpegServer(props.videoId || '').then(() => {
          setTimeout(() => {
            if (props?.dPlayer?.flvPlayer) {
              let flvPlayer: flvjs.Player | null = props.dPlayer.flvPlayer;
              flvPlayer.pause();
              flvPlayer.unload();
              flvPlayer.detachMediaElement();
              flvPlayer.destroy();
              flvPlayer = null;
              flvPlayer = props.dPlayer.restartFlvPlayer && props.dPlayer.restartFlvPlayer()
              flvPlayer?.play();
            }
          }, 1000);
        });
        repeat--;
      }
    }
  }

  ipcRenderer.on("ffmpeg-server-close", function() {
    closeLive()
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
        props.closeLive = closeLive;
      }, 2000);
    });
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
  let interval: number | null = null;
  let restartFlvPlayer: Function | null = null;
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
          restartFlvPlayer = () => {
            return flvPlayerInit(src, video);
          }
          flvPlayer?.on('error', e => {
            // 这里是视频加载失败
            console.log(e);
            if (flvPlayer) {
              flvPlayer.pause();
              flvPlayer.unload();
              flvPlayer.detachMediaElement();
              flvPlayer.destroy();
              flvPlayer = null;
              flvPlayer = restartFlvPlayer && restartFlvPlayer()
            }
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

  dp.restartFlvPlayer = restartFlvPlayer;
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