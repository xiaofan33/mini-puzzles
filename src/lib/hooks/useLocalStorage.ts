import { useCallback, useEffect, useState } from 'react'

/**
 * Persistent state hook backed by localStorage.
 * Syncs across tabs via the `storage` event.
 */
export function useLocalStorage<T>(key: string, initialValue: T | (() => T)) {
  const [storedValue, setStoredValue] = useState<T>(() => {
    try {
      const item = localStorage.getItem(key)
      if (item) {
        const init = resolve(initialValue)
        const stored = JSON.parse(item) as T
        if (init && typeof init === 'object' && !Array.isArray(init)) {
          return { ...init, ...stored } as T
        }
        return stored
      }
      return resolve(initialValue)
    } catch {
      return resolve(initialValue)
    }
  })

  const setValue = useCallback(
    (value: T | ((prev: T) => T)) => {
      setStoredValue(prev => {
        const next = value instanceof Function ? value(prev) : value
        try {
          localStorage.setItem(key, JSON.stringify(next))
        } catch {}
        return next
      })
    },
    [key],
  )

  const removeValue = useCallback(() => {
    localStorage.removeItem(key)
    setStoredValue(resolve(initialValue))
  }, [key, initialValue])

  // Sync across tabs
  useEffect(() => {
    const handler = (e: StorageEvent) => {
      if (e.key !== key) return
      try {
        setStoredValue(
          e.newValue ? (JSON.parse(e.newValue) as T) : resolve(initialValue),
        )
      } catch {
        setStoredValue(resolve(initialValue))
      }
    }
    window.addEventListener('storage', handler)
    return () => window.removeEventListener('storage', handler)
  }, [key, initialValue])

  return [storedValue, setValue, removeValue] as const
}

function resolve<T>(value: T | (() => T)): T {
  return value instanceof Function ? value() : value
}
