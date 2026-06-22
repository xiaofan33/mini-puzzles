import type { Position, Rect } from '.'

export const ADJACENT_OFFSETS = [
  [-1, -1],
  [0, -1],
  [1, -1],
  [-1, 0],
  [1, 0],
  [-1, 1],
  [0, 1],
  [1, 1],
] as const

export class RectGrid {
  rect: Rect = { w: 1, h: 1 }

  apply(rect: Partial<Rect>) {
    this.rect = { ...this.rect, ...rect }
  }

  posToIndex({ x, y }: Position) {
    return y * this.rect.w + x
  }

  indexToPos(index: number) {
    return {
      x: index % this.rect.w,
      y: Math.floor(index / this.rect.w),
    }
  }

  isValidPos({ x, y }: Position) {
    return x >= 0 && x < this.rect.w && y >= 0 && y < this.rect.h
  }

  getAdjacentIndices(index: number) {
    const pos = this.indexToPos(index)
    return ADJACENT_OFFSETS.map(([dx, dy]) => ({
      x: pos.x + dx,
      y: pos.y + dy,
    }))
      .filter(pos => this.isValidPos(pos))
      .map(pos => this.posToIndex(pos))
  }
}
