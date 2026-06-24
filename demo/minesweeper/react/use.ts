import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { create2DArray, type Position } from '@/lib/utils'
import { createModel, type Operation, type GameProps } from '../model'

// https://developer.mozilla.org/en-US/docs/Web/API/MouseEvent/button#value
const BTN_L = 0
const BTN_R = 2

export function useGameBoard(
  boardRef: React.RefObject<HTMLDivElement | null>,
  handler: (op: Operation, p: Position) => void,
) {
  const handlerRef = useRef(handler)
  handlerRef.current = handler

  const [pointerPosition, setPointerPosition] = useState<Position | null>(null)
  const [enableHighlight, setEnableHighlight] = useState(false)

  const gestureRef = useRef({
    pressedButtons: new Set<number>(),
    chordPending: false,
  })

  const track = useCallback(
    (e: MouseEvent) => {
      const board = boardRef.current
      if (!board) return

      const { left, top } = board.getBoundingClientRect()
      const { scrollWidth, scrollHeight, scrollLeft, scrollTop } = board
      const x = e.clientX - left + scrollLeft
      const y = e.clientY - top + scrollTop
      return {
        pos: { x, y },
        inBoard: x >= 0 && x < scrollWidth && y >= 0 && y < scrollHeight,
      }
    },
    [boardRef],
  )

  const onPointerDown = useCallback(
    (e: PointerEvent) => {
      const { pressedButtons } = gestureRef.current
      pressedButtons.add(e.button)

      const isChord = pressedButtons.has(BTN_L) && pressedButtons.has(BTN_R)
      if (isChord) gestureRef.current.chordPending = true

      const initial = track(e)!
      setPointerPosition(initial.pos)
      const showHighlight =
        gestureRef.current.chordPending ||
        gestureRef.current.pressedButtons.has(BTN_L)
      setEnableHighlight(showHighlight)

      let rafId = 0
      let pending: Position | null = null
      const flush = () => {
        rafId = 0
        if (pending) {
          setPointerPosition(pending)
          pending = null
        }
      }
      const rafCleanup = () => {
        if (rafId) {
          cancelAnimationFrame(rafId)
          rafId = 0
        }
        pending = null
      }

      const onMove = (e: PointerEvent) => {
        const { pos, inBoard } = track(e)!
        if (inBoard) {
          pending = pos
          if (!rafId) rafId = requestAnimationFrame(flush)
          setEnableHighlight(showHighlight)
        } else {
          rafCleanup()
          setEnableHighlight(false)
        }
      }

      const onExit = (e: PointerEvent) => {
        const { pos, inBoard } = track(e)!
        const g = gestureRef.current
        g.pressedButtons.delete(e.button)

        if (inBoard) {
          if (g.chordPending) {
            g.chordPending = false
            handlerRef.current('chord-reveal', pos)
          } else if (e.button === 0) {
            handlerRef.current('reveal', pos)
          } else if (e.button === 2) {
            handlerRef.current('toggle-flag', pos)
          }
        }
        if (g.pressedButtons.size === 0) {
          g.chordPending = false
        }

        rafCleanup()
        setEnableHighlight(false)
        document.removeEventListener('pointermove', onMove)
        document.removeEventListener('pointerup', onExit)
        document.removeEventListener('pointercancel', onExit)
      }

      document.addEventListener('pointermove', onMove)
      document.addEventListener('pointerup', onExit)
      document.addEventListener('pointercancel', onExit)
    },
    [boardRef],
  )

  const preventContextMenu = (e: MouseEvent) => e.preventDefault()

  useEffect(() => {
    const board = boardRef.current
    if (!board) return

    board.addEventListener('contextmenu', preventContextMenu)
    board.addEventListener('pointerdown', onPointerDown)
    return () => {
      board.removeEventListener('contextmenu', preventContextMenu)
      board.removeEventListener('pointerdown', onPointerDown)
    }
  }, [boardRef, onPointerDown])

  return {
    pointerPosition,
    enableHighlight,
  }
}

export function useGameModel() {
  const [m] = useState(() => createModel())

  const [version, setVersion] = useState(0)
  const rerender = useCallback(() => setVersion(v => v + 1), [])

  const board = m.boardConfig
  const state = m.state
  const flagCount = m.flagIndices.size
  const gridCells = useMemo(
    () =>
      create2DArray(board.h, board.w, pos => m.cells[m.grid.posToIndex(pos)]),
    [board.w, board.h, version],
  )

  const actions = useMemo(
    () => ({
      restore: (p: GameProps) => {
        m.restore(p)
        rerender()
      },
      restart: () => {
        m.restart()
        rerender()
      },
      operate: (i: number, op: Operation) => {
        const success = m.operate(i, op)
        if (success) rerender()
        return success
      },
      dump: () => m.dump(),
      isGameOver: () => m.isGameOver(),
      getElapsedTime: () => m.getElapsedTime(),
      getAdjacentCells: (i: number) => m.getAdjacentCells(i),
    }),
    [],
  )

  return {
    board,
    state,
    flagCount,
    gridCells,
    ...actions,
  }
}
