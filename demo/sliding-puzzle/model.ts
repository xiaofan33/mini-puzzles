import { RectGrid, type Direction, type Position } from '@/lib/utils'

export interface Piece extends Position {
  readonly id: number
  target: Position
}

export class SlidingPuzzleModel {
  w = 0
  h = 0
  steps = 0
  blank: Position = { x: 0, y: 0 }
  pieces: Piece[] = []

  private grid = new RectGrid()
  private isSolved = false

  constructor() {
    this.init({ w: 4, h: 4 })
  }

  init(rect: { w: number; h: number }) {
    const needsReset =
      this.w !== rect.w || this.h !== rect.h || this.pieces.length === 0

    this.w = rect.w
    this.h = rect.h
    this.steps = 0
    this.blank = { x: rect.w - 1, y: rect.h - 1 }
    this.isSolved = false
    this.grid.apply(rect)

    if (needsReset) {
      this.pieces = Array.from({ length: rect.w * rect.h - 1 }, (_, index) => {
        const target = this.grid.indexToPos(index)
        return { id: index + 1, target, ...target }
      })
    } else {
      this.pieces.forEach((p, index) => {
        const target = this.grid.indexToPos(index)
        p.x = target.x
        p.y = target.y
      })
    }
  }

  restore(ids: number[][], steps = 0) {
    validateIds(ids)

    this.init({ w: ids[0].length, h: ids.length })
    this.steps = steps
    this.isSolved = false

    ids.flat().forEach((id, index) => {
      const { x, y } = this.grid.indexToPos(index)
      if (id !== 0) {
        this.pieces[id - 1].x = x
        this.pieces[id - 1].y = y
      } else {
        this.blank.x = x
        this.blank.y = y
      }
    })
  }

  move(arg: number | Direction | Position) {
    if (this.isSolved) return false

    if (typeof arg === 'string') {
    }
  }

  shuffle(steps?: number) {
    steps ??= Math.floor(Math.pow(this.w * this.h, 1.7))
    while (steps > 0) {}
  }

  findPiece(arg: number | Position) {
    return typeof arg === 'number'
      ? this.pieces.find(t => t.id === arg)
      : this.pieces.find(t => t.x === arg.x && t.y === arg.y)
  }

  private findValidMoves() {}

  private findPieceOnPath() {}

  private swapWithBlank(p: Piece) {
    const { x, y } = this.blank
    this.blank.x = p.x
    this.blank.y = p.y
    p.x = x
    p.y = y
  }
}

/**
 * Validate the 2D ID array for puzzle restoration.
 *
 * Rules:
 * 1. Non-empty, rectangular shape (all rows equal length)
 * 2. All IDs are non-negative integers in [0, total - 1]
 * 3. Each ID appears exactly once (0 = blank)
 *
 * @param ids - 2D array where 0 is the blank, others are piece numbers
 * @throws If empty, ragged rows, out-of-range or duplicate IDs
 */
export function validateIds(ids: readonly number[][]) {
  if (ids.length === 0) {
    throw new Error('IDs array must not be empty')
  }

  const cols = ids[0].length
  for (let i = 1; i < ids.length; i++) {
    if (ids[i].length !== cols) {
      throw new Error(
        `Inconsistent row length: row 0 has ${cols}, but row ${i} has ${ids[i].length}`,
      )
    }
  }

  const flat = ids.flat()
  const total = flat.length
  const visit = new Set<number>()

  for (const id of flat) {
    if (!Number.isInteger(id) || id < 0 || id >= total) {
      throw new Error(
        `Invalid ID: ${id}. Expected integers in [0, ${total - 1}]`,
      )
    }
    if (visit.has(id)) {
      throw new Error(`Duplicate ID: ${id}`)
    }
    visit.add(id)
  }

  if (visit.size !== total) {
    throw new Error(`Expected ${total} unique IDs, got ${visit.size}`)
  }
}
