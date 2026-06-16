<script setup lang="ts">
import { computed, onMounted, ref, toValue, useTemplateRef, watch } from 'vue'
import { Undo } from '@lucide/vue'
import { gameModes } from '../res/config.json'
import { useGame2048 } from './use'
import Board from './board.vue'

const modeIndex = ref(0)
const gameProps = computed(() => gameModes[modeIndex.value])

const showGameOverDialog = ref(false)
const tileAppearDelay = ref('0')
const tileBoard = useTemplateRef<HTMLElement>('tile-board')

const { state, bestScore, isNewRecord, isGameOver, ...model } = useGame2048(
  tileBoard,
  {
    bestScoreKey: computed(() => `2048-best-score-${gameProps.value.label}`),
    moveCallback(direction) {
      if (model.move(direction)) {
        tileAppearDelay.value = '0.2s'
      }
    },
  },
)

onMounted(() => {
  if (model.tryLoadState()) {
    const { boardSize: s } = model.dump()
    if (s !== gameProps.value.boardSize) {
      modeIndex.value = gameModes.findIndex(m => m.boardSize === s)!
    }
  }
})

function newGame() {
  model.restore(gameProps.value)
  tileAppearDelay.value = '0'
  showGameOverDialog.value = false
}

let gameOverTimer: ReturnType<typeof setTimeout>
watch(isGameOver, val => {
  clearTimeout(gameOverTimer)
  if (val) {
    gameOverTimer = setTimeout(() => (showGameOverDialog.value = true), 1000)
  } else {
    showGameOverDialog.value = false
  }
})

const scoreLabel = ref(0)
const scoreToast = useTemplateRef('score-toast')
const scoreToastParent = computed(() => toValue(scoreToast)?.parentElement)
watch(
  () => state.value.score,
  (newScore, oldScore) => {
    if (oldScore !== undefined && oldScore < newScore) {
      playScoreIncAnimation(oldScore, newScore - oldScore)
    } else {
      scoreLabel.value = newScore
    }
  },
)

function playScoreIncAnimation(from: number, increment: number) {
  let startAt = 0
  let duration = 250
  let loop = (t: number) => {
    startAt = startAt || t
    const rawPercent = Math.min((t - startAt) / duration, 1)
    scoreLabel.value = Math.floor(increment * rawPercent) + from
    if (rawPercent < 1) {
      requestAnimationFrame(loop)
    }
  }
  requestAnimationFrame(loop)

  const parentEl = scoreToastParent.value
  if (scoreToast.value && parentEl) {
    const toast = scoreToast.value.cloneNode(true) as HTMLElement
    toast.textContent = `+${increment}`
    toast.classList.replace('hidden', 'animate-score-toast')
    toast.addEventListener('animationend', () => toast.remove(), {
      once: true,
    })
    parentEl.appendChild(toast)
  }
}
</script>

<template>
  <div
    :style="{
      '--board-size': gameProps.boardSize,
      '--tile-appear-delay': tileAppearDelay,
    }"
    class="game-2048 min-h-screen bg-(--page-bg) text-center text-(--page-fg) select-none"
  >
    <div class="inline-flex flex-col p-4">
      <div class="flex items-stretch">
        <div class="flex items-center justify-center">
          <div class="text-5xl font-bold">2048</div>
        </div>
        <div class="relative ml-auto flex gap-2 text-center font-bold">
          <div
            class="w-24 rounded-lg border bg-(--panel-bg) p-1 text-(--panel-fg)"
          >
            <div class="text-sm">得分</div>
            <div class="text-lg text-white">{{ scoreLabel }}</div>
            <div
              ref="score-toast"
              class="absolute bottom-0 left-12 hidden -translate-x-1/2"
            />
          </div>
          <div
            class="w-24 rounded-lg border bg-(--panel-bg) p-1 text-(--panel-fg)"
          >
            <div class="text-sm">
              {{ isNewRecord ? '新纪录' : '最佳' }}
            </div>
            <div class="text-lg text-white">{{ bestScore }}</div>
          </div>
        </div>
      </div>

      <div class="mt-2 flex items-center gap-2">
        <select
          v-model="modeIndex"
          @change="newGame"
          class="w-24 appearance-none rounded-lg border bg-(--btn-bg) px-5 py-2 text-white focus:outline-none"
        >
          <option v-for="(d, i) in gameModes" :key="i" :value="i">
            {{ d.label }}
          </option>
        </select>
        <button
          class="ml-auto flex h-11 w-24 items-center justify-center rounded-lg border bg-(--btn-bg) font-bold text-white focus:outline-none"
          @click="newGame"
        >
          新游戏
        </button>
      </div>

      <div class="mx-auto mt-12 w-fit space-y-2">
        <Board
          ref="tile-board"
          :board-size="gameProps.boardSize"
          :tiles="state.tiles"
        />
        <div class="mx-auto mt-4 w-fit">
          <button
            :disabled="!model.canUndo()"
            class="flex size-12 items-center justify-center rounded-lg transition focus:outline-none disabled:cursor-not-allowed disabled:opacity-40"
            @click="model.undo()"
          >
            <Undo class="text-lg" />
          </button>
        </div>
      </div>
    </div>

    <div
      v-if="showGameOverDialog"
      class="fixed inset-0 flex items-center justify-center bg-black/50 backdrop-blur-sm"
      @click="showGameOverDialog = false"
    >
      <div
        class="flex w-80 flex-col gap-5 rounded-2xl bg-(--page-bg) p-6 shadow-2xl md:w-96"
        @click.stop
      >
        <div class="text-center text-xl font-bold">
          {{ isNewRecord ? '🎉 恭喜您打破纪录' : '游戏结束' }}
        </div>

        <div class="grid grid-cols-2 gap-3">
          <span class="opacity-75">本局移动</span>
          <span class="font-bold">{{ state.steps }}</span>
          <span class="opacity-75">当前得分</span>
          <span class="font-bold">{{ state.score }}</span>
          <span class="opacity-75">历史最佳</span>
          <span class="font-bold">{{ bestScore }}</span>
        </div>

        <div class="my-4 flex flex-col gap-3">
          <button
            class="flex-1 rounded-lg border px-4 py-3 text-sm font-bold focus:outline-none"
            @click="showGameOverDialog = false"
          >
            关闭
          </button>
          <button
            class="flex-1 rounded-lg border bg-(--btn-bg) px-4 py-3 text-sm font-bold text-white focus:outline-none"
            @click="newGame"
          >
            新游戏
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<style src="../res/main.css"></style>

<style scoped>
select {
  appearance: none;
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='%23756452' d='M6 9L1 4h10z'/%3E%3C/svg%3E");
  background-repeat: no-repeat;
  background-position: right 1rem center;
  background-size: 0.9rem 0.9rem;
  padding-right: 2.5rem;
}
</style>
