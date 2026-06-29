import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type RefObject,
} from 'react'
import { createModel, type GameProps, type Operation } from '../model'
import type { Position } from '@/lib/utils'

// https://developer.mozilla.org/en-US/docs/Web/API/MouseEvent/button#value
const BTN_L = 0

export function useGameBoard(
  boardRef: RefObject<HTMLDivElement | null>,
  handler: (op: Operation, pos: Position) => void,
) {
  const handlerRef = useRef(handler)
  handlerRef.current = handler

  const [enableHighlight, setEnableHighlight] = useState(false)
  const [pointerPosition, setPointerPosition] = useState<Position | null>(null)

  const track = (e: MouseEvent) => {
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
  }

  const preventContextMenu = (e: MouseEvent) => e.preventDefault()

  const onPointerDown = useCallback((e: PointerEvent) => {
    const pressed = track(e)!
    setPointerPosition(pressed.pos)

    const showHighlight = e.button === BTN_L
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
      if (inBoard) {
        if (e.button === 0) {
          handlerRef.current('reveal', pos)
        } else if (e.button === 2) {
          handlerRef.current('toggle-flag', pos)
        }
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
  }, [])

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
    enableHighlight,
    pointerPosition,
  }
}

export function useGameModel() {
  const [m] = useState(() => createModel())

  const [, setVersion] = useState(0)
  const forceRerender = useCallback(() => setVersion(v => v + 1), [])

  const status = m.status
  const boardConfig = m.boardConfig
  const flagCount = m.flagIndices.size
  const gridCells = useMemo(
    () => m.createGridCells(),
    [boardConfig.w, boardConfig.h],
  )

  const actions = useMemo(
    () => ({
      restore: (p: GameProps) => {
        m.restore(p)
        forceRerender()
      },
      restart: () => {
        m.restart()
        forceRerender()
      },
      operate: (i: number, op: Operation) => {
        m.operate(i, op)
        forceRerender()
      },
      dump: () => m.dump(),
      getElapsedTime: () => m.getElapsedTime(),
      getAdjacentCells: (i: number) => m.getAdjacentCells(i),
    }),
    [],
  )

  return {
    status,
    boardConfig,
    flagCount,
    gridCells,
    ...actions,
  }
}
