import { arrayShuffle } from '#/lib/utils'

export type GameState = 'ready' | 'playing' | 'won' | 'lost'
export type Operation = 'reveal' | 'toggle-flag' | 'chord-reveal'
export type CellState =
  | 'covered'
  | 'flagged'
  | 'revealed'
  | 'exploded'
  | 'mis-flagged'

export interface Cell {
  readonly index: number
  mine: boolean
  state: CellState
  adjacentMineCount?: number
}

export interface GameProps {
  rows: number
  cols: number
  mineCount: number
  elapsedTime?: number
  cellBitmask?: readonly [number /**index */, number /**bitmask */][]
}

export const defaultProps: Readonly<GameProps> = {
  rows: 9,
  cols: 9,
  mineCount: 10,
}

// prettier-ignore
const adjacentOffsets = [
  [-1, -1], [0, -1], [1, -1],
  [-1,  0],          [1,  0],
  [-1,  1], [0,  1], [1,  1],
] as const

const bitFlags = {
  reveal: 0x1,
  mine: 0x2,
  flag: 0x4,
} as const

class MinesweeperModel {
  props: GameProps = { ...defaultProps }
  state: GameState = 'ready'
  timer: { elapsedTime: number; startAt?: number } = { elapsedTime: 0 }
  cells: Cell[] = []
  mineIndices: number[] = []
  flagIndices: Set<number> = new Set()
  private adjacentCellsCache: WeakMap<Cell, Cell[]> = new WeakMap()
  private remainingToReveal = 0

  restore(props: GameProps) {
    const { elapsedTime = 0, cellBitmask, ...rest } = props
    const totalCells = rest.rows * rest.cols
    const needsInit =
      rest.rows !== this.props.rows ||
      rest.cols !== this.props.cols ||
      this.cells.length === 0

    if (needsInit) {
      this.adjacentCellsCache = new WeakMap()
      this.cells = Array.from({ length: totalCells }, (_, i) => ({
        index: i,
        mine: false,
        state: 'covered',
      }))
    } else {
      this.cells.forEach(c => {
        Object.assign(c, {
          mine: false,
          state: 'covered',
          adjacentMineCount: undefined,
        })
      })
    }

    this.props = rest
    this.timer = { elapsedTime }
    this.state = 'ready'
    this.mineIndices = []
    this.flagIndices.clear()
    this.remainingToReveal = totalCells - rest.mineCount

    if (cellBitmask?.length) {
      this.applyCellBitmask(cellBitmask)
      this.timer.startAt = Date.now()
      this.state = 'playing'
    }
  }

  /**
   * restart game with the original mine positions
   */
  restart() {
    if (this.state === 'ready') {
      return
    }

    this.cells.forEach(c => (c.state = 'covered'))
    this.flagIndices.clear()
    this.remainingToReveal = this.cells.length - this.props.mineCount
    this.timer = { elapsedTime: 0, startAt: Date.now() }
    this.state = 'playing'
  }

  dumpCellBitmask() {
    return this.cells.flatMap(c => {
      const bitmask =
        (c.mine ? bitFlags.mine : 0) |
        (c.state === 'revealed' ? bitFlags.reveal : 0) |
        (c.state === 'flagged' ? bitFlags.flag : 0)
      return bitmask > 0 ? [[c.index, bitmask] as [number, number]] : []
    })
  }

  dump(): GameProps {
    let { elapsedTime, startAt } = this.timer
    if (startAt) {
      elapsedTime += Date.now() - startAt
    }

    return {
      ...this.props,
      elapsedTime,
      cellBitmask: this.dumpCellBitmask(),
    }
  }

  operate(cell: Cell, op: Operation) {
    if (this.state === 'won' || this.state === 'lost') {
      return
    }

    if (this.state === 'ready') {
      this.placeMines(cell)
      this.timer.startAt = Date.now()
      this.state = 'playing'
    }

    if (op === 'chord-reveal') {
      this.chordReveal(cell)
      return
    }

    if (op === 'toggle-flag') {
      this.toggleFlag(cell)
      return
    }

    if (op === 'reveal') {
      this.reveal(cell)
      return
    }
  }

  posToIndex(pos: { x: number; y: number }) {
    return pos.y * this.props.cols + pos.x
  }

  indexToPos(index: number) {
    return {
      x: index % this.props.cols,
      y: Math.floor(index / this.props.cols),
    }
  }

  getAdjacentCells(cell: Cell): Cell[] {
    const cache = this.adjacentCellsCache.get(cell)
    if (cache) {
      return cache
    }

    const { x, y } = this.indexToPos(cell.index)
    const adjacentCells = adjacentOffsets.flatMap(([dx, dy]) => {
      const pos = { x: x + dx, y: y + dy }
      if (
        pos.x >= 0 &&
        pos.x < this.props.cols &&
        pos.y >= 0 &&
        pos.y < this.props.rows
      ) {
        return [this.cells[this.posToIndex(pos)]]
      }
      return []
    })

    this.adjacentCellsCache.set(cell, adjacentCells)
    return adjacentCells
  }

  private placeMines(safeCell: Cell) {
    // make sure the first opened cell is never a mine and will trigger auto open
    const excluded = [safeCell, ...this.getAdjacentCells(safeCell)]
    const candidates = this.cells.filter(c => !excluded.includes(c))
    if (candidates.length < this.props.mineCount) {
      throw new RangeError(
        `mineCount(${this.props.mineCount}) exceeds available cells(${candidates.length})`,
      )
    }
    arrayShuffle(candidates, this.props.mineCount).forEach(c => {
      c.mine = true
      this.mineIndices.push(c.index)
    })
  }

  private countAdjacentMines(cell: Cell) {
    if (cell.adjacentMineCount === undefined) {
      cell.adjacentMineCount = this.getAdjacentCells(cell).reduce(
        (sum, curr) => (curr.mine ? sum + 1 : sum),
        0,
      )
    }

    return cell.adjacentMineCount
  }

  private reveal(cell: Cell) {
    if (cell.state === 'revealed') {
      return
    }

    if (cell.mine) {
      cell.state = 'exploded'
      this.state = 'lost'
      this.revealGameResult()
      return
    }

    cell.state = 'revealed'
    this.remainingToReveal--
    this.floodReveal(cell)

    if (this.remainingToReveal === 0) {
      this.state = 'won'
      this.revealGameResult()
    }
  }

  private toggleFlag(cell: Cell) {
    if (cell.state === 'covered') {
      cell.state = 'flagged'
      this.flagIndices.add(cell.index)
    } else if (cell.state === 'flagged') {
      cell.state = 'covered'
      this.flagIndices.delete(cell.index)
    }
  }

  private chordReveal(cell: Cell) {
    if (cell.state !== 'revealed') {
      return
    }

    const adjacentCells = this.getAdjacentCells(cell)
    const flagCount = adjacentCells.reduce(
      (sum, curr) => (curr.state === 'flagged' ? sum + 1 : sum),
      0,
    )
    if (flagCount === 0 || flagCount !== this.countAdjacentMines(cell)) {
      return
    }

    for (const c of adjacentCells) {
      if (this.state !== 'playing') {
        break
      }
      this.reveal(c)
    }
  }

  private floodReveal(cell: Cell) {
    if (this.countAdjacentMines(cell) !== 0) {
      return
    }

    const visited = new Set<Cell>()
    const stack = [cell]

    while (stack.length > 0) {
      const curr = stack.pop()!
      if (visited.has(curr)) {
        continue
      }
      visited.add(curr)
      this.getAdjacentCells(curr).forEach(c => {
        if (c.state !== 'covered') {
          return
        }
        c.state = 'revealed'
        this.remainingToReveal--
        if (this.countAdjacentMines(c) === 0) {
          stack.push(c)
        }
      })
    }
  }

  private applyCellBitmask(cellBitmask: readonly [number, number][]) {
    const revealed: Cell[] = []

    cellBitmask.forEach(([index, bitmask]) => {
      const cell = this.cells[index]
      if (bitmask & bitFlags.reveal) {
        cell.state = 'revealed'
        revealed.push(cell)
        this.remainingToReveal--
      }
      if (bitmask & bitFlags.flag) {
        cell.state = 'flagged'
        this.flagIndices.add(index)
      }
      if (bitmask & bitFlags.mine) {
        cell.mine = true
        this.mineIndices.push(index)
      }
    })

    revealed.forEach(c => this.countAdjacentMines(c))
  }

  private revealGameResult() {
    if (this.state === 'won') {
      this.cells.forEach(c => {
        if (c.mine) {
          c.state = 'flagged'
          this.flagIndices.add(c.index)
        } else {
          c.state = 'revealed'
          this.countAdjacentMines(c)
        }
      })
    } else if (this.state === 'lost') {
      this.flagIndices.forEach(index => {
        const cell = this.cells[index]
        if (!cell.mine) {
          cell.state = 'mis-flagged'
        }
      })
    }
  }
}

export function createModel(props: GameProps = defaultProps) {
  const m = new MinesweeperModel()
  m.restore(props)
  return m
}
