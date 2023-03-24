import { createRouter, createWebHashHistory,  RouteRecordRaw } from 'vue-router'
const Live = ()=> import('../components/Live.vue')
const MemberCard = ()=> import('../components/MemberCard.vue')
// const Home = ()=> import('../views/home/home.vue')
// const About = ()=> import('../views/about/about.vue')
const routes: Array<RouteRecordRaw> = [
    {    path: '/',    name: 'memberCard',    component: MemberCard},
    {    path: '/live',    name: 'live',    component: Live},
    // {    path: '/home',    name: 'home',    component: Home,  }, 
    // {    path: '/about',    name: 'about',    component: About  },
]
const router = createRouter({
    history: createWebHashHistory(),
    routes
})

export default router