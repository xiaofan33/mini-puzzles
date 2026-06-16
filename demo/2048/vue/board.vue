<script setup lang="ts">
import Tile from './tile.vue'
import type { TileState } from '../model'

defineProps<{
  boardSize: number
  tiles: TileState[]
}>()
</script>

<template>
  <div
    class="w-fit touch-none rounded-xl bg-(--tile-board-bg) p-(--tile-gap) select-none"
    @touchmove.prevent
  >
    <div
      class="relative grid grid-cols-[repeat(var(--board-size),var(--tile-size))] gap-(--tile-gap)"
    >
      <div
        v-for="_ in boardSize ** 2"
        :key="_"
        class="size-(--tile-size) rounded-md bg-(--tile-empty-bg)"
      ></div>
      <div class="absolute">
        <div
          v-for="{ id, value, x, y } in tiles"
          :key="id"
          :style="{
            '--x': `calc(var(--tile-size) * ${x} + var(--tile-gap) * ${x})`,
            '--y': `calc(var(--tile-size) * ${y} + var(--tile-gap) * ${y})`,
          }"
          class="absolute size-(--tile-size) translate-x-(--x) translate-y-(--y) transition-transform duration-(--tile-anim-duration) ease-(--tile-bounce-ease)"
        >
          <Tile :score="value" />
        </div>
      </div>
    </div>
  </div>
</template>
