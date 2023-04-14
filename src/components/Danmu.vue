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
  isShow: {
    type: Boolean,
		default: true
  },
  isScroll: {
    type: Boolean,
		default: false
  },
  isPointerEvents: {
    type: Boolean,
		default: false
  },
  danmuData: {
    type: Array<any>,
		default: []
  }
});

const emit = defineEmits(['update:nowtime', 'update:isPointerEvents']);
const danmu = ref<any>(null);
let timer: any = null;
onMounted(() => {
  nextTick(() =>{
    setInterval(() => {
      props.isShow && !props.isScroll && (danmu.value.scrollTop > -1) && (danmu.value.scrollTop = danmu.value.scrollHeight);
      if(!props.isPause) {
        emit('update:nowtime', props.nowtime + 0.2);
      }
    }, 200);
  })
});
const spanMousemove = () => {
  emit("update:isPointerEvents", true);
}
const spanMouseleave = () => {
  clearTimeout(timer);
  timer = setTimeout(() => {
    emit("update:isPointerEvents", false);
  }, 500);
}
</script>

<template>
  <div v-if="isShow" ref="danmu" class="danmu">
    <template v-for="(o, index) in danmuData">
      <span  v-if="isLive || (!isLive && o[0] < nowtime)"
        class="message"
        :key="index"
      >
        <span class="text"
          @mousemove="spanMousemove()"
          @mouseleave="spanMouseleave()"
        >
          <span class="nickName" >{{ o[3] + "："}}</span>
          <span class="content">{{ o[4] }}</span>
        </span>
      </span>
    </template>
  </div>
</template>

<style scoped lang="less">
.danmu {
  display:inline-grid;
  overflow-y: scroll;
  position: absolute !important;
  z-index: 1;
  left: 0;
  bottom: var(--danmu-bottom);
  width: calc(100% - 5px);
  background-color: transparent;
  pointer-events: var(--danmu-pointer-events);
  max-height: 30%;

  &::-webkit-scrollbar {
    width: 5px;
  }
  /*定义滚动条轨道 内阴影+圆角*/
  &::-webkit-scrollbar-track {
    border-radius: 10px;
    background-color: rgba(141, 137, 137, 0.3);
  }
  /*定义滑块 内阴影+圆角*/
  &::-webkit-scrollbar-thumb {
    border-radius: 10px;
    -webkit-box-shadow: inset 0 0 6px rgba(0,0,0,.3);
    background-color: rgba(141,137,137,0.8);
  }
}
.message {
  text-align: left !important;
  margin-left: 5px;
  word-wrap: break-word;
  white-space: normal;
  font-size: 14px;
  display: inline-block;
  margin-top: 3px;
  margin-bottom: 3px;
  -moz-user-select: none;
  -ms-user-select: none;
  -webkit-user-select: none;
  user-select: none;
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
  pointer-events: auto;
}
</style>
