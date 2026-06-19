<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { useLocalStorage } from '@vueuse/core'
import { Button } from '#/components/ui/button'
import { useBeforeExit } from '#/lib/composables'
import configJson from '../res/config.json'
import { themeLoader, type Settings } from '../theme'
import { celebrateWin } from '../confetti'
import { useMinesweeperModel } from './use'
import Board from './board.vue'
import type { GameProps } from '../model.ts'

const settings = useLocalStorage<Settings>(
  configJson.settingsStoreKey,
  configJson.defaultSettings,
  { mergeDefaults: true },
)

const { state, ...model } = useMinesweeperModel()
// prettier-ignore
const isGameEnd = computed(() => state.value === 'won' || state.value === 'lost')
const isPlaying = computed(() => state.value === 'playing')
const gameLevel = ref('')

watch(state, s => {
  if (s === 'won') {
    celebrateWin()
  }
})

function newGame(props: GameProps = settings.value) {
  model.restore(props)
  syncGameLevel()
}

function patchSettings(newSettings: Partial<Settings>) {
  settings.value = { ...settings.value, ...newSettings }
}

function syncGameLevel() {
  const { cols: c, rows: r, mineCount: m } = model.props.value
  const mode = configJson.gameModes.find(
    item => item.cols === c && item.rows === r && item.mineCount === m,
  )
  gameLevel.value = mode?.key || 'custom'
}

function onSelectGameLevel() {
  const item = configJson.gameModes.find(item => item.key === gameLevel.value)
  if (item && item.key !== 'custom') {
    const data = { rows: item.rows, cols: item.cols, mineCount: item.mineCount }
    newGame(data)
    patchSettings(data)
  } else {
    // show custom dialog
  }
}

function onClickWindmill() {
  const palette = themeLoader.getRandomPalette(settings.value.palette)
  patchSettings({ palette })
}

/**
 * ----------------------------------------------------------------------------
 * save & restore & share
 * ----------------------------------------------------------------------------
 */
const shareLink = ref('')
const isSharedGame = ref(false)
const hasSavedGame = ref(false)

useBeforeExit(() => {
  if (!isSharedGame.value && isPlaying.value) {
    const data = model.dump()
    localStorage.setItem(configJson.lastGameStoreKey, JSON.stringify(data))
  }
})

onMounted(() => {
  hasSavedGame.value = !!localStorage.getItem(configJson.lastGameStoreKey)
  isSharedGame.value = restoreSharedGame(location.hash)
  if (!isSharedGame.value) {
    newGame()
  }
})

function restoreSharedGame(hash: string) {
  if (!hash) {
    return false
  }

  try {
    const dataStr = atob(hash.slice(1))
    const data = JSON.parse(dataStr)
    newGame(data)
    return true
  } catch (error) {
    console.error('failed to restore shared game', error)
    return false
  }
}

function restoreSavedGame() {
  const key = configJson.lastGameStoreKey
  try {
    const dataStr = localStorage.getItem(key)
    if (!dataStr) {
      return false
    }
    const data = JSON.parse(dataStr)
    newGame(data)
    return true
  } catch (error) {
    console.error('failed to restore saved game', error)
    return false
  } finally {
    localStorage.removeItem(key)
    hasSavedGame.value = false
  }
}

function createShareLink() {
  const data = model.dump()
  const url = new URL(location.href)
  url.hash = btoa(JSON.stringify(data))
  shareLink.value = url.toString()
}
</script>

<template>
  <div class="select-none">
    <div class="flex flex-col items-center justify-center gap-2">
      <div class="">
        <Button variant="ghost" class="size-12 text-xl" @click="newGame()">
          {{ themeLoader.getEmoji(state) }}
        </Button>
      </div>

      <div class="max-w-full px-4">
        <Board
          :settings="settings"
          :cell-grid="model.cellGrid.value"
          :get-adjacent-cells="model.getAdjacentCells"
          :operate="model.operate"
        />
      </div>
    </div>
  </div>
</template>
