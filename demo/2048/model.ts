import {
  arrayShuffle,
  create2DArray,
  randomWeighted,
  type Direction,
} from '#/lib/utils'

export interface TileState {
  id?: number
  value: number
  x: number
  y: number
}

export interface GameState {
  score: number
  steps: number
  tiles: TileState[]
}

export interface GameProps {
  boardSize: number
  spawnAtStart: number
  spawnPerMove: number
  spawnValueWeights: readonly { value: number; weight: number }[]
  undoStackCap: number
  initialState?: Partial<GameState>
}

export type TileLine = (TileState | null)[]
export type LineTraversal = {
  key: 'x' | 'y'
  isReverse: boolean
  getTiles: (index: number) => TileLine
}

export const defaultProps: Readonly<GameProps> = {
  boardSize: 4,
  spawnAtStart: 2,
  spawnPerMove: 1,
  spawnValueWeights: [
    { value: 2, weight: 90 },
    { value: 4, weight: 10 },
  ],
  undoStackCap: 2,
}

const nextId = (() => {
  let id = 0
  return () => id++
})()

const haveSamePositions = (a: readonly TileState[], b: readonly TileState[]) =>
  a.length === b.length && a.every((t, i) => t.x === b[i].x && t.y === b[i].y)

class Game2048Model {
  props: GameProps = { ...defaultProps }
  state: GameState = { score: 0, steps: 0, tiles: [] }

  private gameOver = false
  private tileGrid: TileLine[] = []
  private undoStack: GameState[] = []
  private undoIndex = 0
  private undoStackSize = 0

  // prettier-ignore
  private readonly lineTraversal: Record<Direction, LineTraversal> = {
    up   : { key: "y", isReverse: true,  getTiles: (x: number) => this.tileGrid.map((row) => row[x]) },
    down : { key: "y", isReverse: false, getTiles: (x: number) => this.tileGrid.map((row) => row[x]) },
    left : { key: "x", isReverse: true,  getTiles: (y: number) => this.tileGrid[y] },
    right: { key: "x", isReverse: false, getTiles: (y: number) => this.tileGrid[y] },
  }

  restore(props: GameProps) {
    const { initialState, ...rest } = props
    this.props = rest
    this.state = { score: 0, steps: 0, tiles: [], ...initialState }

    this.tileGrid = create2DArray(rest.boardSize, rest.boardSize, null)
    this.gameOver = false
    this.undoStack = []
    this.undoIndex = 0
    this.undoStackSize = 0

    if (this.state.tiles.length === 0) {
      this.spawnNewTiles(rest.spawnAtStart)
    } else {
      this.state.tiles.forEach(t => {
        t.id = nextId()
        this.tileGrid[t.y][t.x] = t
      })
    }
  }

  move(direction: Direction) {
    if (!this.isGameOver) {
      return false
    }

    const oldState = this.dumpState()
    this.processLine(this.lineTraversal[direction])
    if (haveSamePositions(oldState.tiles, this.state.tiles)) {
      return false
    }

    this.pushUndoStack(oldState)
    this.updateTileGrid()
    this.spawnNewTiles(this.props.spawnPerMove)
    this.state.steps++
    return true
  }

  undo() {
    if (!this.canUndo()) {
      return
    }

    this.state = this.popUndoStack()!
    this.gameOver = false
    this.updateTileGrid()
  }

  dumpState(omitTileId = false): GameState {
    return {
      ...this.state,
      tiles: omitTileId
        ? this.state.tiles.map(t => ({ value: t.value, x: t.x, y: t.y }))
        : this.state.tiles.map(t => ({ ...t })),
    }
  }

  dump(): GameProps {
    return {
      ...this.props,
      initialState: this.dumpState(true),
    }
  }

  isGameOver() {
    return this.gameOver
  }

  canUndo() {
    return this.undoStackSize > 0
  }

  hasMerge() {
    const size = this.props.boardSize
    const grid = this.tileGrid
    for (let y = 0; y < size; y++) {
      for (let x = 0; x < size; x++) {
        const value = grid[y][x]?.value
        if (x + 1 < size && value === grid[y][x + 1]?.value) {
          return true
        }
        if (y + 1 < size && value === grid[y + 1][x]?.value) {
          return true
        }
      }
    }
    return false
  }

  getEmptyCells() {
    const empty: { x: number; y: number }[] = []
    const size = this.props.boardSize
    for (let y = 0; y < size; y++) {
      for (let x = 0; x < size; x++) {
        if (this.tileGrid[y][x] === null) {
          empty.push({ x, y })
        }
      }
    }
    return empty
  }

  private spawnNewTiles(count: number) {
    if (count <= 0) {
      return
    }

    const empty = this.getEmptyCells()
    if (empty.length < count) {
      this.gameOver = true
      return
    }

    arrayShuffle(empty, count).forEach(({ x, y }) => {
      const { value } = randomWeighted(this.props.spawnValueWeights)
      const tile: TileState = { id: nextId(), value, x, y }
      this.state.tiles.push(tile)
      this.tileGrid[y][x] = tile
    })

    if (empty.length === count && !this.hasMerge()) {
      this.gameOver = true
    }
  }

  private updateTileGrid() {
    this.tileGrid.forEach(line => line.fill(null))
    this.state.tiles.forEach(t => (this.tileGrid[t.y][t.x] = t))
  }

  private processLine({ key, isReverse, getTiles }: LineTraversal) {
    const size = this.props.boardSize
    let score = this.state.score
    for (let i = 0; i < size; i++) {
      let tiles = getTiles(i).filter(t => t !== null)
      if (tiles.length === 0) {
        continue
      }

      if (isReverse) {
        tiles.reverse()
      }

      const result = this.mergeLine(tiles)
      let offset = size - result.tiles.length
      if (isReverse) {
        result.tiles.reverse()
        offset = 0
      }

      result.tiles.forEach((t, index) => (t[key] = offset + index))
      score += result.score
    }

    this.state.score = score
    this.state.tiles = this.state.tiles.filter(t => t.value !== 0)
  }

  private mergeLine(tiles: TileState[]) {
    let score = 0
    for (let i = tiles.length - 1; i > 0; i--) {
      const curr = tiles[i]
      const prev = tiles[i - 1]
      if (curr.value === prev.value) {
        prev.value *= 2
        curr.value = 0
        score += prev.value
        i--
      }
    }

    return {
      tiles: tiles.filter(t => t.value !== 0),
      score,
    }
  }

  private stepUndoIndex(delta: 1 | -1) {
    const cap = this.props.undoStackCap
    this.undoIndex = (this.undoIndex + delta + cap) % cap
  }

  private pushUndoStack(state: GameState) {
    if (this.props.undoStackCap <= 0) {
      return
    }

    this.undoStack[this.undoIndex] = state
    this.stepUndoIndex(1)
    this.undoStackSize = Math.min(
      this.undoStackSize + 1,
      this.props.undoStackCap,
    )
  }

  private popUndoStack() {
    if (this.undoStackSize <= 0) {
      return
    }

    this.stepUndoIndex(-1)
    this.undoStackSize--
    return this.undoStack[this.undoIndex]
  }
}

export function createModel(props: GameProps) {
  const m = new Game2048Model()
  m.restore(props)
  return m
}

export function tilesToGrid(tiles: TileState[], size: number) {
  const grid = create2DArray(size, size, 0)
  tiles.forEach(t => (grid[t.y][t.x] = t.value))
  return grid
}

export function gridToTiles(grid: number[][]) {
  const tiles: TileState[] = []
  const size = grid.length
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const value = grid[y][x]
      if (value !== 0) {
        tiles.push({ x, y, value })
      }
    }
  }
  return tiles
}
