
import { onMounted, reactive } from 'vue';
import { getLiveMember, getReplayMember, initMember } from '../live/Member';

interface myProps {
  liveList?: any,
  replayList?: any,
  replayDict?: any,
  show?: boolean,
  recordShow?: boolean,
  showTopLoading?: boolean,
  showBottomLoading?: boolean
}

export const memberCard = () => {
  const returnRef: myProps = reactive({});
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
      returnRef.liveList = data.liveList;
      returnRef.replayList = data.replayList;
      next = data.next;
      returnRef.showTopLoading = false;
    });
  });

  const handleScroll = async (e: any) =>{
    const {scrollTop, clientHeight, scrollHeight} = e.target.childNodes[1];
    if(scrollTop === 0) {
      e.target.childNodes[1].scrollTop = 1;
      returnRef.showTopLoading = true;
      returnRef.replayList = [];
      returnRef.liveList = [];
      initMember().then((data: any) => {
        returnRef.liveList = data.liveList;
        returnRef.replayList = data.replayList;
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