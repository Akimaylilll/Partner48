
import { onMounted, reactive } from 'vue';
import { getLiveList, getVersion } from '../renderer/index';

interface MemberLiveProps {
  liveList?: any,
  replayList?: any,
  replayDict?: any,
  show?: boolean,
  recordShow?: boolean,
  showTopLoading?: boolean,
  showBottomLoading?: boolean
}


const getLiveMember = (list: any[], next: string) => {
  let liveList: any = [];
  return new Promise((resolve, reject) => {
    getLiveList(true, next).then(value => {
      liveList = (value as any).liveList;
      resolve({ list: Array.from(new Set([...list,...liveList])), next });
    });
  });
}

const getReplayMember = (list: any[], next: string) => {
  return new Promise((resolve, reject) => {
    getLiveList(false, next).then(data => {
      const replayList = (data as any).liveList;
      next = (replayList?.at(-1) as any)?.liveId || next;
      resolve({ list: Array.from(new Set([...list,...replayList])), next });
    });
  });
}


const initMember = () => {
  return new Promise((resolve, reject) => {
    getLiveMember([], '0').then((liveData: any) => {
      const liveList = liveData.list;
      let next = liveData.next;
      if(liveList.length < 20) {
        setTimeout(()=>{
          getReplayMember([], next).then((data: any) => {
            const replayList = data.list;
            next = data.next;
            resolve({ liveList, replayList, next });
          });
        }, 800);
      } else {
        resolve({ liveList, next });
      }
    });
  });
}
export const memberCard = () => {
  const returnRef: MemberLiveProps = reactive({});
  returnRef.liveList = [];
  returnRef.replayList = [];
  returnRef.replayDict = {};
  returnRef.show = false;
  returnRef.recordShow = false;
  returnRef.showTopLoading = true;
  returnRef.showBottomLoading = false;

  document.body.style.overflowY = 'hidden';
  let next = "0";
  let _isLive = true;

  onMounted(() => {
    window.addEventListener('scroll', handleScroll, true);
    initMember().then((data: any) => {
      returnRef.liveList = data.liveList || [];
      returnRef.replayList = data.replayList || [];
      next = data.next;
      returnRef.showTopLoading = false;
    });
    setTimeout(() => {
      getVersion().then((data: any) => {
        if(data.version !== data.latest_version) {
          alert("非常感谢您使用，新版本已经推出，欢迎下载。");
        }
      });
    }, 5000);
  });

  const handleScroll = async (e: any) =>{
    const {scrollTop, clientHeight, scrollHeight} = e.target.childNodes[1];
    if(scrollTop === 0) {
      e.target.childNodes[1].scrollTop = 1;
      returnRef.showTopLoading = true;
      returnRef.replayList = [];
      returnRef.liveList = [];
      initMember().then((data: any) => {
        returnRef.liveList = data.liveList || [];
        returnRef.replayList = data.replayList || [];
        next = data.next;
        returnRef.showTopLoading = false;
      });
      return;
    }
    //滚动条未触底
    if (scrollTop + clientHeight < scrollHeight - 1) {
      return;
    }

    returnRef.showBottomLoading = true;
    if(_isLive) {
      const endId = (returnRef.liveList.at(-1) as any)?.liveId;
      getLiveMember(returnRef.liveList, next).then((data: any) => {
        if(!(returnRef.liveList.length > 0 && returnRef.liveList.at(-1).liveId !== endId)){
          _isLive = false;
          returnRef.recordShow = true;
          setTimeout(()=>{
            getReplayMember(returnRef.replayList, next).then((data: any) => {
              returnRef.replayList = data.list;
              next = data.next;
              returnRef.showBottomLoading = false;
            });
          }, 800);
        } else {
          returnRef.liveList = data.list;
          next = data.next;
          returnRef.showBottomLoading = false;
        }
      });
    } else {
      getReplayMember(returnRef.replayList, next).then((data: any) => {
        returnRef.replayList = data.list;
        next = data.next;
        returnRef.showBottomLoading = false;
      });
    }
  };
  return { returnRef, handleScroll }
}

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