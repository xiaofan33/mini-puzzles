export function validateIds(
  ids: readonly number[][],
): { ok: true } | { ok: false; msg: string } {
  if (ids.length === 0) {
    return { ok: false, msg: 'IDs array must not be empty' }
  }

  const cols = ids[0].length
  if (cols === 0) {
    return { ok: false, msg: 'Row cannot be empty' }
  }

  for (let i = 1; i < ids.length; i++) {
    if (ids[i].length !== cols) {
      return {
        ok: false,
        msg: `Inconsistent row length: row 0 has ${cols}, but row ${i} has ${ids[i].length}`,
      }
    }
  }

  const total = cols * ids.length
  const seen = new Array<boolean>(total)

  for (const row of ids) {
    for (const id of row) {
      if (id < 0 || id >= total) {
        return {
          ok: false,
          msg: `Invalid ID: ${id}. Expected integers in [0, ${total - 1}]`,
        }
      }
      if (seen[id]) {
        return { ok: false, msg: `Duplicate ID: ${id}` }
      }
      seen[id] = true
    }
  }

  return { ok: true }
}

/**
 * Check if a puzzle state (0 = blank) is solvable.
 *
 * @example
 * ```ts
 * // 3x3, solvable
 * isSolvable([[1, 2, 3], [4, 5, 6], [7, 8, 0]]) // true
 * // 3x3, unsolvable
 * isSolvable([[1, 2, 3], [4, 5, 6], [8, 7, 0]]) // false
 * ```
 */
export function isSolvable(ids: number[][]) {
  if (!validateIds(ids).ok) return false

  const h = ids.length
  const w = ids[0].length

  const flat: number[] = []
  let blankRowFromBottom = 0
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const val = ids[y][x]
      if (val === 0) {
        blankRowFromBottom = h - y
      } else {
        flat.push(val)
      }
    }
  }

  let inversions = 0
  for (let i = 0; i < flat.length; i++) {
    for (let j = i + 1; j < flat.length; j++) {
      if (flat[i] > flat[j]) inversions++
    }
  }

  return w % 2 === 1
    ? inversions % 2 === 0
    : (inversions + blankRowFromBottom) % 2 === 1
}
