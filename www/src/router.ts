import { createWebHistory, createRouter, type RouteRecordRaw } from 'vue-router'

export const homeRoute: RouteRecordRaw = {
  name: '首页',
  path: '/',
  component: () => import('./Home.vue'),
}

export const demoRoutes: RouteRecordRaw[] = [
  {
    name: '2048',
    path: '/2048',
    component: () => import('@/2048/vue/index.vue'),
    meta: {
      description: '经典的 2048 数字合成游戏',
    },
  },
  {
    name: '扫雷',
    path: '/minesweeper',
    component: () => import('@/minesweeper/vue/index.vue'),
    meta: {
      description: 'Emoji 风格的网页端扫雷小游戏',
    },
  },
  {
    name: '八皇后问题摆法演示',
    path: '/n-queens',
    component: () => import('@/n-queens/vue/index.vue'),
    meta: {
      description: '',
    },
  },
]

export const router = createRouter({
  history: createWebHistory(),
  routes: [homeRoute, ...demoRoutes],
})
