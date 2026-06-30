export interface UserOptions {
  /** Board config: width, height, mine count */
  board: {
    /** Board width */
    w: number
    /** Board height */
    h: number
    /** Mine count */
    m: number
  }

  /** Color theme */
  palette: string

  /** Cell size (px) */
  size: number
  /** Cell border radius (px) */
  radius: number

  /** Left-click places flag instead of reveal */
  flagMode: boolean

  /** Whether mine density is locked when adjusting width/height */
  lockDensity: boolean
}

export function createDefaultOptions(): UserOptions {
  return {
    board: {
      w: 9,
      h: 9,
      m: 10,
    },
    palette: 'sky',
    size: 32,
    radius: 2,
    flagMode: false,
    lockDensity: true,
  }
}
