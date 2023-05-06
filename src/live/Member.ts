import { getLiveList, openLiveById } from '../renderer/index';

const openLive = (liveId: string) => {
  openLiveById(liveId).then((value) => {
    // console.log('success')
    // console.log(value);
  })
};

export {
  openLive,
}