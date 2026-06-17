import { create2DArray, type Direction, type Position } from '#/lib/utils'

export type PieceType = 'CaoCao' | 'GuanYu' | 'General' | 'Pawn'

export interface PieceBase {
  type: PieceType
  name: string
  /** 宽度 - 占据多少列 */
  w: number
  /** 高度 - 占据多少行 */
  h: number
  x: number
  y: number
}

export interface Piece extends PieceBase {
  readonly id: number
}

export interface GameProps {
  pieces: PieceBase[]
  steps?: number
}

const defaultBoard = {
  rows: 5,
  cols: 4,
  exit: { x: 1, y: 3 },
}

// prettier-ignore
const directionOffsets: Record<Direction, Position> = {
  up   : { x: 0,  y: -1 },
  down : { x: 0,  y: 1 },
  left : { x: -1, y: 0 },
  right: { x: 1,  y: 0 },
} as const;

class HuaRongPassModel {
  readonly board = { ...defaultBoard }
  pieces: Piece[] = []
  steps = 0

  private grid: (number | null)[][] = []
  private win = false

  restore(props: GameProps) {
    const { pieces, steps = 0 } = props
    this.pieces = pieces.map((p, id) => ({ ...p, id }))
    this.steps = steps
    this.win = this.isCaoCaoAtExit()
    this.createGrid()
  }

  move(piece: Piece, direction: Direction) {
    if (this.win) {
      return false
    }

    const offset = directionOffsets[direction]
    const newX = piece.x + offset.x
    const newY = piece.y + offset.y

    if (!this.canPlace(piece, newX, newY)) {
      return false
    }

    this.removeFromGrid(piece)
    piece.x = newX
    piece.y = newY
    this.placeOnGrid(piece)
    this.steps++

    if (this.isCaoCaoAtExit()) {
      this.win = true
    }

    return true
  }

  dump(): GameProps {
    return {
      pieces: this.pieces.map(({ id, ...rest }) => ({ ...rest })),
      steps: this.steps,
    }
  }

  isWin() {
    return this.win
  }

  findPieceById(id: number) {
    return this.pieces.find(piece => piece.id === id)
  }

  canPlace(piece: Piece, toX: number, toY: number) {
    const { w, h } = piece
    const { rows, cols } = this.board
    if (toX < 0 || toX + w > cols || toY < 0 || toY + h > rows) {
      return false
    }

    for (let dy = 0; dy < h; dy++) {
      for (let dx = 0; dx < w; dx++) {
        const id = this.grid[toY + dy][toX + dx]
        if (id !== null && id !== piece.id) {
          return false
        }
      }
    }

    return true
  }

  getValidMoves(piece: Piece) {
    const moves: Direction[] = []

    for (const dir of Object.keys(directionOffsets) as Direction[]) {
      const offset = directionOffsets[dir]
      if (this.canPlace(piece, piece.x + offset.x, piece.y + offset.y)) {
        moves.push(dir)
      }
    }

    return moves
  }

  private isCaoCaoAtExit() {
    const king = this.pieces.find(p => p.type === 'CaoCao')
    const { x, y } = this.board.exit
    return king?.x === x && king?.y === y
  }

  private placeOnGrid(piece: Piece) {
    for (let y = piece.y; y < piece.y + piece.h; y++) {
      for (let x = piece.x; x < piece.x + piece.w; x++) {
        this.grid[y][x] = piece.id
      }
    }
  }

  private removeFromGrid(piece: Piece) {
    for (let y = piece.y; y < piece.y + piece.h; y++) {
      for (let x = piece.x; x < piece.x + piece.w; x++) {
        this.grid[y][x] = null
      }
    }
  }

  private createGrid() {
    this.grid = create2DArray(this.board.rows, this.board.cols, null)
    this.pieces.forEach(p => this.placeOnGrid(p))
  }
}

export function createModel(props: GameProps) {
  const model = new HuaRongPassModel()
  model.restore(props)
  return model
}

export function getPieceSize(type: PieceType) {
  switch (type) {
    case 'CaoCao':
      return { w: 2, h: 2 }
    case 'GuanYu':
      return { w: 2, h: 1 }
    case 'General':
      return { w: 1, h: 2 }
    case 'Pawn':
      return { w: 1, h: 1 }
    default:
      throw new Error(`Unknown piece type: ${type}`)
  }
}
