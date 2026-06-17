<script setup lang="ts">
import { demoRoutes } from './router'
</script>

<template>
  <div class="min-h-dvh">
    <ul class="mx-auto max-w-sm space-y-1 py-8">
      <li v-for="route in demoRoutes" :key="route.path">
        <RouterLink :to="route.path" class="block px-2 py-1 hover:underline">
          {{ route.name }}
        </RouterLink>
      </li>
    </ul>
  </div>
</template>
