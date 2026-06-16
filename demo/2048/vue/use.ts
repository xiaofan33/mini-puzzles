import { computed, reactive, toValue, watch, type MaybeRefOrGetter } from 'vue'
import { useLocalStorage } from '@vueuse/core'
import { useBeforeExit, useMoveHandler } from '#/lib/composables'
import { createModel } from '../model'
import type { Direction } from '#/lib/utils'

export interface UseGame2048Options {
  bestScoreKey?: MaybeRefOrGetter<string>
  saveStateKey?: MaybeRefOrGetter<string>
  swipeThreshold?: number
  moveCallback?: (d: Direction) => void
}

export function useGame2048(
  element: MaybeRefOrGetter<HTMLElement | null | undefined>,
  options: UseGame2048Options = {},
) {
  const {
    bestScoreKey = '2048-best-score',
    saveStateKey = '2048-save-state',
    swipeThreshold = 30,
    moveCallback: callback,
  } = options

  const model = reactive(createModel())

  const bestScore = useLocalStorage(bestScoreKey, 0)
  const isNewRecord = computed(
    () => model.state.score >= bestScore.value && bestScore.value > 0,
  )

  watch(
    () => model.state.score,
    value => (bestScore.value = Math.max(bestScore.value, value)),
  )

  useBeforeExit(() => {
    if (!model.isGameOver()) {
      const data = model.dump()
      localStorage.setItem(toValue(saveStateKey), JSON.stringify(data))
    }
  })

  useMoveHandler(element, {
    swipeThreshold,
    callback,
  })

  const tryLoadState = () => {
    const key = toValue(saveStateKey)
    const str = localStorage.getItem(key)
    if (!str) {
      return false
    }

    try {
      const data = JSON.parse(str)
      model.restore(data)
      return true
    } catch (error) {
      console.error('Failed to load saved game state:', error)
      return false
    } finally {
      localStorage.removeItem(key)
    }
  }

  return {
    state: computed(() => model.state),
    bestScore: computed(() => bestScore.value),
    isGameOver: computed(() => model.isGameOver()),
    isNewRecord,
    move: model.move.bind(model),
    undo: model.undo.bind(model),
    dump: model.dump.bind(model),
    restore: model.restore.bind(model),
    canUndo: model.canUndo.bind(model),
    tryLoadState,
  }
}
