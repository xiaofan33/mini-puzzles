<script setup lang="ts">
import { computed, ref, watch } from 'vue'

const props = defineProps<{
  score: number
}>()

const currAnimClass = ref('animate-tile-appear')
watch(
  () => props.score,
  () => (currAnimClass.value = 'animate-tile-merge'),
)

const cssVars = computed(() => {
  return props.score > 0
    ? {
        '--tile-bg': `var(--tile-${props.score}-bg, var(--tile-super-bg))`,
        '--tile-fg': `var(--tile-${props.score}-fg, var(--tile-super-fg))`,
        '--tile-shadow': `var(--tile-${props.score}-shadow, var(--tile-super-shadow))`,
        '--tile-font': `var(--tile-${props.score}-font, var(--tile-super-font))`,
      }
    : {
        '--tile-bg': 'var(--tile-empty-bg)',
        '--tile-fg': 'transparent',
        '--tile-shadow': 'none',
        '--tile-font': '0',
      }
})
</script>

<template>
  <div
    :data-score="props.score"
    :style="cssVars"
    :class="[
      'flex size-full items-center justify-center rounded-md bg-(--tile-bg) text-(length:--tile-font) font-bold text-(--tile-fg) shadow-(--tile-shadow)',
      currAnimClass,
    ]"
    @animationend="currAnimClass = ''"
  >
    {{ props.score }}
  </div>
</template>
