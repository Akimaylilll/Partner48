<script setup lang="ts">
import { ref, onMounted, watch } from 'vue'
import { getLiveList, openLiveById } from '../renderer/index';
defineProps<{ msg: string }>()

let liveList: any = ref([]);
let replayList: any = ref([]);
let replayDict: any = ref({});
let show = ref(false);
let recordShow = ref(false);
let showTopLoading = ref(true);
let showBottomLoading = ref(false);
document.body.style.overflowY = 'hidden';
let next = "0";
let _isLive = true;

onMounted(() => {
  window.addEventListener('scroll', handleScroll, true)
  initLive()
});

const initLive = () => {
  showTopLoading.value = true;
  liveList.value = [];
  replayList.value = [];
  replayDict.value = {};
  next = "0";
  getLiveList(true, next).then(value => {
    setTimeout(() => {
      showTopLoading.value = false;
    }, 1000);
    liveList.value = (value as any).liveList;
    if(replayList.value.length > 0){
      next = (liveList.value?.at(-1) as any).liveId || next;
    } else {
      setTimeout(() => {
        getLiveList(false, next).then( list => {
          replayList.value = (list as any).liveList;
          next = (replayList.value?.at(-1) as any)?.liveId || next;
          reSetReplayDict(replayList.value);
        });
      }, 800);
    }
  });
}

watch(showTopLoading, (newVal) => {
  if(newVal) {
    document.body.style.overflowY = 'scroll';
  } else {
    document.body.style.overflowY = 'auto';
  }
})

const openLive = (liveId: string) => {
  openLiveById(liveId).then((value) => {
    // console.log('success')
    // console.log(value);
  })
};

const handleScroll = async (e: any) =>{
  const {scrollTop, clientHeight, scrollHeight} = e.target.childNodes[1];
  if(scrollTop === 0) {
    e.target.childNodes[1].scrollTop = 1;
    initLive();
    return;
  }
  //滚动条未触底
  if (scrollTop + clientHeight < scrollHeight - 1){
    return;
  }
  showBottomLoading.value = true;
  if(_isLive){
    const result = await getLiveList(_isLive, next) as any;
    const newList = result.liveList;
    if(newList.length > 0 && newList.at(-1).liveId !== (liveList.value.at(-1) as any)?.liveId){
      liveList.value = [...liveList.value,...newList as []]
      next = (liveList.value?.at(-1) as any).liveId || next;
    } else {
      _isLive = false;
      recordShow.value = true;
    }
  }

  if(! _isLive) {
    const result = await getLiveList(_isLive, next) as any;
    const newList = result.liveList;
    replayList.value = Array.from(new Set([...replayList.value, ...newList as []]));
    next = (replayList.value?.at(-1) as any)?.liveId || next;
    reSetReplayDict(replayList.value);
  }
  setTimeout(() => {
    showBottomLoading.value = false;
  }, 2000);
};

const reSetReplayDict = (list: Array<any>) => {
  replayDict.value = {};
  list.map((item: any) => {
    const date = new Date(Number(item?.ctime));
    const dateStr = date.getFullYear() + '-' + (date.getMonth() + 1) + '-' + date.getDate();
    if (replayDict.value[dateStr]) {
      replayDict.value[dateStr].push(item);
    } else {
      replayDict.value[dateStr] = [];
      replayDict.value[dateStr].push(item);
    }
  })
};

</script>

<template>
  <div v-if="showTopLoading" class="top-mask">
    <img src="../img/loading.gif" style="width: 20px;">
  </div>
  <div @scroll.prevent="handleScroll" style="width:100%; height: 100%;">
    <div style="width: 100%">直播</div>
      <div v-masonry gutter="10" itemSelector=".grid-item" :fitWidth= "true" :v-if="show" class="grid">
      <div v-masonry-tile class="grid-item" v-for="(o,index) in liveList" :key="index">
        <el-card @click="openLive(o.liveId)">
          <img :src="`https://source.48.cn${o.coverPath}`" class="cover">
          <span class="liveType" :style="`background-color: ${o.liveType === 1 ? 'orchid' : 'goldenrod'};`">{{o.liveType === 1 ? '视频' : '电台'}}</span>
          <div style="padding: 14px;">
            <span>{{o.title}}</span>
            <div class="bottom clearfix">
              <img :src="`https://source.48.cn${o.userInfo.teamLogo}`" class="logo">
              <time class="time"> {{ o.userInfo.nickname }} </time>
              <!-- <el-button type="text" class="button">操作按钮</el-button> -->
            </div>
          </div>
        </el-card>
      </div>
    </div>
    <div style="width: 100%">重播</div>
    <div v-for="dateKey,dateIndex in Object.keys(replayDict)"  :key="dateIndex">
      <div style="width: 100%">{{ dateKey }}</div>
      <div v-masonry :v-if="recordShow" class="grid">
        <div v-masonry-tile gutter="10" itemSelector=".grid-item" :fitWidth= "true" class="grid-item" v-for="(o ,index) in replayDict[dateKey]" :key="index">
          <el-card @click="openLive(o.liveId)">
            <img :src="`https://source.48.cn${o.coverPath}`" class="cover">
            <span class="liveType" :style="`background-color: ${o.liveType === 1 ? 'orchid' : 'goldenrod'};`">{{o.liveType === 1 ? '视频' : '电台'}}</span>
            <div style="padding: 14px;">
              <span>{{o.title}}</span>
              <div class="bottom clearfix">
                <img :src="`https://source.48.cn${o.userInfo.teamLogo}`" class="logo">
                <time class="time"> {{ o.userInfo.nickname }} </time>
                <!-- <el-button type="text" class="button">操作按钮</el-button> -->
              </div>
            </div>
          </el-card>
        </div>
      </div>
    </div>
  </div>
  <div v-if="showBottomLoading" >
    <img src="../img/loading.gif" style="width: 20px;">
  </div>
</template>

<style scoped>
.cover {
  width: 288px;
}
.logo{
  height: 10px;
  padding: 0px;
}
.grid {
  width: 100%;
}
 .grid-item {
    width: 46%;
    padding-bottom: 10px;
    cursor: pointer;
    border-radius: 10px;
    border: transparent 2px solid;
  }
  .grid-item:hover {
    border: #7272cc 2px solid;
  }

  .liveType {
    position: absolute;
    bottom: 96px;
    right: 28px;
    padding: 1px 5px 1px 5px;
    border-radius: 5px;
  }
</style>
