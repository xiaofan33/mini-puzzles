<script setup lang="ts">
import { demoRoutes } from './router'
</script>

<template>
  <ul class="mx-auto max-w-sm space-y-2 px-5 py-8">
    <li v-for="route in demoRoutes" :key="route.path">
      <RouterLink :to="route.path" class="hover:underline">
        {{ route.name }}
      </RouterLink>
    </li>
  </ul>
</template>
