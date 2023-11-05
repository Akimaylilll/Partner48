<script setup lang="ts">
import { ref, watch } from 'vue';
import { useStorage } from '@vueuse/core';
import { openLiveById } from '../renderer/index';
import { debounce } from "lodash";
import { ElCard } from 'element-plus';

const cursor = ref('pointer');
const isOpenLivePage = useStorage('isOpenLivePage', false);
isOpenLivePage.value = false;

interface LiveList{
  liveId: string,
  title: string,
  coverPath: string,
  liveType: number,
  userInfo: {
    teamLogo: string,
    nickname: string
  }
}
const props = defineProps({
  liveList: {
    type: Array<LiveList>,
    default: []
  },
  recordShow: {
    type: Boolean,
    default: false
  }
});

const openLive = debounce((liveId: string) => {
  cursor.value = "wait";
  isOpenLivePage.value = true;
  openLiveById(liveId).then((value) => {console.log(value)});
}, 500);

watch(isOpenLivePage, (newVal) => {
  if(!newVal) {
    cursor.value = "pointer";
  }
});

</script>
<template>
  <div v-masonry-tile gutter="10" itemSelector=".grid-item" :fitWidth= "true" class="grid-item" v-for="(o ,index) in liveList" :key="index">
    <el-card @click="!isOpenLivePage&&openLive(o.liveId)">
      <img :src="`https://source.48.cn${o.coverPath}`" class="cover">
      <span class="liveType" :style="`background-color: ${o.liveType === 1 ? 'orchid' : 'goldenrod'};`">{{o.liveType === 1 ? '视频' : '电台'}}</span>
      <div style="padding: 14px;">
        <span>{{o.title}}</span>
        <div class="bottom clearfix">
          <img :src="`https://source.48.cn${o.userInfo.teamLogo}`" class="logo">
          <time class="time"> {{ o.userInfo.nickname }} </time>
        </div>
      </div>
    </el-card>
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
.grid-item {
  width: 46%;
  padding-bottom: 10px;
  border-radius: 10px;
  border: transparent 2px solid;
  cursor: v-bind(cursor);
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