import { defineStore } from "pinia";
import { toRefs, watch, reactive, onMounted, ref } from 'vue';
import { useStorage } from '@vueuse/core';
import { getLiveList, getVersion, addAlertMessageListener } from '../renderer/index';
import { debounce } from "lodash";

// defineStore 接受两个参数
//  参数1：仓库的id（字符串）
//  参数2：options（对象）
export const useMemberLiveListStore = defineStore('memberLiveList', () => {
  const liveList = ref([] as any[]);
  const replayList = ref([] as any[]);
  const next = ref("0");
  const isQueryLive = ref(true);
  const showTopLoading = ref(false);
  const showBottomLoading = ref(false);

  const reSetReplayDict = (list: Array<any>) => {
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

  const initPage = async () => {
    initMessage();
    addAlertMessageListener();
    await initMemberList();
  }

  const initMemberList = debounce(async () => {
    liveList.value = [];
    replayList.value = [];
    next.value = "0";
    isQueryLive.value = true;
    await getMemberList();
  }, 1000, {
    leading: true,
    trailing: false
  });

  const initMessage = () => {
    setTimeout(() => {
      getVersion().then((data: any) => {
        if(data.version !== data.latest_version.replace("v", "")) {
          alert("非常感谢您的使用，新版本已经推出，欢迎下载。");
        }
      });
    }, 5000);
  }

  const getMemberList = debounce(async () => {
    let lastLiveListLength = 0;
    if(isQueryLive.value) {
      const liveData: any = await getLiveList(true, next.value);
      liveList.value = Array.from(new Set([...liveList.value,...liveData.liveList]));
      lastLiveListLength = liveData.liveList.length;
    }
    isQueryLive.value = false;
    setTimeout(async() =>{
      if(lastLiveListLength < 20) {
        const replayData: any = await getLiveList(false, next.value);
        replayList.value = Array.from(new Set([...replayList.value,...replayData.liveList]));
        next.value = replayData.next;
      }
    }, 1000);
  }, 1000, {
    leading: true,
    trailing: false
  });

  const handleScroll = async (e: any) => {
    const {scrollTop, clientHeight, scrollHeight} = e.target.childNodes[1];
    if(scrollTop === 0) {
      e.target.childNodes[1].scrollTop = 1;
      showTopLoading.value = true;
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
  return {
    reSetReplayDict,
    initPage,
    handleScroll,
    liveList,
    replayList,
    next,
    isQueryLive,
    showTopLoading,
    showBottomLoading
  }
});