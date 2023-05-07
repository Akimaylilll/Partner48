<script setup lang="ts">
import { ref, onMounted, watch } from 'vue';
import { openLive, reSetReplayDict, getLiveMember, getReplayMember, initMember } from '../live/Member';
import { debounce } from '../utils/index'
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
  window.addEventListener('scroll', handleScroll, true);
  initMember().then((data: any) => {
    liveList.value = data.liveList;
    replayList.value = data.replayList;
    next = data.next;
    showTopLoading.value = false;
  });
});

watch(showTopLoading, (newVal) => {
  if(newVal) {
    document.body.style.overflowY = 'scroll';
  } else {
    document.body.style.overflowY = 'auto';
  }
});

watch(replayList, (newVal: any[]) => {
  replayDict.value = reSetReplayDict(newVal);
});

const handleScroll = async (e: any) =>{
  const {scrollTop, clientHeight, scrollHeight} = e.target.childNodes[1];
  if(scrollTop === 0) {
    e.target.childNodes[1].scrollTop = 1;
    showTopLoading.value = true;
    replayList.value = [];
    liveList.value = [];
    initMember().then((data: any) => {
      liveList.value = data.liveList;
      replayList.value = data.replayList;
      next = data.next;
      showTopLoading.value = false;
    });
    return;
  }
  //滚动条未触底
  if (scrollTop + clientHeight < scrollHeight - 1) {
    return;
  }

  showBottomLoading.value = true;
  if(_isLive) {
    const endId = (liveList.value.at(-1) as any)?.liveId;
    getLiveMember(liveList.value, next).then((data: any) => {
      if(!(liveList.value.length > 0 && liveList.value.at(-1).liveId !== endId)){
        _isLive = false;
        recordShow.value = true;
        setTimeout(()=>{
          getReplayMember(replayList.value, next).then((data: any) => {
            replayList.value = data.list;
            next = data.next;
            showBottomLoading.value = false;
          });
        }, 800);
      } else {
        liveList.value = data.list;
        next = data.next;
        showBottomLoading.value = false;
      }
    });
  } else {
    getReplayMember(replayList.value, next).then((data: any) => {
      replayList.value = data.list;
      next = data.next;
      showBottomLoading.value = false;
    });
  }
};

</script>

<template>
  <div v-if="showTopLoading">
    <img src="../img/loading.gif" style="width: 20px;">
  </div>
  <div @scroll.prevent="debounce(handleScroll)" style="width:100%; height: 100%;">
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
