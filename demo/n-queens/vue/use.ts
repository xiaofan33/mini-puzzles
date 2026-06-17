import { computed, readonly, ref, watchEffect } from 'vue'
import {
  tryOnUnmounted,
  useIntervalFn,
  useTimestamp,
  useWebWorkerFn,
} from '@vueuse/core'
import { nQueens$4 } from '../solutions'

export function useSolutions(playInterval = 4500) {
  const { workerFn, workerTerminate } = useWebWorkerFn(
    n => JSON.stringify(nQueens$4(n)),
    { localDependencies: [nQueens$4] },
  )

  const solutions = ref<Number[][]>([])
  const index = ref(0)
  const total = computed(() => solutions.value.length)
  const currSolution = computed(() => solutions.value[index.value])
  const displayIndex = computed({
    get() {
      return index.value + 1
    },
    set(value) {
      const maxIndex = total.value - 1
      let newValue = value - 1

      if (maxIndex === -1) {
        newValue = 0
      } else if (newValue > maxIndex) {
        newValue = 0
      } else if (newValue < 0) {
        newValue = maxIndex
      } else {
        newValue = Math.max(0, Math.min(maxIndex, newValue))
      }

      index.value = newValue
    },
  })

  const timestamp = useTimestamp()
  const isCalculating = ref(false)
  const timerMs = ref(0)
  let startAt = 0
  watchEffect(() => {
    if (isCalculating.value) {
      timerMs.value = timestamp.value - startAt
    }
  })

  const enableCarousel = ref(false)
  const { pause, resume } = useIntervalFn(
    () => displayIndex.value++,
    playInterval,
    { immediate: false },
  )
  watchEffect(() => {
    if (enableCarousel.value) {
      resume()
    } else {
      pause()
    }
  })

  async function tryCalculate(n: number) {
    if (isCalculating.value) {
      return false
    }

    isCalculating.value = true
    enableCarousel.value = false
    const prevMs = timerMs.value
    startAt = timestamp.value

    try {
      solutions.value = JSON.parse(await workerFn(n))
      displayIndex.value = displayIndex.value
      return true
    } catch (error) {
      console.error(error)
      timerMs.value = prevMs
      return false
    } finally {
      isCalculating.value = false
    }
  }

  tryOnUnmounted(() => workerTerminate())

  return {
    total,
    currSolution,
    displayIndex,
    enableCarousel,
    isCalculating: readonly(isCalculating),
    timerMs: readonly(timerMs),
    tryCalculate,
  }
}
