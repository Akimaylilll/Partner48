import { getLiveList, openLiveById } from '../renderer/index';


const openLive = (liveId: string) => {
  openLiveById(liveId).then((value) => {
    // console.log('success')
    // console.log(value);
  })
};


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

export {
  openLive,
  reSetReplayDict,
  getLiveMember,
  getReplayMember,
  initMember
}