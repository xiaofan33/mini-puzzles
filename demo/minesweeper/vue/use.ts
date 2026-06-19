import {
  computed,
  reactive,
  readonly,
  ref,
  toValue,
  watchEffect,
  type MaybeRefOrGetter,
} from 'vue'
import {
  useElementBounding,
  useEventListener,
  useTimestamp,
} from '@vueuse/core'
import { create2DArray } from '#/lib/utils'
import { createModel, type Operation } from '../model'

export function useMinesweeperModel() {
  const m = reactive(createModel())

  const props = computed(() => m.props)
  const state = computed(() => m.state)
  const flagCount = computed(() => m.flagIndices.size)
  const cellGrid = computed(() =>
    create2DArray(
      props.value.rows,
      props.value.cols,
      (y, x) => m.cells[y * props.value.cols + x],
    ),
  )

  const timerMs = ref(0)
  const t = useTimestamp()
  watchEffect(() => {
    if (state.value === 'playing') {
      const { elapsedTime, startAt = t.value } = m.timer
      timerMs.value = t.value - startAt + elapsedTime
    } else if (state.value === 'ready') {
      timerMs.value = 0
    }
  })

  return {
    props,
    state,
    flagCount,
    cellGrid,
    timerMs,
    restore: m.restore.bind(m),
    dump: m.dump.bind(m),
    restart: m.restart.bind(m),
    operate: m.operate.bind(m),
    getAdjacentCells: m.getAdjacentCells.bind(m),
  }
}

export function useBoardEvent(
  element: MaybeRefOrGetter<HTMLElement | null | undefined>,
  handler: (op: Operation) => void,
) {
  const enableHighlight = ref(false)
  const pointerPosition = ref({ x: 0, y: 0 })

  const board = computed(() => toValue(element))
  const { width, height, top, left } = useElementBounding(board)

  useEventListener(board, 'pointerdown', event => {
    const notRightClick = event.button !== 2
    enableHighlight.value = notRightClick
    pointerPosition.value = getRelativePosition(event)
    document.body.addEventListener('pointermove', onPointerMove)
    document.body.addEventListener('pointerup', onPointerUp)
    document.body.addEventListener('pointercancel', onPointerUp)

    function getRelativePosition(e: PointerEvent) {
      return {
        x: e.clientX - left.value + board.value!.scrollLeft,
        y: e.clientY - top.value + board.value!.scrollTop,
      }
    }

    function onPointerMove(e: PointerEvent) {
      const pos = getRelativePosition(e)
      if (
        pos.x >= 0 &&
        pos.x < width.value &&
        pos.y >= 0 &&
        pos.y < height.value
      ) {
        pointerPosition.value = pos
        enableHighlight.value = notRightClick
      } else {
        enableHighlight.value = false
      }
    }
    function onPointerUp() {
      enableHighlight.value = false
      document.body.removeEventListener('pointermove', onPointerMove)
      document.body.removeEventListener('pointerup', onPointerUp)
      document.body.removeEventListener('pointercancel', onPointerUp)
    }
  })

  const operateHandlers: Array<[keyof HTMLElementEventMap, Operation]> = [
    ['click', 'reveal'],
    ['dblclick', 'chord-reveal'],
    ['contextmenu', 'toggle-flag'],
  ]
  operateHandlers.forEach(([eventName, action]) => {
    useEventListener(board, eventName, event => {
      event.preventDefault()
      handler?.(action)
    })
  })

  return {
    enableHighlight: readonly(enableHighlight),
    pointerPosition: readonly(pointerPosition),
  }
}
