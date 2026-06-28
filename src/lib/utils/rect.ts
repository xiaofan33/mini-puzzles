export type Direction = 'up' | 'down' | 'left' | 'right'
export type GridSize = { w: number; h: number }
export type Position = { x: number; y: number }
export type Bounds = GridSize & Position

const CARDINAL_DIRS: Position[] = [
  { x: 0, y: -1 },
  { x: 0, y: 1 },
  { x: -1, y: 0 },
  { x: 1, y: 0 },
]

const DIAGONAL_DIRS: Position[] = [
  { x: -1, y: -1 },
  { x: -1, y: 1 },
  { x: 1, y: -1 },
  { x: 1, y: 1 },
]

export const DIR_OFFSETS: Record<Direction, Position> = {
  up: CARDINAL_DIRS[0],
  down: CARDINAL_DIRS[1],
  left: CARDINAL_DIRS[2],
  right: CARDINAL_DIRS[3],
} as const

export class RectGrid {
  x = 0
  y = 0
  w = 1
  h = 1

  constructor(bounds: Partial<Bounds> = {}) {
    this.setBounds(bounds)
  }

  setBounds(bounds: Partial<Bounds>) {
    if (bounds.x !== undefined) this.x = bounds.x
    if (bounds.y !== undefined) this.y = bounds.y
    if (bounds.w !== undefined) this.w = bounds.w
    if (bounds.h !== undefined) this.h = bounds.h
  }

  get total() {
    return this.w * this.h
  }

  posToIndex({ x, y }: Position) {
    return (y - this.y) * this.w + (x - this.x)
  }

  indexToPos(index: number) {
    return {
      x: (index % this.w) + this.x,
      y: Math.floor(index / this.w) + this.y,
    }
  }

  isValidPos({ x, y }: Position) {
    const rx = x - this.x
    const ry = y - this.y
    return rx >= 0 && rx < this.w && ry >= 0 && ry < this.h
  }

  getNeighbors(pos: Position, includeDiagonals?: boolean): Position[]
  getNeighbors(index: number, includeDiagonals?: boolean): number[]
  getNeighbors(
    input: Position | number,
    includeDiagonals = false,
  ): Position[] | number[] {
    const dirs = includeDiagonals
      ? [...CARDINAL_DIRS, ...DIAGONAL_DIRS]
      : CARDINAL_DIRS

    if (typeof input === 'number') {
      const w = this.w
      return dirs
        .map(d => ({
          i: input + d.y * w + d.x,
          x: (input % w) + d.x + this.x,
          y: Math.floor(input / w) + d.y + this.y,
        }))
        .filter(p => this.isValidPos(p))
        .map(p => p.i)
    }

    return dirs
      .map(d => ({ x: input.x + d.x, y: input.y + d.y }))
      .filter(p => this.isValidPos(p))
  }
}
