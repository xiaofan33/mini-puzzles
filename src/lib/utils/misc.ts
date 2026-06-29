import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function isTouchDevice() {
  if (typeof window === 'undefined') {
    return false
  }
  const mediaQuery = '(hover: none) and (pointer: coarse)'
  return window.matchMedia(mediaQuery).matches
}

/**
 * Format seconds into a compact duration string.
 * Omits any unit whose value is zero (e.g. 3600 → "1h", 60 → "1m").
 */
export function formatDuration(seconds: number) {
  const totalSeconds = Math.max(0, Math.floor(seconds))
  const hours = Math.floor(totalSeconds / 3600)
  const minutes = Math.floor((totalSeconds % 3600) / 60)
  const secondsInMinute = totalSeconds % 60

  if (hours > 0) {
    let result = `${hours}h`
    if (minutes > 0) {
      result += `${minutes.toString().padStart(2, '0')}m`
    }
    if (secondsInMinute > 0) {
      result += `${secondsInMinute.toString().padStart(2, '0')}s`
    }
    return result
  }

  if (minutes > 0) {
    return secondsInMinute > 0
      ? `${minutes}m${secondsInMinute.toString().padStart(2, '0')}s`
      : `${minutes}m`
  }

  return `${secondsInMinute}s`
}
