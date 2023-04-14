import { ipcRenderer } from 'electron'
const testSend = () => {
  ipcRenderer.send('lives-list', '0');
}

const getLiveList = (isLive: boolean, next: string = "0") => {
  return new Promise((resolve, reject) => {
    ipcRenderer.once('lives-list-reply', function (event, arg) { // 接收到Main进程返回的消息
      resolve(arg);
    })
    ipcRenderer.send('lives-list-query', isLive, next);
  });
}

const openLiveById = ( id: string ) => {
  return new Promise((resolve, reject) => {
    ipcRenderer.once('open-live-reply', function (event, arg) { // 接收到Main进程返回的消息
      resolve(arg);
    })
    ipcRenderer.send('open-live-query', id);
  });
}

const getVideoId = () => {
  return new Promise((resolve, reject) => {
    ipcRenderer.once('open-video-id', function (event, arg) { // 接收到Main进程返回的消息
      resolve(arg);
    });
  });
}

const closeLiveWin = (liveId: string) => {
  ipcRenderer.send('close-live-win', liveId);
}

const getIMKey = () => {
  return new Promise((resolve, reject) => {
    ipcRenderer.once('im-key-reply', function (event, arg) { // 接收到Main进程返回的消息
      resolve(arg);
    })
    ipcRenderer.send('im-key-query');
  });
}

const setIMKey = (key: string) => {
  ipcRenderer.send('set-im-key', key);
}


export {
  testSend,
  getLiveList,
  openLiveById,
  getVideoId,
  closeLiveWin,
  getIMKey,
  setIMKey
}