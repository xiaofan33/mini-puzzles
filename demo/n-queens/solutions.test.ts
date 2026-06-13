import { describe, expect, it } from 'vitest'
import { allSolutions } from './solutions'

function isValidSolution(solution: number[], n: number) {
  if (solution.length !== n) return false
  const seen = new Set()
  for (let row = 0; row < n; row++) {
    const col = solution[row]
    if (col < 0 || col >= n) return false
    if (
      !seen.add(`c${col}`) ||
      !seen.add(`d1${row - col}`) ||
      !seen.add(`d2${row + col}`)
    ) {
      return false
    }
  }
  return true
}

describe('测试可行解的数量', () => {
  const testCases = [
    { n: 3, expected: 0 },
    { n: 4, expected: 2 },
    { n: 8, expected: 92 },
    { n: 9, expected: 352 },
  ]

  testCases.forEach(({ n, expected }) => {
    it(`${n} 皇后应该返回 ${expected} 个解`, () => {
      allSolutions.forEach((solution, index) => {
        expect(solution(n).length, `nQueens$${index + 1}`).toBe(expected)
      })
    })
  })
})

describe('测试可行解的正确性', () => {
  const testCases = [8, 9]

  testCases.forEach(n => {
    it(`${n} 皇后返回的所有解应该都是有效的`, () => {
      allSolutions.forEach((solution, index) => {
        solution(n).forEach(s => {
          expect(isValidSolution(s, n), `nQueens$${index + 1}`).toBe(true)
        })
      })
    })
  })

  testCases.forEach(n => {
    it(`${n} 皇后返回的所有解应该都是唯一的`, () => {
      allSolutions.forEach((solution, index) => {
        const res = solution(n)
        const s = new Set()
        res.forEach(r => s.add(JSON.stringify(r)))
        expect(res.length, `nQueens$${index + 1}`).toBe(s.size)
      })
    })
  })
})

describe('测试参数校验', () => {
  const invalidInputs = [0, -1, 16, 100]
  invalidInputs.forEach(n => {
    it(`n = ${n} 时应该抛出 RangeError`, () => {
      allSolutions.forEach((solution, index) => {
        expect(() => solution(n), `nQueens$${index + 1}`).toThrow(RangeError)
      })
    })
  })
})

describe('打印 N-Queens 的求解时间', () => {
  const ns = [11, 12]
  ns.forEach(n => {
    allSolutions.forEach((solution, index) => {
      it(`当 n = ${n} 时, nQueens$${index + 1} 应能正常求解`, () => {
        const result = solution(n)
        expect(result.length).toBeGreaterThan(0)
      })
    })
  })
})
