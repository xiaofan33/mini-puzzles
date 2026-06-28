import { describe, expect, it } from 'vitest'
import { RectGrid } from './rect'

describe('RectGrid', () => {
  describe('getNeighbors — number input, cardinal only', () => {
    // 3×3 grid:
    //   0 1 2
    //   3 4 5
    //   6 7 8
    const grid = new RectGrid({ w: 3, h: 3 })

    it('center cell returns 4 neighbors', () => {
      const result = grid.getNeighbors(4)
      expect(result).toEqual([1, 7, 3, 5])
    })

    it('top-left corner returns 2 neighbors', () => {
      const result = grid.getNeighbors(0)
      expect(result).toEqual([3, 1])
    })

    it('top-right corner returns 2 neighbors', () => {
      const result = grid.getNeighbors(2)
      expect(result).toEqual([5, 1])
    })

    it('bottom-left corner returns 2 neighbors', () => {
      const result = grid.getNeighbors(6)
      expect(result).toEqual([3, 7])
    })

    it('bottom-right corner returns 2 neighbors', () => {
      const result = grid.getNeighbors(8)
      expect(result).toEqual([5, 7])
    })

    it('top-edge cell returns 3 neighbors', () => {
      const result = grid.getNeighbors(1)
      expect(result).toEqual([4, 0, 2])
    })

    it('right-edge cell returns 3 neighbors', () => {
      const result = grid.getNeighbors(5)
      expect(result).toEqual([2, 8, 4])
    })
  })

  describe('getNeighbors — number input, with diagonals', () => {
    const grid = new RectGrid({ w: 3, h: 3 })

    it('center cell returns 8 neighbors', () => {
      const result = grid.getNeighbors(4, true)
      expect(result).toEqual([1, 7, 3, 5, 0, 6, 2, 8])
    })

    it('top-left corner returns 3 neighbors', () => {
      const result = grid.getNeighbors(0, true)
      expect(result).toEqual([3, 1, 4])
    })

    it('top-edge cell returns 5 neighbors', () => {
      const result = grid.getNeighbors(1, true)
      expect(result).toEqual([4, 0, 2, 3, 5])
    })
  })

  describe('getNeighbors — Position input', () => {
    const grid = new RectGrid({ w: 3, h: 3 })

    it('center returns 4 cardinal neighbors', () => {
      const result = grid.getNeighbors({ x: 1, y: 1 })
      expect(result).toEqual([
        { x: 1, y: 0 },
        { x: 1, y: 2 },
        { x: 0, y: 1 },
        { x: 2, y: 1 },
      ])
    })

    it('corner returns 2 cardinal neighbors', () => {
      const result = grid.getNeighbors({ x: 0, y: 0 })
      expect(result).toEqual([
        { x: 0, y: 1 },
        { x: 1, y: 0 },
      ])
    })

    it('center returns 8 diagonal neighbors', () => {
      const result = grid.getNeighbors({ x: 1, y: 1 }, true)
      expect(result).toEqual([
        { x: 1, y: 0 },
        { x: 1, y: 2 },
        { x: 0, y: 1 },
        { x: 2, y: 1 },
        { x: 0, y: 0 },
        { x: 0, y: 2 },
        { x: 2, y: 0 },
        { x: 2, y: 2 },
      ])
    })
  })

  describe('getNeighbors — number vs Position equivalence', () => {
    const sizes = [
      { w: 3, h: 3 },
      { w: 5, h: 4 },
      { w: 1, h: 5 },
      { w: 7, h: 1 },
    ]

    for (const size of sizes) {
      it(`${size.w}×${size.h}: both branches produce same neighbor set`, () => {
        const grid = new RectGrid(size)
        for (let i = 0; i < grid.total; i++) {
          const indexResult = grid.getNeighbors(i) as number[]
          const pos = grid.indexToPos(i)
          const posResult = grid.getNeighbors(pos)

          const posAsIndex = posResult.map(p => grid.posToIndex(p))
          expect(posAsIndex).toEqual(indexResult)
        }
      })

      it(`${size.w}×${size.h}: both branches produce same neighbor set (diagonals)`, () => {
        const grid = new RectGrid(size)
        for (let i = 0; i < grid.total; i++) {
          const indexResult = grid.getNeighbors(i, true) as number[]
          const pos = grid.indexToPos(i)
          const posResult = grid.getNeighbors(pos, true)

          const posAsIndex = posResult.map(p => grid.posToIndex(p))
          expect(posAsIndex).toEqual(indexResult)
        }
      })
    }
  })

  describe('getNeighbors — offset grid', () => {
    it('offset=(5,5) 3×3: number branch returns correct indices', () => {
      const grid = new RectGrid({ x: 5, y: 5, w: 3, h: 3 })
      // index 0 = world pos (5,5) = grid-relative (0,0)
      // neighbors: right→index 1, down→index 3
      const result = grid.getNeighbors(0)
      expect(result).toEqual([3, 1])
    })

    it('offset=(5,5) 3×3: Position branch uses world coordinates', () => {
      const grid = new RectGrid({ x: 5, y: 5, w: 3, h: 3 })
      const result = grid.getNeighbors({ x: 5, y: 5 })
      expect(result).toEqual([
        { x: 5, y: 6 },
        { x: 6, y: 5 },
      ])
    })

    it('offset=(5,5) 3×3: out-of-grid world positions have no neighbors', () => {
      const grid = new RectGrid({ x: 5, y: 5, w: 3, h: 3 })
      // (0, 0) is outside the grid area [5..7]×[5..7]
      const result = grid.getNeighbors({ x: 0, y: 0 })
      expect(result).toEqual([])
    })

    it('offset grid: number vs Position equivalence', () => {
      const grid = new RectGrid({ x: 10, y: 20, w: 4, h: 3 })
      for (let i = 0; i < grid.total; i++) {
        const indexResult = grid.getNeighbors(i) as number[]
        const pos = grid.indexToPos(i)
        const posResult = grid.getNeighbors(pos)

        const posAsIndex = posResult.map(p => grid.posToIndex(p))
        expect(posAsIndex).toEqual(indexResult)
      }
    })
  })

  describe('getNeighbors — edge case grids', () => {
    it('1×1 grid: no neighbors', () => {
      const grid = new RectGrid({ w: 1, h: 1 })
      expect(grid.getNeighbors(0)).toEqual([])
      expect(grid.getNeighbors(0, true)).toEqual([])
      expect(grid.getNeighbors({ x: 0, y: 0 })).toEqual([])
    })

    it('1×4 single row: only left/right neighbors', () => {
      const grid = new RectGrid({ w: 4, h: 1 })
      expect(grid.getNeighbors(0)).toEqual([1]) // right only
      expect(grid.getNeighbors(1)).toEqual([0, 2]) // left, right
      expect(grid.getNeighbors(3)).toEqual([2]) // left only
    })

    it('4×1 single column: only up/down neighbors', () => {
      const grid = new RectGrid({ w: 1, h: 4 })
      expect(grid.getNeighbors(0)).toEqual([1]) // down only
      expect(grid.getNeighbors(1)).toEqual([0, 2]) // up, down
      expect(grid.getNeighbors(3)).toEqual([2]) // up only
    })
  })

  describe('posToIndex / indexToPos', () => {
    it('round-trip with zero offset', () => {
      const grid = new RectGrid({ w: 5, h: 4 })
      for (let i = 0; i < grid.total; i++) {
        expect(grid.posToIndex(grid.indexToPos(i))).toBe(i)
      }
    })

    it('round-trip with non-zero offset', () => {
      const grid = new RectGrid({ x: 3, y: 7, w: 5, h: 4 })
      for (let i = 0; i < grid.total; i++) {
        expect(grid.posToIndex(grid.indexToPos(i))).toBe(i)
      }
    })
  })

  describe('isValidPos', () => {
    it('zero offset: in-bounds and out-of-bounds', () => {
      const grid = new RectGrid({ w: 3, h: 3 })
      expect(grid.isValidPos({ x: 0, y: 0 })).toBe(true)
      expect(grid.isValidPos({ x: 2, y: 2 })).toBe(true)
      expect(grid.isValidPos({ x: -1, y: 0 })).toBe(false)
      expect(grid.isValidPos({ x: 3, y: 0 })).toBe(false)
      expect(grid.isValidPos({ x: 0, y: 3 })).toBe(false)
    })

    it('non-zero offset: uses world coordinates', () => {
      const grid = new RectGrid({ x: 5, y: 5, w: 3, h: 3 })
      expect(grid.isValidPos({ x: 5, y: 5 })).toBe(true)
      expect(grid.isValidPos({ x: 7, y: 7 })).toBe(true)
      expect(grid.isValidPos({ x: 4, y: 5 })).toBe(false)
      expect(grid.isValidPos({ x: 8, y: 5 })).toBe(false)
      expect(grid.isValidPos({ x: 0, y: 0 })).toBe(false)
    })
  })

  describe('setBounds / total', () => {
    it('default grid is 1×1', () => {
      const grid = new RectGrid()
      expect(grid.w).toBe(1)
      expect(grid.h).toBe(1)
      expect(grid.total).toBe(1)
    })

    it('setBounds updates only specified fields', () => {
      const grid = new RectGrid({ x: 1, y: 2, w: 3, h: 4 })
      grid.setBounds({ w: 10 })
      expect(grid.x).toBe(1)
      expect(grid.y).toBe(2)
      expect(grid.w).toBe(10)
      expect(grid.h).toBe(4)
    })

    it('total equals w × h', () => {
      const grid = new RectGrid({ w: 7, h: 3 })
      expect(grid.total).toBe(21)
    })
  })
})
