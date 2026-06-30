import { useMemo, useRef } from 'react'
import { cn } from '@/lib/utils'
import { pickCell } from '../utils'
import { useGameBoard } from './use'
import type { UserOptions } from '../options'
import type { Cell, Operation } from '../model'
import { emojis } from '../assets/config.json'

const BASE_GRADIENT = 'bg-linear-to-br border-(--cell-border)'
const GRADIENT = cn(BASE_GRADIENT, 'from-(--cell-from) to-(--cell-to)')
const HI_GRADIENT = cn(BASE_GRADIENT, 'from-(--cell-hi-from) to-(--cell-hi-to)')

export function BoardCell(props: Cell & { highlighted?: boolean }) {
  const { status, mine, adjacentMineCount, highlighted = false } = props

  const { txt, num } = useMemo(() => {
    if (status == 'exploded') {
      return { txt: emojis['boom'] }
    }
    if (status === 'flagged' || status === 'misflagged') {
      return { txt: emojis['flag'] }
    }
    if (status === 'revealed') {
      if (mine) {
        return { txt: emojis['mine'] }
      }
      const num = props.adjacentMineCount?.toString()
      return { txt: num, num }
    }
    return { txt: '' }
  }, [status, mine, adjacentMineCount])

  const cellStyle = useMemo(() => {
    if (status === 'exploded') {
      return 'animate-boom-shake border-transparent bg-red-600'
    }
    if (status === 'misflagged') {
      return 'border-transparent bg-red-300'
    }
    if (status === 'revealed' || highlighted) {
      return HI_GRADIENT
    }
    return `${GRADIENT} hover:from-(--accent-soft) hover:to-(--accent-deep)`
  }, [status, highlighted])

  return (
    <div
      data-num={num}
      className={cn(
        'flex size-(--cell-size) items-center justify-center rounded-(--cell-radius) border font-mono font-bold transition-[background-color]',
        cellStyle,
      )}
    >
      {txt}
    </div>
  )
}

export default function GameBoard(props: {
  isReady?: boolean
  options: UserOptions
  gridCells: Cell[][]
  getAdjacentCells: (i: number) => Cell[]
  onOperate: (i: number, op: Operation) => void
}) {
  const boardRef = useRef<HTMLDivElement>(null)

  const { radius, size, flagMode } = props.options
  const columns = props.gridCells[0]?.length ?? 0
  const gap = size * 0.05

  const cssVars = useMemo(
    () =>
      ({
        '--col': `${columns}`,
        '--gap': `${gap}px`,
        '--cell-fontsize': `${size * 0.61}px`,
        '--cell-radius': `${radius}px`,
        '--cell-size': `${size}px`,
      }) as Record<string, string>,
    [columns, radius, size],
  )

  const { enableHighlight, pointerPosition } = useGameBoard(
    boardRef,
    (op, p) => {
      const cell = pickCell(p, size, gap, props.gridCells)
      if (!cell) return

      let modifiedOp = op
      if (op === 'reveal') {
        if (cell.status === 'revealed') {
          modifiedOp = 'chord-reveal'
        } else if (flagMode && !props.isReady) {
          modifiedOp = 'toggle-flag'
        }
      }

      props.onOperate(cell.index, modifiedOp)
    },
  )

  const hoveredCell = useMemo(() => {
    if (!pointerPosition) return
    return pickCell(pointerPosition, size, gap, props.gridCells)
  }, [pointerPosition, size, gap, props.gridCells])

  const hoveredCellRef = useRef(hoveredCell)
  hoveredCellRef.current = hoveredCell

  const highlightedIndices = useMemo(() => {
    if (!enableHighlight) return

    const cell = hoveredCellRef.current
    if (!cell) return

    if (cell.status === 'flagged' || (flagMode && cell.status === 'covered'))
      return

    if (cell.status === 'covered') {
      return [cell.index]
    }

    return props
      .getAdjacentCells(cell.index)
      .filter(c => c.status === 'covered')
      .map(c => c.index)
  }, [enableHighlight, hoveredCell, flagMode])

  return (
    <div
      style={cssVars}
      className="mx-auto w-fit max-w-full overflow-auto p-0.5 select-none"
    >
      <div
        ref={boardRef}
        className="grid grid-cols-[repeat(var(--col),1fr)] gap-(--gap) text-(length:--cell-fontsize)"
      >
        {props.gridCells.map(row => {
          return row.map(cell => (
            <BoardCell
              key={cell.index}
              {...cell}
              highlighted={highlightedIndices?.includes(cell.index)}
            />
          ))
        })}
      </div>
    </div>
  )
}
