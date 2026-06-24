import {
  arrayShuffle,
  create2DArray,
  randomWeighted,
  type Direction,
} from '@/lib/utils'

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
  undoStackCapacity: number
  initialState?: Partial<GameState>
}

type LineTraversal = {
  key: 'x' | 'y'
  isReverse: boolean
  getTiles: (index: number) => (TileState | null)[]
}

export const defaultProps: Readonly<GameProps> = {
  boardSize: 4,
  spawnAtStart: 2,
  spawnPerMove: 1,
  spawnValueWeights: [
    { value: 2, weight: 90 },
    { value: 4, weight: 10 },
  ],
  undoStackCapacity: 2,
}

let _id = 0

const haveSameLayout = (a: TileState[], b: TileState[]) => {
  return (
    a.length === b.length &&
    a.every((t, index) => t.x === b[index].x && t.y === b[index].y)
  )
}

export class Game2048Model {
  props: Readonly<GameProps> = { ...defaultProps }
  state: GameState = { score: 0, steps: 0, tiles: [] }

  private gameOver = false
  private tileGrid: Array<TileState | null>[] = []
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

  init({ initialState, ...props }: GameProps) {
    this.props = props
    this.state = { score: 0, steps: 0, tiles: [], ...initialState }

    this.gameOver = false
    this.tileGrid = create2DArray(props.boardSize, props.boardSize, null)
    this.undoStack = []
    this.undoIndex = 0
    this.undoStackSize = 0

    if (this.state.tiles.length === 0) {
      this.spawnTiles(props.spawnAtStart)
    } else {
      this.state.tiles.forEach(t => {
        t.id = _id++
        this.tileGrid[t.y][t.x] = t
      })
    }
  }

  move(direction: Direction) {
    if (this.gameOver) return false

    const snapshot = this.dumpState()
    this.processLine(this.lineTraversal[direction])
    if (haveSameLayout(snapshot.tiles, this.state.tiles)) {
      return false
    }

    this.state.steps++
    this.pushUndoStack(snapshot)
    this.rebuildTileGrid()
    this.spawnTiles(this.props.spawnPerMove)

    return true
  }

  undo() {
    const snapshot = this.popUndoStack()
    if (snapshot) {
      this.state = snapshot
      this.gameOver = false
      this.rebuildTileGrid()
    }
  }

  dump() {
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

  findEmptyGrid() {
    const empty = [] as { x: number; y: number }[]
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

  private spawnTiles(count: number) {
    if (count <= 0) return

    const empty = this.findEmptyGrid()
    if (empty.length < count) {
      this.gameOver = true
      return
    }

    arrayShuffle(empty, count).forEach(pos => {
      const { value } = randomWeighted(this.props.spawnValueWeights)
      const t = { id: _id++, value, ...pos }
      this.state.tiles.push(t)
      this.tileGrid[t.y][t.x] = t
    })

    if (empty.length === count && !this.hasMerge()) {
      this.gameOver = true
    }
  }

  private dumpState(omitTileId = false) {
    return {
      score: this.state.score,
      steps: this.state.steps,
      tiles: omitTileId
        ? this.state.tiles.map(({ id: _, ...t }) => t)
        : this.state.tiles.map(({ ...t }) => t),
    }
  }

  private rebuildTileGrid() {
    this.tileGrid.forEach(row => row.fill(null))
    this.state.tiles.forEach(t => (this.tileGrid[t.y][t.x] = t))
  }

  private stepUndoIndex(delta: 1 | -1) {
    const cap = this.props.undoStackCapacity
    this.undoIndex = (this.undoIndex + delta + cap) % cap
  }

  private pushUndoStack(state: GameState) {
    if (this.props.undoStackCapacity <= 0) {
      return
    }
    this.undoStack[this.undoIndex] = state
    this.stepUndoIndex(1)
    this.undoStackSize = Math.min(
      this.undoStackSize + 1,
      this.props.undoStackCapacity,
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

  private processLine({ key, isReverse, getTiles }: LineTraversal) {
    const size = this.props.boardSize
    let score = this.state.score

    for (let i = 0; i < size; i++) {
      let tiles = getTiles(i).filter(t => t !== null)
      if (tiles.length === 0) continue

      if (isReverse) tiles.reverse()

      const result = this.mergeTiles(tiles)
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

  private mergeTiles(tiles: TileState[]) {
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
}

export function createModel(props: GameProps = defaultProps) {
  const m = new Game2048Model()
  m.init(props)
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
