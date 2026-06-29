import { clamp, randomInt } from '@/lib/utils'
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

/**
 * Compute valid mine count range [min, max] for a given total cell count.
 */
export function mineBounds(total: number) {
  const { mineDensityMin: minP, mineDensityMax: maxP } = boardBounds
  const min = Math.max(1, Math.ceil((total * minP) / 100))
  const max = Math.min(Math.floor((total * maxP) / 100), total - 9)
  return [min, max]
}

export function randomBoardConfig(): BoardConfig {
  const { wMin, wMax, hMin, hMax, mineDensityMin, mineDensityMax } = boardBounds

  const w = randomInt(wMin, wMax)
  const h = randomInt(hMin, hMax)
  const total = w * h
  const percent = randomInt(mineDensityMin, mineDensityMax)

  const [minM, maxM] = mineBounds(total)
  const m = clamp(Math.round((total * percent) / 100), minM, maxM)

  return { w, h, m }
}

export function randomPalette(excluded?: string) {
  const available = palettes.filter(key => key !== excluded)
  const pickIndex = Math.floor(Math.random() * available.length)
  return available[pickIndex]
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
 * Hit-test a pixel position against a 2D grid.
 * Returns the cell at that position, or `undefined` if the position
 * falls in a gap or outside the grid bounds.
 */
export function pickCell<T>(
  pos: { x: number; y: number },
  size: number,
  gap: number,
  grid: T[][],
) {
  const stride = size + gap
  const col = Math.floor(pos.x / stride)
  const row = Math.floor(pos.y / stride)

  // position lands in the gap area between cells
  if (pos.x - col * stride >= size || pos.y - row * stride >= size) return

  // position lands outside the grid bounds
  if (row >= grid.length || col >= (grid[0]?.length ?? 0)) return

  return grid[row][col]
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
