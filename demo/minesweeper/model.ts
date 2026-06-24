import { arrayShuffle, RectGrid } from '@/lib/utils'

export type Operation = 'reveal' | 'chord-reveal' | 'toggle-flag'
export type GameState = 'ready' | 'playing' | 'won' | 'lost'
export type CellState =
  | 'covered'
  | 'revealed'
  | 'flagged'
  | 'exploded'
  | 'misflagged'

export interface Cell {
  readonly index: number
  mine: boolean
  type: CellState
  adjacentMineCount?: number
}

export interface BoardConfig {
  w: number
  h: number
  m: number /** number of mines */
}

export interface GameProps extends BoardConfig {
  elapsedTime?: number /** milliseconds */
  cellBitmask?: readonly [number /**cell index */, number /**bitmask */][]
}

const CELL_FLAGS = {
  reveal: 1 << 0, // 0b001
  flag: 1 << 1, // 0b010
  mine: 1 << 2, // 0b100
} as const

export class MinesweeperModel {
  state: GameState = 'ready'
  timer: { elapsedTime: number; startAt?: number } = { elapsedTime: 0 }
  cells: Cell[] = []
  flagIndices: Set<number> = new Set()
  mineIndices: number[] = []
  grid = new RectGrid()

  private board: BoardConfig = { w: 1, h: 1, m: 0 }
  private adjacentCellsCache: WeakMap<Cell, Cell[]> = new WeakMap()
  private remainingToRevealCount = 0

  get boardConfig(): Readonly<BoardConfig> {
    return this.board
  }

  restore(props: GameProps) {
    const { elapsedTime = 0, cellBitmask, ...board } = props
    this.validateBoardConfig(board)

    const totalCells = board.w * board.h
    const needsReset =
      board.w !== this.board.w ||
      board.h !== this.board.h ||
      this.cells.length !== totalCells

    if (needsReset) {
      this.adjacentCellsCache = new WeakMap()
      this.cells = Array.from({ length: totalCells }, (_, index) => ({
        index,
        mine: false,
        type: 'covered',
      }))
    } else {
      this.cells.forEach(c => {
        c.mine = false
        c.type = 'covered'
        c.adjacentMineCount = undefined
      })
    }

    const rect = { w: board.w, h: board.h }
    this.grid.apply(rect)
    this.board = { ...rect, m: board.m }
    this.state = 'ready'
    this.timer = { elapsedTime }
    this.flagIndices.clear()
    this.mineIndices = []
    this.remainingToRevealCount = totalCells - board.m

    if (cellBitmask?.length) {
      this.applyBitmask(cellBitmask)
      this.timer.startAt = Date.now()
      this.state = 'playing'
    }
  }

  /**
   * keep the original mine positions and restart the game
   */
  restart() {
    this.cells.forEach(c => (c.type = 'covered'))
    this.flagIndices.clear()
    this.timer = { elapsedTime: 0 }
    this.remainingToRevealCount = this.cells.length - this.board.m
    this.state = 'ready'
  }

  dump() {
    return {
      ...this.board,
      elapsedTime: this.getElapsedTime(),
      cellBitmask: this.getBitmask(),
    }
  }

  operate(index: number, op: Operation) {
    if (this.isGameOver()) {
      return false
    }

    const cell = this.cells[index]
    if (this.state === 'ready') {
      if (this.mineIndices.length === 0) {
        this.placeMines(cell)
      }
      this.timer.startAt = Date.now()
      this.state = 'playing'
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
    return true
  }

  isGameOver() {
    return this.state === 'won' || this.state === 'lost'
  }

  getBitmask() {
    return this.cells.flatMap(c => {
      const bitmask =
        (c.mine ? CELL_FLAGS.mine : 0) |
        (c.type === 'revealed' ? CELL_FLAGS.reveal : 0) |
        (c.type === 'flagged' ? CELL_FLAGS.flag : 0)
      return bitmask > 0 ? [[c.index, bitmask] as [number, number]] : []
    })
  }

  getElapsedTime() {
    let { elapsedTime, startAt } = this.timer
    if (startAt) {
      elapsedTime += Date.now() - startAt
    }
    return elapsedTime
  }

  getAdjacentCells(index: number) {
    const cell = this.cells[index]
    const cache = this.adjacentCellsCache.get(cell)
    if (cache) {
      return cache
    }

    const adjacentCells = this.grid
      .getAdjacentIndices(index)
      .map(i => this.cells[i])

    this.adjacentCellsCache.set(cell, adjacentCells)
    return adjacentCells
  }

  revealAll() {
    if (this.state === 'won') {
      this.cells.forEach(c => {
        if (c.mine) {
          c.type = 'flagged'
          this.flagIndices.add(c.index)
        } else {
          c.type = 'revealed'
          this.ensureAdjacentMineCount(c)
        }
      })
      return
    }

    if (this.state === 'lost') {
      this.mineIndices.forEach(index => {
        const c = this.cells[index]
        if (c.type === 'covered') {
          c.type = 'revealed'
        }
      })
      this.flagIndices.forEach(index => {
        const c = this.cells[index]
        if (!c.mine) {
          c.type = 'misflagged'
        }
      })
      return
    }
  }

  private validateBoardConfig({ w, h, m }: BoardConfig) {
    if (w <= 0 || h <= 0 || m < 0 || m >= w * h - 1) {
      throw new RangeError(`invalid board config: ${w}x${h} with ${m} mines`)
    }
  }

  private applyBitmask(cellBitmask: readonly [number, number][]) {
    const revealed: Cell[] = []
    cellBitmask.forEach(([index, bitmask]) => {
      const cell = this.cells[index]
      if (bitmask & CELL_FLAGS.reveal) {
        cell.type = 'revealed'
        this.remainingToRevealCount--
        revealed.push(cell)
      }
      if (bitmask & CELL_FLAGS.flag) {
        cell.type = 'flagged'
        this.flagIndices.add(index)
      }
      if (bitmask & CELL_FLAGS.mine) {
        cell.mine = true
        this.mineIndices.push(index)
      }
    })

    revealed.forEach(c => this.ensureAdjacentMineCount(c))
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
    arrayShuffle(available, this.board.m).forEach(c => {
      c.mine = true
      this.mineIndices.push(c.index)
    })
  }

  private reveal(cell: Cell) {
    if (cell.type !== 'covered') {
      return
    }

    if (cell.mine) {
      cell.type = 'exploded'
      this.gameEnd(false)
      return
    }

    cell.type = 'revealed'
    this.remainingToRevealCount--
    
    if (this.getAdjacentMineCount(cell.index) === 0) {
      this.floodReveal(cell)
    }

    if (this.remainingToRevealCount === 0) {
      this.gameEnd(true)
    }
  }

  private revealChord(cell: Cell) {
    if (cell.type !== 'revealed') {
      return
    }

    const adjacentCells = this.getAdjacentCells(cell.index)
    const adjacentFlagCount = adjacentCells.reduce(
      (acc, c) => acc + (c.type === 'flagged' ? 1 : 0),
      0,
    )
    if (
      adjacentFlagCount === 0 ||
      adjacentFlagCount !== this.getAdjacentMineCount(cell.index)
    ) {
      return
    }

    adjacentCells.forEach(c => this.reveal(c))
  }

  private toggleFlag(cell: Cell) {
    if (cell.type === 'covered') {
      cell.type = 'flagged'
      this.flagIndices.add(cell.index)
    } else if (cell.type === 'flagged') {
      cell.type = 'covered'
      this.flagIndices.delete(cell.index)
    }
  }

  private floodReveal(cell: Cell) {
    const stack = [cell.index]
    while (stack.length > 0) {
      const index = stack.pop()!
      this.getAdjacentCells(index).forEach(adjacent => {
        if (adjacent.type === 'covered' && !adjacent.mine) {
          adjacent.type = 'revealed'
          this.remainingToRevealCount--
          if (this.getAdjacentMineCount(adjacent.index) === 0) {
            stack.push(adjacent.index)
          }
        }
      })
    }
  }

  private gameEnd(won: boolean) {
    this.state = won ? 'won' : 'lost'
    this.timer = { elapsedTime: this.getElapsedTime() }
    this.revealAll()
  }
}

export function createModel(props: GameProps = { w: 9, h: 9, m: 10 }) {
  const m = new MinesweeperModel()
  m.restore(props)
  return m
}
