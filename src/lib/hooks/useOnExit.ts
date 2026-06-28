import { useEffect, useRef } from 'react'

/**
 * Runs a callback exactly once when the user leaves the page or the
 * component unmounts, whichever comes first.
 *
 * Uses `pagehide` (instead of `beforeunload`) for reliable mobile support.
 * The callback is guaranteed to fire at most once via an internal guard,
 * and errors are caught to avoid breaking the exit flow.
 */
export function useOnExit(callback: () => void) {
  const callbackRef = useRef(callback)
  callbackRef.current = callback
  const hasExecuted = useRef(false)

  useEffect(() => {
    const runCallback = () => {
      if (hasExecuted.current) return

      hasExecuted.current = true
      try {
        callbackRef.current()
      } catch (error) {
        console.error('Error in useOnExit callback:', error)
      }
    }

    window.addEventListener('pagehide', runCallback)

    return () => {
      window.removeEventListener('pagehide', runCallback)
      runCallback()
    }
  }, [])
}
