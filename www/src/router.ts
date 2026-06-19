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
    name: '八皇后问题摆法',
    path: '/n-queens',
    component: () => import('@/n-queens/vue/index.vue'),
    meta: {
      description: '用来展示八皇后问题的可行摆法组件',
    },
  },
  {
    name: '华容道',
    path: '/huarong-pass',
    component: () => import('@/huarong-pass/vue/index.vue'),
    meta: {
      description: '曹瞒兵败走华容，正与关公狭路逢',
    },
  },
  {
    name: '滑动拼图',
    path: '/sliding-puzzle',
    component: () => import('@/sliding-puzzle/vue/index.vue'),
    meta: {
      description: '滑块拼图小游戏，又名《数字华容道》',
    },
  },
  {
    name: '康威生命游戏',
    path: '/game-life',
    component: () => import('@/game-life/vue/index.vue'),
    meta: {
      description: '',
    },
  },
]

export const router = createRouter({
  history: createWebHistory(),
  routes: [homeRoute, ...demoRoutes],
})
