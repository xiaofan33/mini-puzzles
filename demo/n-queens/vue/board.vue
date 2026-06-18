<script setup lang="ts">
import { ref } from 'vue'

const {
  n = 8,
  boardPadding = 24,
  cellSize = 40,
  cellColors = ['#f0d9b5', '#b58863'],
} = defineProps<{
  n?: number
  boardPadding?: number
  cellSize?: number
  cellColors?: [string /** light cell color */, string /** dark cell color */]
}>()

const scrollLeft = ref(0)
const scrollTop = ref(0)

function onScroll(e: Event) {
  const el = e.target as HTMLElement
  scrollLeft.value = el.scrollLeft
  scrollTop.value = el.scrollTop
}
</script>

<template>
  <div
    :style="{
      '--board-n': n,
      '--board-padding': `${boardPadding}px`,
      '--cell-size': `${cellSize}px`,
      '--cell-light': cellColors[0],
      '--cell-dark': cellColors[1],
    }"
  >
    <div class="relative w-fit max-w-full rounded-lg">
      <div
        class="absolute top-(--board-padding) bottom-(--board-padding) left-0 w-(--board-padding) overflow-hidden"
      >
        <div
          class="flex flex-col"
          :style="{ transform: `translateY(${-scrollTop}px)` }"
        >
          <div
            v-for="(_, i) in n"
            :key="i"
            class="flex h-(--cell-size) w-(--board-padding) shrink-0 items-center justify-center font-mono text-sm opacity-90"
          >
            {{ n - i }}
          </div>
        </div>
      </div>

      <div
        class="absolute right-(--board-padding) bottom-0 left-(--board-padding) h-(--board-padding) overflow-hidden"
      >
        <div
          class="flex"
          :style="{ transform: `translateX(${-scrollLeft}px)` }"
        >
          <div
            v-for="(_, i) in n"
            :key="i"
            class="flex h-(--board-padding) w-(--cell-size) shrink-0 items-center justify-center font-mono text-sm opacity-90"
          >
            {{ String.fromCodePoint(i + 97) }}
          </div>
        </div>
      </div>

      <div class="p-(--board-padding) outline-hidden">
        <div class="overflow-auto rounded-md" @scroll="onScroll">
          <div class="relative">
            <div v-for="(_, y) in n" :key="y" class="flex">
              <div
                v-for="(_, x) in n"
                :key="x"
                :class="[
                  'size-(--cell-size) shrink-0',
                  (x + y) % 2 === 0 ? 'bg-(--cell-light)' : 'bg-(--cell-dark)',
                ]"
              >
                <slot name="board-layer" :x="x" :y="y" />
              </div>
            </div>

            <div class="absolute inset-0">
              <slot name="chess-layer" :cell-size="cellSize" />
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
