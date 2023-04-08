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
      emit('update:nowtime', props.nowtime + 0.5);
      danmu.value.scrollTop && (danmu.value.scrollTop = danmu.value.scrollHeight);
    }, 500);
  })
});
</script>

<template>
  <div ref="danmu" style="display:inline-grid;overflow-y: hidden;">
    <template v-for="(o, index) in danmuData">
      <span  v-if="isLive || (!isLive && o[0] < nowtime)" class="message" :key="index">{{ o[3] + "：" + o[4] }}</span>
    </template>
  </div>
</template>

<style scoped>
.message {
  text-align: left !important;
  margin-left: 5px;
  width: 300px;
  word-wrap: break-word;
  white-space: normal;
  font-size: 14px;
  display: inline-block;
}
</style>
