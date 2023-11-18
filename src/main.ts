import { createApp } from 'vue'
import "./style.css"
import App from './App.vue'
import './samples/node-api'
import router from './router/index'
import { VueMasonryPlugin } from 'vue-masonry';
import { createPinia } from 'pinia';


createApp(App)
  .use(router)
  .use(VueMasonryPlugin)
  .use(createPinia())
  .mount('#app')
  .$nextTick(() => {
    postMessage({ payload: 'removeLoading' }, '*')
  })
