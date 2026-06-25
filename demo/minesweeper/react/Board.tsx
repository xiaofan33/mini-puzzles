import React, { useMemo, useRef } from 'react'
import { cn, type Position } from '@/lib/utils'
import { cellAt, themeLoader, type Settings } from '../utils'
import { useGameBoard } from './use'
import type { Cell, Operation } from '../model'

export type CellVariant = 'normal' | 'hi' | 'exploded' | 'misflagged'

export function BoardCell(props: { cell: Cell; highlighted?: boolean }) {
  const { cell, highlighted = false } = props
  const { type, mine, adjacentMineCount } = cell

  const { label, num } = useMemo(() => {
    if (type === 'exploded') {
      return { label: themeLoader.getEmoji('boom') }
    }
    if (type === 'flagged' || type === 'misflagged') {
      return { label: themeLoader.getEmoji('flag') }
    }
    if (type === 'revealed') {
      if (mine) return { label: themeLoader.getEmoji('mine') }

      const num = adjacentMineCount!.toString()
      return { label: num, num }
    }
    return { label: '' }
  }, [type, mine, adjacentMineCount])

  const variant: CellVariant = useMemo(() => {
    switch (type) {
      case 'covered':
      case 'flagged':
        return highlighted ? 'hi' : 'normal'
      case 'revealed':
        return 'hi'
      case 'exploded':
        return 'exploded'
      case 'misflagged':
        return 'misflagged'
    }
  }, [type, highlighted])

  return (
    <div
      data-num={num}
      data-variant={variant}
      className={cn(
        'flex size-(--cell-size) items-center justify-center rounded-(--cell-radius) border font-mono font-bold transition-[background-color]',
        variant !== 'exploded' && variant !== 'misflagged'
          ? 'border-(--cell-border) bg-linear-to-br from-(--cell-from) to-(--cell-to)'
          : '',
        variant === 'exploded' &&
          'animate-boom-shake border-transparent bg-red-600',
        variant === 'misflagged' && 'border-transparent bg-red-300',
      )}
    >
      {label}
    </div>
  )
}

export default function GameBoard(props: {
  isReady?: boolean
  settings: Settings
  gridCells: Cell[][]
  onOperate: (i: number, op: Operation) => void
  getAdjacentCells: (i: number) => Cell[]
}) {
  const boardRef = useRef<HTMLDivElement>(null)

  const columns = props.gridCells[0]?.length ?? 0
  const { size, gap, radius, flagMode } = props.settings

  const cssVars = useMemo(
    () =>
      ({
        '--col': `${columns}`,
        '--gap': `${gap}px`,
        '--cell-fontsize': `${size * 0.61}px`,
        '--cell-radius': `${radius}px`,
        '--cell-size': `${size}px`,
      }) as React.CSSProperties,
    [columns, gap, radius, size],
  )

  const { enableHighlight, pointerPosition } = useGameBoard(
    boardRef,
    (op: Operation, pos: Position) => {
      const grid = cellAt(pos, size, gap)
      if (!grid) return

      const cell = props.gridCells[grid.y][grid.x]
      if (!cell) return

      if (op === 'reveal' && cell.type === 'revealed') {
        props.onOperate(cell.index, 'chord-reveal')
        return
      }
      if (op === 'reveal' && flagMode && !props.isReady) {
        props.onOperate(cell.index, 'toggle-flag')
        return
      }
      props.onOperate(cell.index, op)
    },
  )

  const hoveredCell = useMemo(() => {
    if (!pointerPosition) return

    const grid = cellAt(pointerPosition, size, gap)
    if (!grid) return

    return props.gridCells[grid.y][grid.x]
  }, [pointerPosition, size, gap, props.gridCells])

  const hoveredCellRef = useRef(hoveredCell)
  hoveredCellRef.current = hoveredCell

  const highlightedIndices = useMemo(() => {
    if (!enableHighlight) return

    const cell = hoveredCellRef.current
    if (!cell) return

    if (cell.type === 'flagged' || (flagMode && cell.type === 'covered')) return

    if (cell.type === 'covered') {
      return [cell.index]
    }

    return props
      .getAdjacentCells(cell.index)
      .filter(c => c.type === 'covered')
      .map(c => c.index)
  }, [enableHighlight, hoveredCell, flagMode])

  return (
    <div
      style={cssVars}
      className="mx-auto w-fit max-w-full overflow-auto p-0.5 select-none"
    >
      <div
        ref={boardRef}
        data-palette={props.settings.palette}
        className="grid grid-cols-[repeat(var(--col),1fr)] gap-(--gap) text-(length:--cell-fontsize)"
      >
        {props.gridCells.map(row => {
          return row.map(cell => (
            <BoardCell
              key={cell.index}
              cell={cell}
              highlighted={highlightedIndices?.includes(cell.index)}
            />
          ))
        })}
      </div>
    </div>
  )
}
