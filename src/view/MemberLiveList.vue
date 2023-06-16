<script setup lang="ts">
import { toRefs, watch, reactive } from 'vue';
import { memberCard, reSetReplayDict } from './MemberLiveList';
import { debounce } from "lodash";
import MemberCard from "../components/MemberCard.vue";
const props = reactive(memberCard());
const { returnRef, handleScroll } = toRefs(props);
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
const clickTop = () => {
  window.scrollTo(0, 0);
  document.body.scrollTop = 0;
  document.documentElement.scrollTop = 0;
}
</script>

<template>
  <div v-if="returnRef.showTopLoading">
    <img src="../img/loading.svg" style="width: 100px;">
  </div>
  <div @scroll.prevent="debounce(handleScroll, 1000)" style="width:100%; height: 100%;">
    <div style="width: 100%">直播</div>
      <div v-masonry gutter="10" :v-if="returnRef.show" class="grid">
        <MemberCard :live-list = returnRef.liveList></MemberCard>
    </div>
    <div style="width: 100%">重播</div>
      <div v-for="dateKey,dateIndex in Object.keys(returnRef.replayDict)"  :key="dateIndex">
        <div style="width: 100%">{{ dateKey }}</div>
        <div v-masonry :v-if="returnRef.recordShow" class="grid">
          <MemberCard :live-list = returnRef.replayDict[dateKey]></MemberCard>
        </div>
      </div>
  </div>
  <div v-if="returnRef.showBottomLoading" >
    <img src="../img/loading.svg" style="width: 100px;">
  </div>
  <button class="footer" @click="clickTop"></button>
</template>

<style scoped>
.grid {
  width: 100%;
}
.footer {
  position: fixed;
  bottom: 20px;
  right: 20px;
  width: 48px;
  height: 48px;
  background-image: url("../img/return_top.svg");
  background-position: center;
  color: #fff;
}

</style>
