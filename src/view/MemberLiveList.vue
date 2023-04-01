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

</script>

<template>
  <div v-if="returnRef.showTopLoading">
    <img src="../img/loading.svg" style="width: 100px;">
  </div>
  <div @scroll.prevent="debounce(handleScroll)" style="width:100%; height: 100%;">
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
</template>

<style scoped>
.grid {
  width: 100%;
}
</style>
