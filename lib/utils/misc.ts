import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function sleep(wait: number) {
  return new Promise(resolve => setTimeout(resolve, wait))
}

export function isTouchDevice() {
  if (typeof window === 'undefined') {
    return false
  }
  const mediaQuery = '(hover: none) and (pointer: coarse)'
  return window.matchMedia(mediaQuery).matches
}
