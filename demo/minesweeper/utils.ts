import { emojis, palettes } from './assets/config.json'
import { userSettings } from './assets/config.json'

export type EmojiKey = keyof typeof emojis
export type Settings = typeof userSettings

class ThemeLoader {
  private emojis: Record<EmojiKey, string>
  private palettes: string[]

  constructor() {
    this.emojis = emojis
    this.palettes = palettes
  }

  getEmoji(key: EmojiKey) {
    return this.emojis[key]
  }

  getRandomPalette(excluded?: string) {
    const available = this.palettes.filter(key => key !== excluded)
    const pickIndex = Math.floor(Math.random() * available.length)
    return available[pickIndex]
  }
}

export const themeLoader = new ThemeLoader()

/**
 * Format seconds into MM:SS.
 *
 * - minutes are capped at 99 so the display never exceeds two digits
 * - when minutes are capped at 99, seconds are limited to 59
 */
export function formatTime(seconds: number) {
  const totalSeconds = Math.max(0, seconds)
  const rawMinutes = Math.floor(totalSeconds / 60)
  const minutes = Math.min(rawMinutes, 99)
  const secondsInMinute = totalSeconds % 60
  const s = minutes === 99 ? Math.min(secondsInMinute, 59) : secondsInMinute

  return `${minutes.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`
}

export function cellAt(
  point: { x: number; y: number },
  cellSize: number,
  gap: number,
) {
  const stride = cellSize + gap
  const col = Math.floor(point.x / stride)
  const row = Math.floor(point.y / stride)

  if (
    point.x - col * stride >= cellSize ||
    point.y - row * stride >= cellSize
  ) {
    return
  }

  return { x: col, y: row }
}
