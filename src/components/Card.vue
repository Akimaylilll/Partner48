
<script setup lang="ts">
import { openLive, reSetReplayDict } from '../live/Member';
const props = defineProps({
  replayDict: {
    type: Object,
    default: {}
  },
  recordShow: {
    type: Boolean,
    default: false
  }
})
</script>
<template>
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