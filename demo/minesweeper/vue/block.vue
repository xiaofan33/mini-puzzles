<script setup lang="ts">
import { computed } from 'vue'
import { themeLoader } from '../theme'
import type { Cell } from '../model'

const props = defineProps<{ highlighted?: boolean; palette: string } & Cell>()

const txt = computed(() => {
  if (props.state === 'exploded') {
    return themeLoader.getEmoji('boom')
  }

  if (props.state === 'flagged' || props.state === 'mis-flagged') {
    return themeLoader.getEmoji('flag')
  }

  if (props.state === 'revealed') {
    return props.mine
      ? themeLoader.getEmoji('mine')
      : props.adjacentMineCount!.toString()
  }
})

const cls = computed(() => {
  if (props.state === 'covered') {
    return themeLoader.getPalette(props.palette, props.highlighted)
  }

  if (props.state === 'exploded') {
    return 'border-transparent bg-red-600 animate-boom-shake'
  }

  if (props.state === 'mis-flagged') {
    return 'border-transparent bg-red-300'
  }

  return themeLoader.getPalette(props.palette, props.state !== 'flagged')
})

const color = computed(() => {
  return props.state === 'revealed' && !props.mine
    ? themeLoader.getNumberColor(props.adjacentMineCount!)
    : 'inherit'
})
</script>

<template>
  <div
    :class="[
      'flex size-(--cell-size) items-center justify-center rounded-(--cell-rounded) font-mono font-bold',
      'border bg-linear-to-br transition-[background-color]',
      cls,
    ]"
    :style="{ color }"
  >
    {{ txt }}
  </div>
</template>

<style scoped>
.animate-boom-shake {
  animation: boom-shake 0.25s ease-in-out;
}

@keyframes boom-shake {
  0%,
  100% {
    transform: translate(0, 0);
  }
  25% {
    transform: translate(-2px, -2px);
  }
  50% {
    transform: translate(2px, 2px);
  }
  75% {
    transform: translate(-2px, 2px);
  }
}
</style>
