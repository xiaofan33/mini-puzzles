import {
  RectGrid,
  DIR_OFFSETS,
  type Direction,
  type Position,
} from '@/lib/utils'
import { validateIds } from './utils'

export interface Piece extends Position {
  readonly id: number
  target: Position
}

/** ID representing the blank (empty) space in the grid */
export const BLANK_ID = 0

export class SlidingPuzzle {
  steps = 0
  items: Piece[] = []
  blank: Position = { x: 0, y: 0 }

  private rectGrid: RectGrid
  private isSolved = false

  constructor(rectGrid: RectGrid = new RectGrid({ x: 0, y: 0 })) {
    this.rectGrid = rectGrid
    this.init({ w: 4, h: 4 })
  }

  get w() {
    return this.rectGrid.w
  }

  get h() {
    return this.rectGrid.h
  }

  get solved() {
    return this.isSolved
  }

  init({ w, h, steps = 0 }: { w: number; h: number; steps?: number }) {
    const needsRebuild = this.w !== w || this.h !== h || this.items.length === 0
    if (needsRebuild) {
      this.rectGrid.setBounds({ w, h })
      this.items = Array.from({ length: w * h - 1 }, (_, i) => {
        const target = this.rectGrid.indexToPos(i)
        return { id: i + 1, target, ...target }
      })
      this.blank = { x: w - 1, y: h - 1 }
    }

    this.steps = steps
    this.isSolved = false
  }

  restore(ids: number[][], steps = 0) {
    const validation = validateIds(ids)
    if (!validation.ok) throw new Error(validation.msg)

    const w = ids[0].length
    const h = ids.length
    this.init({ w, h, steps })

    ids.flat().forEach((id, index) => {
      const pos = this.rectGrid.indexToPos(index)
      if (id !== BLANK_ID) {
        const piece = this.findPiece(id)
        if (piece) {
          piece.x = pos.x
          piece.y = pos.y
        }
      } else {
        this.blank = pos
      }
    })
  }

  move(input: number | Direction | Position) {
    if (this.isSolved) return

    if (typeof input === 'string') {
      const offset = DIR_OFFSETS[input]
      input = { x: this.blank.x - offset.x, y: this.blank.y - offset.y }
    }

    const starting = this.findPiece(input)
    const chain = this.findSlideChain(starting)
    if (!chain) return

    for (const item of chain) {
      this.swap(item)
      this.steps++
    }

    if (this.items.every(p => p.x === p.target.x && p.y === p.target.y)) {
      this.isSolved = true
    }
  }

  shuffle(steps?: number) {
    if (this.items.length === 0) return

    steps = steps ?? Math.floor(Math.pow(this.rectGrid.total, 1.7))
    while (steps > 0) {
      const neighbors = this.rectGrid.getNeighbors(this.blank)
      if (neighbors.length === 0) break

      const target = neighbors[Math.floor(Math.random() * neighbors.length)]
      const piece = this.findPiece(target)
      if (piece) {
        this.swap(piece)
        steps--
      }
    }

    this.steps = 0
    this.isSolved = false
  }

  findPiece(input: number | Position) {
    return typeof input === 'number'
      ? this.items.find(item => item.id === input)
      : this.items.find(item => item.x === input.x && item.y === input.y)
  }

  private findSlideChain(starting?: Piece) {
    if (!starting) return

    let { x: startX, y: startY } = starting
    let offsetX = Math.abs(startX - this.blank.x)
    let offsetY = Math.abs(startY - this.blank.y)
    if (offsetX !== 0 && offsetY !== 0) return

    const path: Position[] = []
    if (offsetX !== 0) {
      const step = startX > this.blank.x ? -1 : 1
      while (offsetX > 0) {
        path.push({ x: startX + step, y: startY })
        startX += step
        offsetX--
      }
    } else {
      const step = startY > this.blank.y ? -1 : 1
      while (offsetY > 0) {
        path.push({ x: startX, y: startY + step })
        startY += step
        offsetY--
      }
    }

    return path.map(pos => this.findPiece(pos)).filter(Boolean) as Piece[]
  }

  private swap(p: Piece, b = this.blank) {
    const { x, y } = b
    b.x = p.x
    b.y = p.y
    p.x = x
    p.y = y
  }
}
