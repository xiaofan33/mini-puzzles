import { clamp } from '.'

/**
 * Creates a rows×cols 2D array, filled with a static value or a function receiving (row, col)
 */
export function create2DArray<T>(
  rows: number,
  cols: number,
  fillValue: T | ((pos: { x: number; y: number }) => T),
) {
  const fill =
    typeof fillValue === 'function'
      ? (fillValue as (pos: { x: number; y: number }) => T)
      : () => fillValue

  return Array.from({ length: rows }, (_, y) =>
    Array.from({ length: cols }, (_, x) => fill({ x, y })),
  )
}

/**
 * Shuffles an array in-place; optionally picks `sampleSize` unique random elements.
 * **Mutates the input array.**
 */
export function arrayShuffle<T>(items: T[], sampleSize?: number) {
  const sourceLength = items.length
  const targetLength =
    sampleSize !== undefined
      ? clamp(Math.floor(sampleSize), 0, sourceLength)
      : sourceLength

  if (targetLength === 0) {
    return []
  }

  for (let i = 0; i < targetLength; i++) {
    const j = i + Math.floor(Math.random() * (sourceLength - i))
    const temp = items[i]
    items[i] = items[j]
    items[j] = temp
  }

  return items.slice(0, targetLength)
}
