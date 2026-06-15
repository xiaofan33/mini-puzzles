import { useEventListener, usePointerSwipe } from '@vueuse/core'
import type { MaybeRefOrGetter } from 'vue'
import type { Direction } from '#/lib/utils'

export type KeyToDirection = Record<string, Direction>

export interface UseMoveHandlerOptions {
  /** Whether to enable keyboard input, default true */
  enableKeyboardInput?: boolean
  /** Whether to enable pointer swipe, default true */
  enablePointerSwipe?: boolean
  /** Swipe threshold for determining valid swipes */
  swipeThreshold?: number
  /** Custom key-to-direction mapping, can override default mapping */
  keyToDirection?: KeyToDirection
  /** Movement direction callback function */
  callback?: (cmd: Direction) => void
}

export const defaultKeyToDirection: Readonly<KeyToDirection> = {
  ArrowUp: 'up',
  ArrowLeft: 'left',
  ArrowDown: 'down',
  ArrowRight: 'right',
  w: 'up',
  a: 'left',
  s: 'down',
  d: 'right',
}

const editableTags = new Set(['INPUT', 'TEXTAREA', 'SELECT'])

function isEditableElement(el: EventTarget | null | undefined) {
  if (!(el instanceof HTMLElement)) return false
  if (editableTags.has(el.tagName)) return true
  return el.isContentEditable
}

export function useMoveHandler(
  element: MaybeRefOrGetter<HTMLElement | null | undefined>,
  options: UseMoveHandlerOptions = {},
) {
  const {
    enableKeyboardInput = true,
    enablePointerSwipe = true,
    swipeThreshold,
    keyToDirection = defaultKeyToDirection,
    callback,
  } = options

  let stops: (() => void)[] = []

  const stopListeners = () => {
    stops.forEach(s => s())
    stops = []
  }

  const setupListeners = () => {
    stopListeners()

    if (enableKeyboardInput) {
      const stop = useEventListener('keydown', event => {
        if (isEditableElement(event.target)) {
          return
        }
        const dir =
          keyToDirection[event.key] ?? keyToDirection[event.key.toLowerCase()]
        if (dir) {
          event.preventDefault()
          callback?.(dir)
        }
      })
      stops.push(stop)
    }

    if (enablePointerSwipe) {
      const { stop } = usePointerSwipe(element, {
        threshold: swipeThreshold,
        onSwipeEnd(_, direction) {
          if (direction !== 'none') {
            callback?.(direction)
          }
        },
      })
      stops.push(stop)
    }
  }

  setupListeners()

  return {
    resume: setupListeners,
    stop: stopListeners,
  }
}
