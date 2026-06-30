import { describe, expect, it } from 'vitest'
import { isSolvable } from './utils'

describe('isSolvable', () => {
  describe('odd width grids', () => {
    it('3x3 solved state is solvable', () => {
      expect(
        isSolvable([
          [1, 2, 3],
          [4, 5, 6],
          [7, 8, 0],
        ]),
      ).toBe(true)
    })

    it('3x3 with single inversion is unsolvable', () => {
      expect(
        isSolvable([
          [1, 2, 3],
          [4, 5, 6],
          [8, 7, 0],
        ]),
      ).toBe(false)
    })

    it('5x5 solved state is solvable', () => {
      expect(
        isSolvable([
          [1, 2, 3, 4, 5],
          [6, 7, 8, 9, 10],
          [11, 12, 13, 14, 15],
          [16, 17, 18, 19, 20],
          [21, 22, 23, 24, 0],
        ]),
      ).toBe(true)
    })
  })

  describe('even width grids', () => {
    it('4x4 solved state is solvable', () => {
      expect(
        isSolvable([
          [1, 2, 3, 4],
          [5, 6, 7, 8],
          [9, 10, 11, 12],
          [13, 14, 15, 0],
        ]),
      ).toBe(true)
    })

    it('4x4 with single inversion is unsolvable', () => {
      // Swap 14 and 15: inversions=1, blank row from bottom=1
      // (1 + 1) = 2 even → unsolvable
      expect(
        isSolvable([
          [1, 2, 3, 4],
          [5, 6, 7, 8],
          [9, 10, 11, 12],
          [13, 15, 14, 0],
        ]),
      ).toBe(false)
    })
  })

  describe('edge cases', () => {
    it('1x1 grid is solvable', () => {
      expect(isSolvable([[0]])).toBe(true)
    })

    it('1x2 solved state is solvable', () => {
      expect(isSolvable([[1, 0]])).toBe(true)
    })

    it('2x1 solved state is solvable', () => {
      expect(isSolvable([[1], [0]])).toBe(true)
    })

    it('empty grid is not solvable', () => {
      expect(isSolvable([])).toBe(false)
    })

    it('grid with empty row is not solvable', () => {
      expect(isSolvable([[]])).toBe(false)
    })
  })
})
