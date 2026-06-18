<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import {
  Minus,
  Plus,
  SkipBack,
  SkipForward,
  Pause,
  Play,
  LoaderCircle,
} from '@lucide/vue'
import { Button } from '#/components/ui/button'
import IconQueen from '../res/Q.webp'
import { useSolutions } from './use.ts'
import Board from './board.vue'

const nValues = [3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15]

const inputN = ref(8)
const boardN = ref(inputN.value)
const interval = ref(4500)

watch(inputN, n => {
  if (n !== boardN.value) {
    reCalculate()
  }
})

const { isCalculating, timerMs, displayIndex, ...model } = useSolutions()
const isLoading = computed(() => isCalculating.value && timerMs.value > 150)
const timerText = computed(() => (Math.max(timerMs.value, 10) / 1e3).toFixed(2))

onMounted(() => {
  reCalculate()
})

async function reCalculate() {
  const success = await model.tryCalculate(inputN.value)
  if (success) {
    boardN.value = inputN.value
  }
}
</script>

<template>
  <div class="pt-12 select-none">
    <div class="flex items-center gap-3 pl-6">
      <div class="text-3xl font-bold">N</div>
      <div class="text-2xl">=</div>
      <select
        v-model="inputN"
        class="border-ring w-28 appearance-none border-b py-1 text-center text-xl outline-none"
      >
        <option v-for="n in nValues" :key="n" :value="n" class="text-lg">
          {{ n }}
        </option>
      </select>
      <div class="ml-4 space-x-2">
        <Button
          :disabled="inputN <= nValues[0]"
          variant="outline"
          @click="inputN--"
        >
          <Minus />
        </Button>
        <Button
          :disabled="inputN >= nValues[nValues.length - 1]"
          variant="outline"
          @click="inputN++"
        >
          <Plus />
        </Button>
      </div>
    </div>

    <div class="mt-4 flex items-center gap-2 pl-6 text-sm">
      找到
      <div class="border-ring min-w-16 border-b text-center">
        {{ isLoading ? '?' : model.total.value }}
      </div>
      种摆法<i></i>用时
      <div class="border-ring min-w-16 border-b text-center">
        {{ timerText }}
      </div>
      秒
    </div>

    <div class="relative mt-2 w-fit max-w-full sm:ml-5">
      <Board :n="boardN">
        <template #chess-layer>
          <div
            v-for="(x, y) in model.currSolution.value"
            :key="y"
            :style="{
              '--x': `${x * 100}%`,
              '--y': `${y * 100}%`,
            }"
            class="absolute flex size-(--cell-size) translate-x-(--x) translate-y-(--y) items-center justify-center transition-transform duration-250"
          >
            <img
              :src="IconQueen"
              alt="w-queen"
              class="scale-90 object-contain"
            />
          </div>
        </template>
      </Board>
      <Transition name="fade">
        <div
          v-if="isLoading"
          class="absolute inset-0 flex items-center justify-center rounded-lg bg-white/60"
        >
          <LoaderCircle class="animate-spin text-3xl" />
        </div>
      </Transition>
    </div>

    <div v-show="model.total.value > 0" class="mt-4 flex items-center pl-5">
      <div class="flex items-center gap-1">
        <Button
          variant="outline"
          size="icon-lg"
          class="rounded-full"
          @click="displayIndex--"
        >
          <SkipBack />
        </Button>
        <div class="relative size-12">
          <Button
            variant="outline"
            class="size-full rounded-full text-lg"
            @click="model.enableCarousel.value = !model.enableCarousel.value"
          >
            <Pause v-if="model.enableCarousel.value" />
            <Play v-else />
          </Button>
          <svg
            v-if="model.enableCarousel.value"
            class="pointer-events-none absolute inset-0 size-full -rotate-90"
            viewBox="0 0 40 40"
          >
            <circle
              class="text-secondary"
              cx="20"
              cy="20"
              r="18"
              fill="none"
              stroke="currentColor"
              stroke-width="3"
            />
            <circle
              class="progress-circle text-primary"
              cx="20"
              cy="20"
              r="18"
              fill="none"
              stroke="currentColor"
              stroke-width="3"
              stroke-linecap="round"
              stroke-dasharray="113.04"
              stroke-dashoffset="113.04"
              :style="{ animationDuration: `${interval}ms` }"
            />
          </svg>
        </div>
        <Button
          variant="outline"
          size="icon-lg"
          class="rounded-full"
          @click="displayIndex++"
        >
          <SkipForward />
        </Button>
      </div>
      <div class="ml-6 flex items-center gap-2">
        <input
          v-model.lazy="displayIndex"
          class="border-ring w-20 border-b text-center font-mono text-base outline-none"
          @change="displayIndex = displayIndex"
        />
        <div class="text-xs">/</div>
        <div class="font-mono text-sm">{{ model.total.value }}</div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.25s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

@keyframes progress {
  from {
    stroke-dashoffset: 113.04;
  }
  to {
    stroke-dashoffset: 0;
  }
}

.progress-circle {
  animation: progress ease-in-out infinite;
}
</style>
