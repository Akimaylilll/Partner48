<script setup lang="ts">
import { toRefs, watch, reactive, onMounted, ref } from 'vue';
import { useStorage } from '@vueuse/core';
import { memberCard, reSetReplayDict, initPage, initMemberList, getMemberList } from './MemberLiveList';
import { debounce } from "lodash";
import MemberCard from "../components/MemberCard.vue";
const replayDict = ref<any>({});
const showTopLoading = ref(true);
const showBottomLoading = ref(false);
const liveList = ref([]);
const replayList = ref([]);

onMounted(() => {
  initPage().then(() => {
    showTopLoading.value = false;
    window.addEventListener('scroll', handleScroll, true);
    liveList.value = useStorage('liveList', [] as any[]).value;
    replayList.value = useStorage('replayList', [] as any[]).value;
  });
});

watch(() => showTopLoading, (newVal) => {
  if(newVal) {
    document.body.style.overflowY = 'scroll';
  } else {
    document.body.style.overflowY = 'auto';
  }
});

watch(replayList, (newVal: any[]) => {
  replayDict.value = reSetReplayDict(newVal);
});

const clickTop = () => {
  window.scrollTo(0, 0);
  document.body.scrollTop = 0;
  document.documentElement.scrollTop = 0;
}

const handleScroll = async (e: any) => {
  const {scrollTop, clientHeight, scrollHeight} = e.target.childNodes[1];
  if(scrollTop === 0) {
    e.target.childNodes[1].scrollTop = 1;
    showTopLoading.value = true;
    liveList.value = [];
    replayList.value = [];
    await initMemberList();
    liveList.value = useStorage('liveList', [] as any[]).value;
    replayList.value = useStorage('replayList', [] as any[]).value;
    showTopLoading.value = false;
    return;
  }
  //滚动条未触底
  if (scrollTop + clientHeight < scrollHeight - 1) {
    return;
  }
  showBottomLoading.value = true;
  await getMemberList();
  liveList.value = useStorage('liveList', [] as any[]).value;
  replayList.value = useStorage('replayList', [] as any[]).value;
  showBottomLoading.value = false;
}
</script>

<template>
  <div v-if="showTopLoading">
    <img src="../img/loading.svg" style="width: 100px;">
  </div>
  <div @scroll.prevent="debounce(handleScroll, 1000)" style="width:100%; height: 100%;">
    <div style="width: 100%">直播</div>
      <div v-masonry gutter="10" :v-if="true" class="grid">
        <MemberCard :live-list = liveList></MemberCard>
    </div>
    <div style="width: 100%">重播</div>
      <div v-for="dateKey,dateIndex in Object.keys(replayDict)"  :key="dateIndex">
        <div style="width: 100%">{{ dateKey }}</div>
        <div v-masonry :v-if="true" class="grid">
          <MemberCard :live-list = replayDict[dateKey]></MemberCard>
        </div>
      </div>
  </div>
  <div v-if="showBottomLoading" >
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
  background-color: #1a1a1a !important;
}

</style>
