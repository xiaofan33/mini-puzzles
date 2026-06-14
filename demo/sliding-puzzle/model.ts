import { randomInt, type Direction, type Position } from '#/lib/utils'

interface Tile {
  readonly id: number
  readonly target: Position
  x: number
  y: number
}

interface GameProps {
  rows: number
  cols: number
  ids?: number[]
  steps?: number
}

// prettier-ignore
const directionOffsets: Record<Direction, Position> = {
  up   : { x: 0,  y: -1 },
  down : { x: 0,  y: 1 },
  left : { x: -1, y: 0 },
  right: { x: 1,  y: 0 },
} as const;

const offsets = Object.values(directionOffsets)

class SlidingPuzzleModel {
  props: GameProps = { rows: 3, cols: 3 }
  steps = 0
  tiles: Tile[] = []

  private blankPos = { x: 0, y: 0 }
  private isSolved = false

  restore(props: GameProps) {
    const { rows, cols, ids, steps = 0 } = props
    const needsInit =
      rows !== this.props.rows ||
      cols !== this.props.cols ||
      this.tiles.length === 0

    this.props = { rows, cols }
    this.steps = steps
    this.isSolved = false

    const length = rows * cols - 1
    if (needsInit) {
      this.tiles = Array.from({ length }, (_, index) => {
        const target = this.indexToPos(index)
        return {
          id: index + 1,
          target,
          x: target.x,
          y: target.y,
        }
      })
      this.blankPos = { x: cols - 1, y: rows - 1 }
    } else {
      this.tiles.forEach((tile, index) => {
        const target = this.indexToPos(index)
        tile.x = target.x
        tile.y = target.y
      })
      this.blankPos = { x: cols - 1, y: rows - 1 }
    }

    if (ids?.length) {
      if (!this.validateIds(ids)) {
        throw new RangeError(`Invalid ids: must be 0..${length} permutation`)
      }
      ids.forEach((id, index) => {
        const pos = this.indexToPos(index)
        if (id !== 0) {
          this.tiles[index] = {
            ...this.tiles[index],
            ...pos,
          }
        } else {
          this.blankPos = pos
        }
      })
    }
  }

  slide(arg: number | Position | Direction) {
    if (this.isSolved) {
      return false
    }

    if (typeof arg === 'string') {
      const dir = directionOffsets[arg]
      arg = { x: this.blankPos.x - dir.x, y: this.blankPos.y - dir.y }
    }

    const firstTile = this.findTile(arg)
    if (!firstTile) {
      return false
    }

    const path = this.findTileOnPath(firstTile)
    if (!path?.length) {
      return false
    }

    for (const tile of path) {
      this.swapWithBlank(tile)
      this.steps++
    }

    this.isSolved = this.tiles.every(
      t => t.x === t.target.x && t.y === t.target.y,
    )
    return true
  }

  shuffle(count?: number) {
    count ??= Math.floor(Math.pow(this.props.cols, this.props.rows) * 1.7)
    while (count > 0) {
      const moves = this.findValidMoves()
      const { x, y } = moves[randomInt(0, moves.length - 1)]
      const pos = { x: this.blankPos.x + x, y: this.blankPos.y + y }
      const tile = this.findTile(pos)
      if (tile) {
        this.swapWithBlank(tile)
        count--
      }
    }
  }

  findTile(idOrPos: number | Position) {
    return typeof idOrPos === 'number'
      ? this.tiles.find(t => t.id === idOrPos)
      : this.tiles.find(t => t.x === idOrPos.x && t.y === idOrPos.y)
  }

  indexToPos(index: number) {
    return {
      x: index % this.props.cols,
      y: Math.floor(index / this.props.cols),
    }
  }

  private findValidMoves() {
    return offsets.filter(({ x, y }) => {
      const nx = this.blankPos.x + x
      const ny = this.blankPos.y + y
      return nx >= 0 && nx < this.props.cols && ny >= 0 && ny < this.props.rows
    })
  }

  private findTileOnPath(firstTile: Tile) {
    const dx = firstTile.x - this.blankPos.x
    const dy = firstTile.y - this.blankPos.y

    if (dx !== 0 && dy !== 0) {
      return
    }

    const isHorizontal = dx !== 0
    const step = isHorizontal ? (dx > 0 ? 1 : -1) : dy > 0 ? 1 : -1
    const fixed = isHorizontal ? firstTile.y : firstTile.x
    const start = isHorizontal ? this.blankPos.x : this.blankPos.y
    const end = isHorizontal ? firstTile.x : firstTile.y

    const path: Tile[] = []
    for (let i = start + step; i !== end + step; i += step) {
      const pos = isHorizontal ? { x: i, y: fixed } : { x: fixed, y: i }
      path.push(this.findTile(pos)!)
    }
    return path
  }

  private swapWithBlank(tile: Tile) {
    const { x, y } = this.blankPos
    this.blankPos.x = tile.x
    this.blankPos.y = tile.y
    tile.x = x
    tile.y = y
  }

  private validateIds(ids: number[]) {
    const n = this.props.rows * this.props.cols
    if (ids.length !== n) {
      return false
    }

    const seen = new Set<number>()
    for (const id of ids) {
      if (id < 0 || id >= n || seen.has(id)) {
        return false
      }
      seen.add(id)
    }

    return true
  }
}

export function createModel(props: GameProps) {
  const m = new SlidingPuzzleModel()
  m.restore(props)
  return m
}
