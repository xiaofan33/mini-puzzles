import { useEventListener, tryOnUnmounted } from '@vueuse/core'

export function useBeforeExit(callback: () => void) {
  let hasExecuted = false

  const executeCallback = () => {
    if (hasExecuted) {
      return
    }
    hasExecuted = true
    callback()
  }

  const cleanup = useEventListener('pagehide', executeCallback)
  tryOnUnmounted(executeCallback)

  return cleanup
}
