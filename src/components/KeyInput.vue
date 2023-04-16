<script setup lang="ts">
import { ref } from 'vue'
import { getIMKey, setIMKey, closeWin } from '../renderer/index';
document.title = "弹幕令牌设置";
const input = ref('');
getIMKey().then((key: any) => {
  input.value = key;
})
const setKey = () =>{
  setIMKey(input.value || "");
  closeWin();
}
</script>

<template>
  <div class="box">
    <span>请输入令牌</span>
    <input v-model="input" placeholder="" />
    <button style="background-color: #1a1a1a; margin-top: 5px; font-size: 13px;" @click="setKey()">设置</button>
  </div>
</template>

<style scoped>
.box {
  display: flex;
  justify-content: space-evenly; /* 水平均匀分布 */
  align-items: center; /* 垂直居中 */
  flex-direction: column;
}
</style>
