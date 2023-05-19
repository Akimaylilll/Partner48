<script setup lang="ts">
import { toRefs, watch } from 'vue';
import { memberCard } from './MemberCard';
import { reSetReplayDict } from '../live/Member';
import { debounce } from '../utils/index';
import Card from "../components/Card.vue";
const { returnRef, handleScroll } = toRefs(memberCard());
watch(() => returnRef.value.showTopLoading, (newVal) => {
  if(newVal) {
    document.body.style.overflowY = 'scroll';
  } else {
    document.body.style.overflowY = 'auto';
  }
});
watch(() => returnRef.value.replayList, (newVal: any[]) => {
  returnRef.value.replayDict = reSetReplayDict(newVal);
});

</script>

<template>
  <div v-if="returnRef.showTopLoading">
    <img src="../img/loading.gif" style="width: 20px;">
  </div>
  <div @scroll.prevent="debounce(handleScroll)" style="width:100%; height: 100%;">
    <div style="width: 100%">直播</div>
      <div v-masonry gutter="10" itemSelector=".grid-item" :fitWidth= "true" :v-if="returnRef.show" class="grid">
      <div v-masonry-tile class="grid-item" v-for="(o,index) in returnRef.liveList" :key="index">
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
    <Card :replayDict = returnRef.replayDict :recordShow = returnRef.recordShow></Card>
  </div>
  <div v-if="returnRef.showBottomLoading" >
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
