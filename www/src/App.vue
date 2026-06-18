<script setup lang="ts">
import { useRoute } from 'vue-router'

const route = useRoute()
</script>

<template>
  <div v-if="route.path !== '/'" class="flex justify-end">
    <a href="/" class="p-1 text-sm hover:underline"> 返回首页 </a>
  </div>
  <RouterView />
</template>
