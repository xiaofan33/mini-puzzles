import { randomInt } from '@/lib/utils'
import type { BoardConfig, GameProps } from './model'
import { difficulties, boardBounds, palettes } from './assets/config.json'

export type DifficultyConfig = (typeof difficulties)[number]

export function findDifficulty(board: BoardConfig): DifficultyConfig | undefined
export function findDifficulty(value: string): DifficultyConfig | undefined
export function findDifficulty(input: BoardConfig | string) {
  if (typeof input === 'string') {
    return difficulties.find(d => d.value === input)
  }
  const { w, h, m } = input
  return difficulties.find(d => d.w === w && d.h === h && d.m === m)
}

export function randomBoard() {
  const w = randomInt(boardBounds.w.min, boardBounds.w.max)
  const h = randomInt(boardBounds.h.min, boardBounds.h.max)
  const percent = randomInt(
    boardBounds.minePercent.min,
    boardBounds.minePercent.max,
  )
  const total = w * h
  const m = Math.max(1, Math.min(total - 1, Math.ceil((total * percent) / 100)))

  return { w, h, m }
}

export function randomPalette(excluded?: string) {
  const available = palettes.filter(key => key !== excluded)
  const pickIndex = Math.floor(Math.random() * available.length)
  return available[pickIndex]
}

export function isTouchDevice() {
  if (typeof window === 'undefined') {
    return false
  }
  const mediaQuery = '(hover: none) and (pointer: coarse)'
  return window.matchMedia(mediaQuery).matches
}

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

/**
 * Format seconds into a compact minutes/seconds string like “59s” or “1m50s”.
 */
export function formatDuration(seconds: number) {
  const totalSeconds = Math.max(0, Math.floor(seconds))
  const hours = Math.floor(totalSeconds / 3600)
  const minutes = Math.floor((totalSeconds % 3600) / 60)
  const secondsInMinute = totalSeconds % 60

  if (hours > 0) {
    return `${hours}h${minutes.toString().padStart(2, '0')}m${secondsInMinute
      .toString()
      .padStart(2, '0')}s`
  }

  if (minutes === 0) {
    return `${secondsInMinute}s`
  }

  return `${minutes}m${secondsInMinute.toString().padStart(2, '0')}s`
}

/**
 * Hit-test a pixel position against the grid.
 * Returns the cell's column/row index, or `undefined` if the position falls in a gap.
 */
export function cellAt(
  pos: { x: number; y: number },
  cellSize: number,
  gap: number,
) {
  const stride = cellSize + gap
  const col = Math.floor(pos.x / stride)
  const row = Math.floor(pos.y / stride)

  // position lands in the gap area between cells
  if (pos.x - col * stride >= cellSize || pos.y - row * stride >= cellSize) {
    return
  }

  return { x: col, y: row }
}

function bytesToBase64Url(bytes: Uint8Array) {
  let binary = ''
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i])
  }
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}

function base64UrlToBytes(str: string): Uint8Array {
  const b64 = str.replace(/-/g, '+').replace(/_/g, '/')
  const pad = (4 - (b64.length % 4)) % 4
  const raw = atob(b64 + '='.repeat(pad))
  const bytes = new Uint8Array(raw.length)
  for (let i = 0; i < raw.length; i++) {
    bytes[i] = raw.charCodeAt(i)
  }
  return bytes
}

/**
 * Encode share data into a compact URL hash.
 *
 * Format: `v1:HEADER.CELLDATA`
 * - HEADER: 8 bytes (w:u8, h:u8, m:u16be, elapsed:u32be) → base64url
 * - CELLDATA: 3 bits per cell (reveal, flag, mine) packed into bytes → base64url
 */
export function buildShareUrl(data: GameProps) {
  const { w, h, m, elapsedTime = 0, cellBitmask = [] } = data

  // Header: w(u8) + h(u8) + m(u16BE) + elapsedTime(u32BE) = 8 bytes
  const header = new Uint8Array(8)
  header[0] = w
  header[1] = h
  header[2] = (m >> 8) & 0xff
  header[3] = m & 0xff
  header[4] = (elapsedTime >> 24) & 0xff
  header[5] = (elapsedTime >> 16) & 0xff
  header[6] = (elapsedTime >> 8) & 0xff
  header[7] = elapsedTime & 0xff

  // Build index→mask lookup from sparse bitmask pairs
  const maskMap = new Map<number, number>()
  for (let i = 0; i < cellBitmask.length; i += 2) {
    maskMap.set(cellBitmask[i], cellBitmask[i + 1])
  }

  // Pack 3 bits per cell into bytes
  const totalCells = w * h
  const cellBytes = new Uint8Array(Math.ceil((totalCells * 3) / 8))
  for (let i = 0; i < totalCells; i++) {
    const mask = maskMap.get(i) || 0
    const base = i * 3
    for (let b = 0; b < 3; b++) {
      if (mask & (1 << b)) {
        const bitPos = base + b
        cellBytes[bitPos >> 3] |= 1 << (bitPos & 7)
      }
    }
  }

  const url = new URL(location.href)
  url.hash = `v1:${bytesToBase64Url(header)}.${bytesToBase64Url(cellBytes)}`
  return url.toString()
}

/**
 * Decode a `v1:HEADER.CELLDATA` hash back into GameProps.
 */
export function decodeShareHash(hash: string): GameProps {
  if (!hash.startsWith('v1:')) {
    throw new Error('Unsupported share format')
  }
  const body = hash.slice(3)
  const dotIndex = body.indexOf('.')
  if (dotIndex === -1) {
    throw new Error('Invalid share format')
  }

  const header = base64UrlToBytes(body.slice(0, dotIndex))
  const w = header[0]
  const h = header[1]
  const m = (header[2] << 8) | header[3]
  const elapsedTime =
    ((header[4] << 24) | (header[5] << 16) | (header[6] << 8) | header[7]) >>> 0

  const cellBytes = base64UrlToBytes(body.slice(dotIndex + 1))
  const totalCells = w * h
  const cellBitmask: number[] = []
  for (let i = 0; i < totalCells; i++) {
    let mask = 0
    const base = i * 3
    for (let b = 0; b < 3; b++) {
      const bitPos = base + b
      if (cellBytes[bitPos >> 3] & (1 << (bitPos & 7))) {
        mask |= 1 << b
      }
    }
    if (mask > 0) {
      cellBitmask.push(i, mask)
    }
  }

  return { w, h, m, elapsedTime, cellBitmask }
}
