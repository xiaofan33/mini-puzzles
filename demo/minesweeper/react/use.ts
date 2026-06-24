import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { create2DArray, type Position } from '@/lib/utils'
import { createModel, type Operation, type GameProps } from '../model'

// https://developer.mozilla.org/en-US/docs/Web/API/MouseEvent/button#value
const BTN_L = 0
const BTN_R = 1

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

      const { left, top, width, height } = board.getBoundingClientRect()
      const x = e.clientX - left + board.scrollLeft
      const y = e.clientY - top + board.scrollTop
      return {
        pos: { y, x },
        inBoard: x >= 0 && x < width && y >= 0 && y < height,
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
          const showHighlight =
            gestureRef.current.chordPending ||
            gestureRef.current.pressedButtons.has(BTN_L)
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

  useEffect(() => {
    const board = boardRef.current
    if (!board) return

    board.addEventListener('pointerdown', onPointerDown)
    return () => board.removeEventListener('pointerdown', onPointerDown)
  }, [boardRef])

  return {
    pointerPosition,
    enableHighlight,
  }
}

export function useGameModel() {
  const [m] = useState(() => createModel())

  const [, setVersion] = useState(0)
  const rerender = useCallback(() => setVersion(v => v + 1), [])

  const board = m.boardConfig
  const state = m.state
  const flagCount = m.flagIndices.size
  const gridCells = useMemo(
    () =>
      create2DArray(
        board.w,
        board.h,
        (y, x) => m.cells[m.grid.posToIndex({ y, x })],
      ),
    [board.w, board.h],
  )

  const toSeconds = () => Math.floor(m.getElapsedTime() / 1000)
  const [seconds, setSeconds] = useState(toSeconds())

  useEffect(() => {
    if (state !== 'playing') return
    const intervalId = setInterval(() => setSeconds(toSeconds), 1000)
    return () => clearInterval(intervalId)
  }, [state])

  const actions = useMemo(
    () => ({
      restore: (p: GameProps) => {
        m.restore(p)
        setSeconds(toSeconds)
        rerender()
      },
      restart: () => {
        m.restart()
        setSeconds(toSeconds)
        rerender()
      },
      operate: (i: number, op: Operation) => {
        m.operate(i, op)
        rerender()
      },
      dump: () => m.dump(),
      isGameOver: () => m.isGameOver(),
      getAdjacentCells: (i: number) => m.getAdjacentCells(i),
    }),
    [],
  )

  return {
    board,
    state,
    flagCount,
    gridCells,
    seconds,
    ...actions,
  }
}
