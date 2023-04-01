
<script setup lang="ts">
import { openLiveById } from '../renderer/index';
import { debounce } from "lodash";
import { ElCard } from 'element-plus';
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
  openLiveById(liveId).then((value) => {
    // console.log('success')
    // console.log(value);
  });
}, 100);


</script>
<template>
  <div v-masonry-tile gutter="10" itemSelector=".grid-item" :fitWidth= "true" class="grid-item" v-for="(o ,index) in liveList" :key="index">
    <el-card @click="openLive(o.liveId)">
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