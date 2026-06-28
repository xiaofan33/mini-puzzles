import { describe, expect, it } from 'vitest'
import {
  createModel,
  tilesToGrid,
  gridToTiles,
  defaultProps,
  type GameProps,
} from './model'

function createTestModel(grid: number[][], props?: Partial<GameProps>) {
  return createModel({
    ...defaultProps,
    ...props,
    boardSize: grid.length,
    spawnPerMove: props?.spawnPerMove ?? 0,
    initialState: {
      tiles: gridToTiles(grid),
    },
  })
}

describe('Game2048Model - Utility Functions', () => {
  it('should convert grid to tiles correctly', () => {
    const grid = [
      [2, 0, 0, 0],
      [0, 4, 0, 0],
      [0, 0, 8, 0],
      [0, 0, 0, 16],
    ]

    const tiles = gridToTiles(grid)
    expect(tiles).toHaveLength(4)
    expect(tiles).toContainEqual({ value: 2, x: 0, y: 0 })
    expect(tiles).toContainEqual({ value: 4, x: 1, y: 1 })
    expect(tiles).toContainEqual({ value: 8, x: 2, y: 2 })
    expect(tiles).toContainEqual({ value: 16, x: 3, y: 3 })
  })

  it('should convert tiles to grid correctly', () => {
    const tiles = [
      { value: 2, x: 0, y: 0 },
      { value: 4, x: 1, y: 1 },
      { value: 8, x: 2, y: 2 },
      { value: 16, x: 3, y: 3 },
    ]

    const grid = tilesToGrid(tiles, 4)
    expect(grid).toEqual([
      [2, 0, 0, 0],
      [0, 4, 0, 0],
      [0, 0, 8, 0],
      [0, 0, 0, 16],
    ])
  })
})

describe('Game2048Model - Movement', () => {
  const initialGrid = [
    [2, 0, 2, 0],
    [2, 2, 4, 4],
    [2, 2, 4, 8],
    [2, 2, 2, 0],
  ]

  const movementTests = [
    {
      direction: 'right' as const,
      expected: [
        [0, 0, 0, 4],
        [0, 0, 4, 8],
        [0, 4, 4, 8],
        [0, 0, 2, 4],
      ],
    },
    {
      direction: 'down' as const,
      expected: [
        [0, 0, 0, 0],
        [0, 0, 2, 0],
        [4, 2, 8, 4],
        [4, 4, 2, 8],
      ],
    },
    {
      direction: 'left' as const,
      expected: [
        [4, 0, 0, 0],
        [4, 8, 0, 0],
        [4, 4, 8, 0],
        [4, 2, 0, 0],
      ],
    },
    {
      direction: 'up' as const,
      expected: [
        [4, 4, 2, 4],
        [4, 2, 8, 8],
        [0, 0, 2, 0],
        [0, 0, 0, 0],
      ],
    },
  ]

  it.each(movementTests)(
    'should move tiles $direction correctly',
    ({ direction, expected }) => {
      const model = createTestModel(initialGrid)
      model.move(direction)
      expect(tilesToGrid(model.state.tiles, 4)).toEqual(expected)
    },
  )
})

describe('Game2048Model - Scoring', () => {
  it('should calculate score correctly after merging tiles', () => {
    const grid = [
      [2, 0, 2, 0],
      [2, 2, 4, 4],
      [2, 2, 4, 8],
      [2, 2, 2, 0],
    ]

    const model = createTestModel(grid)
    const initialScore = model.state.score
    model.move('right')

    // Expected merges: 2+2=4, 2+2=4, 4+4=8, 2+2=4, 2+2=4
    const expectedScoreIncrease = 4 + 4 + 8 + 4 + 4
    expect(model.state.score).toBe(initialScore + expectedScoreIncrease)
  })

  it('should not increase score when no tiles merge', () => {
    const grid = [
      [2, 4, 8, 16],
      [0, 0, 0, 0],
      [0, 0, 0, 0],
      [0, 0, 0, 0],
    ]

    const model = createTestModel(grid)
    const initialScore = model.state.score
    model.move('right')

    expect(model.state.score).toBe(initialScore)
  })
})

describe('Game2048Model - Game Over State', () => {
  it('should detect game over state correctly', () => {
    const grid = [
      [2, 4, 2, 4],
      [4, 2, 4, 2],
      [2, 4, 2, 4],
      [4, 2, 4, 2],
    ]

    const model = createTestModel(grid)
    // Game over is not set immediately on init
    expect(model.isGameOver()).toBe(false)
    expect(model.hasMerge()).toBe(false)
  })

  it('should not set gameOver when moves are still possible', () => {
    const grid = [
      [2, 4, 2, 4],
      [4, 2, 4, 2],
      [2, 4, 2, 8],
      [4, 2, 4, 8],
    ]

    const model = createTestModel(grid)
    model.move('right')
    expect(model.isGameOver()).toBe(false)
  })

  it('should set gameOver when no moves are possible', () => {
    const grid = [
      [8, 16, 8, 16],
      [16, 8, 16, 8],
      [32, 16, 8, 32],
      [16, 32, 16, 32],
    ]

    const model = createTestModel(grid, { spawnPerMove: 1 })
    model.move('up')
    expect(model.isGameOver()).toBe(true)
  })
})
