import type { ComponentType } from 'react'
import {
  Puzzle,
  Bomb,
  Grid3x3,
  RotateCw,
  ArrowUpDown,
  Sparkles,
} from 'lucide-react'

export type GameStatus = 'planned' | 'in-progress' | 'done'

export interface GameMeta {
  id: string
  name: string
  description: string
  icon: ComponentType<{ className?: string }>
  status: GameStatus
  /** Lazy-loaded entry component, keyed by id. */
  loader?: () => Promise<{ default: ComponentType }>
}

export const games: GameMeta[] = [
  {
    id: '2048',
    name: '2048',
    description: '滑动方块，合并相同数字，挑战 2048',
    icon: Sparkles,
    status: 'planned',
    loader: () => import('@/2048'),
  },
  {
    id: 'minesweeper',
    name: '扫雷',
    description: '逻辑推理，避开地雷，揭开整片安全区',
    icon: Bomb,
    status: 'planned',
    loader: () => import('@/minesweeper'),
  },
  {
    id: 'number-puzzle',
    name: '数字华容道',
    description: '滑动数字方块，按顺序复原排列',
    icon: Grid3x3,
    status: 'planned',
    loader: () => import('@/number-puzzle'),
  },
  {
    id: 'rotation-puzzle',
    name: '旋转拼图',
    description: '旋转每一块拼图，还原完整图案',
    icon: RotateCw,
    status: 'planned',
    loader: () => import('@/rotation-puzzle'),
  },
  {
    id: 'klotski',
    name: '华容道',
    description: '移动不规则方块，把目标块送出出口',
    icon: ArrowUpDown,
    status: 'planned',
    loader: () => import('@/klotski'),
  },
  {
    id: 'peg-solitaire',
    name: '孔明棋',
    description: '跳跃消除棋子，目标是只剩最后一颗',
    icon: Puzzle,
    status: 'planned',
    loader: () => import('@/peg-solitaire'),
  },
]

export const gameMap: Record<string, GameMeta> = Object.fromEntries(
  games.map(g => [g.id, g]),
)
