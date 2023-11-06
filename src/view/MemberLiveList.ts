
import { useStorage } from '@vueuse/core';
import { getLiveList, getVersion, addAlertMessageListener } from '../renderer/index';


export const reSetReplayDict = (list: Array<any>) => {
  const replayDict: {[key: string]: any} = {};
  list.map((item: any) => {
    const date = new Date(Number(item?.ctime));
    const dateStr = date.getFullYear() + '-' + (date.getMonth() + 1) + '-' + date.getDate();
    if (replayDict[dateStr]) {
      replayDict[dateStr].push(item);
    } else {
      replayDict[dateStr] = [];
      replayDict[dateStr].push(item);
    }
  });
  return replayDict;
};

export const initPage = async () => {
  initMessage();
  addAlertMessageListener();
  await initMemberList();
}

const initMemberList = async () => {
  localStorage.removeItem('liveList');
  localStorage.removeItem('replayList');
  localStorage.removeItem('next');
  localStorage.removeItem('isQueryLive');
  await getMemberList();
}

const initMessage = () => {
  setTimeout(() => {
    getVersion().then((data: any) => {
      if(data.version !== data.latest_version.replace("v", "")) {
        alert("非常感谢您的使用，新版本已经推出，欢迎下载。");
      }
    });
  }, 5000);
}

const getMemberList = async () => {
  const liveList = useStorage('liveList', [] as any[]);
  const replayList = useStorage('replayList', [] as any[]);
  const next = useStorage('next', "0");
  const isQueryLive = useStorage('isQueryLive', true);
  let lastLiveListLength = 0;
  if(isQueryLive.value) {
    const liveData: any = await getLiveList(true, next.value);
    liveList.value = Array.from(new Set([...liveList.value,...liveData.liveList]));
    lastLiveListLength = liveData.liveList.length;
  }
  isQueryLive.value = false;
  if(lastLiveListLength < 20) {
    const replayData: any = await getLiveList(false, next.value);
    replayList.value = Array.from(new Set([...replayList.value,...replayData.liveList]));
    next.value = replayData.next;
  }
}

export const handleScroll = async (e: any) => {
  const showTopLoading = useStorage('showTopLoading', false);
  const liveList = useStorage('liveList', [] as any[]);
  const replayList = useStorage('replayList', [] as any[]);
  const showBottomLoading = useStorage('showBottomLoading', false);
  const {scrollTop, clientHeight, scrollHeight} = e.target.childNodes[1];
  if(scrollTop === 0) {
    e.target.childNodes[1].scrollTop = 1;
    showTopLoading.value = true;
    liveList.value = [];
    replayList.value = [];
    await initMemberList();
    showTopLoading.value = false;
    return;
  }
  //滚动条未触底
  if (scrollTop + clientHeight < scrollHeight - 1) {
    return;
  }
  showBottomLoading.value = true;
  await getMemberList();
  showBottomLoading.value = false;
}