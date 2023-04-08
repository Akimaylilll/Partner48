<script setup lang="ts">
import { ref, onMounted, nextTick } from 'vue';
const props = defineProps({
	nowtime: {
		type: Number,
		default: 13
	},
  isLive: {
		type: Boolean,
		default: true
	},
  isPause: {
    type: Boolean,
		default: false
  },
  danmuData: {
    type: Array<any>,
		default: []
  }
});

const emit = defineEmits(['update:nowtime']);
const danmu = ref<any>(null);
onMounted(() => {
  nextTick(() =>{
    setInterval(() => {
      if(!props.isPause) {
        emit('update:nowtime', props.nowtime + 0.2);
      }
      danmu.value.scrollTop > -1 && (danmu.value.scrollTop = danmu.value.scrollHeight);
    }, 200);
  })
});
</script>

<template>
  <div ref="danmu" style="display:inline-grid;overflow-y: hidden;">
    <template v-for="(o, index) in danmuData">
      <span  v-if="isLive || (!isLive && o[0] < nowtime)" class="message" :key="index">
        <span class="text">
          <span class="nickName" >{{ o[3] + "："}}</span>
          <span class="content">{{ o[4] }}</span>
        </span>
      </span>
    </template>
  </div>
</template>

<style scoped>
.message {
  text-align: left !important;
  margin-left: 5px;
  word-wrap: break-word;
  white-space: normal;
  font-size: 14px;
  display: inline-block;
  margin-top: 3px;
  margin-bottom: 3px;
}
.nickName {
  color: #ccc;
}
.content {
  color: #fff;
}
.text {
  background-color:rgba(0,0,0,0.3);
  padding: 3px 6px 4px 6px;
  border-radius: 5px;
  display: inline-block;
}
</style>
