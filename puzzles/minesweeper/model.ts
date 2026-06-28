import { arrayShuffle, create2DArray, RectGrid } from '@/lib/utils'

export type GameStatus = 'ready' | 'playing' | 'won' | 'lost'
export type CellStatus =
  | 'covered'
  | 'flagged'
  | 'revealed'
  | 'exploded'
  | 'misflagged'
export type Operation = 'reveal' | 'chord-reveal' | 'toggle-flag'

export interface Cell {
  readonly index: number
  mine: boolean
  status: CellStatus
  adjacentMineCount?: number
}

export interface BoardConfig {
  w: number
  h: number
  m: number /** number of mines */
}

export interface GameProps extends BoardConfig {
  elapsedTime?: number /** milliseconds */
  cellBitmask?: readonly number[]
}

const CELL_FLAGS = {
  reveal: 1 << 0, // 0b001
  flag: 1 << 1, // 0b010
  mine: 1 << 2, // 0b100
} as const

export class Minesweeper {
  status: GameStatus = 'ready'
  cells: Cell[] = []
  mineCount = 0
  flagIndices: Set<number> = new Set()

  private timer: { startAt?: number; elapsed: number } = { elapsed: 0 }
  private mineIndices: number[] = []
  private rectGrid: RectGrid
  private adjacentCellsCache: WeakMap<Cell, Cell[]> = new WeakMap()
  private remainingToRevealCount = 0

  constructor(rectGrid: RectGrid = new RectGrid({ x: 0, y: 0 })) {
    this.rectGrid = rectGrid
  }

  get boardConfig() {
    return { w: this.rectGrid.w, h: this.rectGrid.h, m: this.mineCount }
  }

  restore(props: GameProps) {
    const { elapsedTime, cellBitmask, w, h, m } = props

    const needsInit =
      this.rectGrid.w !== w || this.rectGrid.h !== h || this.cells.length === 0
    if (needsInit) {
      this.rectGrid.setBounds({ w, h })
      this.adjacentCellsCache = new WeakMap()
      this.cells = Array.from({ length: this.rectGrid.total }, (_, index) => ({
        index,
        mine: false,
        status: 'covered',
      }))
    } else {
      this.cells.forEach(c => {
        c.mine = false
        c.status = 'covered'
        c.adjacentMineCount = undefined
      })
    }

    this.mineCount = m
    this.timer = { elapsed: elapsedTime || 0 }
    this.flagIndices.clear()
    this.mineIndices = []
    this.remainingToRevealCount = this.cells.length - this.mineCount
    this.status = 'ready'

    if (cellBitmask?.length) {
      this.applyBitmask(cellBitmask)
      this.timer.startAt = Date.now()
      this.status = 'playing'
    }
  }

  // Restart the game but keep the original mine positions
  restart() {
    this.cells.forEach(c => (c.status = 'covered'))
    this.flagIndices.clear()
    this.timer = { elapsed: 0 }
    this.remainingToRevealCount = this.cells.length - this.mineCount
    this.status = 'ready'
  }

  dump(): GameProps {
    return {
      w: this.rectGrid.w,
      h: this.rectGrid.h,
      m: this.mineCount,
      elapsedTime: this.getElapsedTime(),
      cellBitmask: this.getBitmask(),
    }
  }

  operate(index: number, op: Operation) {
    if (this.status === 'won' || this.status === 'lost') return

    const cell = this.cells[index]
    if (this.status === 'ready') {
      if (this.mineIndices.length === 0) {
        this.placeMines(cell)
      }
      this.timer.startAt = Date.now()
      this.status = 'playing'
    }

    switch (op) {
      case 'reveal':
        this.reveal(cell)
        break
      case 'chord-reveal':
        this.revealChord(cell)
        break
      case 'toggle-flag':
        this.toggleFlag(cell)
        break
    }
  }

  createGridCells() {
    return create2DArray(
      this.rectGrid.h,
      this.rectGrid.w,
      p => this.cells[this.rectGrid.posToIndex(p)],
    )
  }

  getElapsedTime() {
    let { elapsed, startAt } = this.timer
    if (startAt) {
      elapsed += Date.now() - startAt
    }
    return elapsed
  }

  getAdjacentCells(index: number) {
    const cell = this.cells[index]
    const cache = this.adjacentCellsCache.get(cell)
    if (cache) return cache

    const adjacent = this.rectGrid
      .getNeighbors(index, true)
      .map(i => this.cells[i])
    this.adjacentCellsCache.set(cell, adjacent)
    return adjacent
  }

  revealAll() {
    if (this.status === 'won') {
      this.cells.forEach(c => {
        if (c.mine) {
          c.status = 'flagged'
          this.flagIndices.add(c.index)
        } else {
          c.status = 'revealed'
          this.ensureAdjacentMineCount(c)
        }
      })
      return
    }

    if (this.status === 'lost') {
      this.mineIndices.forEach(index => {
        const c = this.cells[index]
        if (c.status === 'covered') {
          c.status = 'revealed'
        }
      })
      this.flagIndices.forEach(index => {
        const c = this.cells[index]
        if (!c.mine) {
          c.status = 'misflagged'
        }
      })
      return
    }
  }

  private applyBitmask(cellBitmask: readonly number[]) {
    const revealed: Cell[] = []
    for (let i = 0; i < cellBitmask.length; i += 2) {
      const index = cellBitmask[i]
      const bitmask = cellBitmask[i + 1]
      const cell = this.cells[index]
      if (bitmask & CELL_FLAGS.reveal) {
        cell.status = 'revealed'
        this.remainingToRevealCount--
        revealed.push(cell)
      }
      if (bitmask & CELL_FLAGS.flag) {
        cell.status = 'flagged'
        this.flagIndices.add(index)
      }
      if (bitmask & CELL_FLAGS.mine) {
        cell.mine = true
        this.mineIndices.push(index)
      }
    }

    revealed.forEach(c => this.ensureAdjacentMineCount(c))
  }

  private getBitmask() {
    const result: number[] = []
    for (const c of this.cells) {
      const bitmask =
        (c.mine ? CELL_FLAGS.mine : 0) |
        (c.status === 'revealed' ? CELL_FLAGS.reveal : 0) |
        (c.status === 'flagged' ? CELL_FLAGS.flag : 0)
      if (bitmask > 0) {
        result.push(c.index, bitmask)
      }
    }
    return result
  }

  private ensureAdjacentMineCount(cell: Cell) {
    if (cell.adjacentMineCount === undefined) {
      cell.adjacentMineCount = this.getAdjacentCells(cell.index).reduce(
        (acc, c) => acc + (c.mine ? 1 : 0),
        0,
      )
    }
  }

  private getAdjacentMineCount(index: number) {
    const cell = this.cells[index]
    this.ensureAdjacentMineCount(cell)
    return cell.adjacentMineCount!
  }

  private placeMines(safeCell: Cell) {
    const excluded = new Set([
      safeCell,
      ...this.getAdjacentCells(safeCell.index),
    ])
    const available = this.cells.filter(c => !excluded.has(c))
    arrayShuffle(available, this.mineCount).forEach(c => {
      c.mine = true
      this.mineIndices.push(c.index)
    })
  }

  private reveal(cell: Cell) {
    if (cell.status !== 'covered') {
      return
    }

    if (cell.mine) {
      cell.status = 'exploded'
      this.gameEnd(false)
      return
    }

    cell.status = 'revealed'
    this.remainingToRevealCount--

    if (this.getAdjacentMineCount(cell.index) === 0) {
      this.floodReveal(cell)
    }

    if (this.remainingToRevealCount === 0) {
      this.gameEnd(true)
    }
  }

  private revealChord(cell: Cell) {
    if (cell.status !== 'revealed') return

    const adjacentCells = this.getAdjacentCells(cell.index)
    const flagCount = adjacentCells.reduce(
      (acc, c) => acc + (c.status === 'flagged' ? 1 : 0),
      0,
    )
    if (flagCount === 0 || flagCount !== this.getAdjacentMineCount(cell.index))
      return

    adjacentCells.forEach(c => this.reveal(c))
  }

  private toggleFlag(cell: Cell) {
    if (cell.status === 'covered') {
      cell.status = 'flagged'
      this.flagIndices.add(cell.index)
    } else if (cell.status === 'flagged') {
      cell.status = 'covered'
      this.flagIndices.delete(cell.index)
    }
  }

  private floodReveal(cell: Cell) {
    const stack = [cell.index]
    while (stack.length > 0) {
      const index = stack.pop()!
      this.getAdjacentCells(index).forEach(adjacent => {
        if (adjacent.status === 'covered' && !adjacent.mine) {
          adjacent.status = 'revealed'
          this.remainingToRevealCount--
          if (this.getAdjacentMineCount(adjacent.index) === 0) {
            stack.push(adjacent.index)
          }
        }
      })
    }
  }

  private gameEnd(won: boolean) {
    this.status = won ? 'won' : 'lost'
    this.timer = { elapsed: this.getElapsedTime() }
    this.revealAll()
  }
}

export function createModel(props: GameProps = { w: 9, h: 9, m: 10 }) {
  const m = new Minesweeper()
  m.restore(props)
  return m
}
