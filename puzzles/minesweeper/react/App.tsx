import { useEffect, useLayoutEffect, useState } from 'react'
import { Shadcn } from '@/components/ui'
import { useLocalStorage } from '@/lib/hooks'
import { createDefaultOptions, type UserOptions } from '../options'
import { celebrateWin } from '../confetti'
import { decodeShareHash, formatTime, isTouchDevice } from '../utils'
import type { GameStatus, GameProps } from '../model'
import { useGameModel } from './use'
import GameMenu from './Menu'
import GameBoard from './Board'
import Share from './Share'
import { emojis, userOptionsKey } from '../assets/config.json'
import '../assets/styles.css'

export function Hud(props: {
  status: GameStatus
  flagCount: number
  mineCount: number
  getElapsedTime: () => number
  onNewGame: () => void
}) {
  const { status, flagCount, mineCount } = props

  const toSeconds = () => Math.floor(props.getElapsedTime() / 1000)
  const [seconds, setSeconds] = useState(toSeconds)

  useEffect(() => {
    setSeconds(toSeconds)
    if (status === 'playing') {
      const intervalId = setInterval(() => setSeconds(toSeconds), 1000)
      return () => clearInterval(intervalId)
    }
  }, [status])

  return (
    <div className="flex items-center justify-between">
      <div className="flex w-24 items-center justify-center gap-2 p-2 font-mono">
        {emojis['flag']}
        <div className="flex items-center gap-1">
          <span className="font-bold text-red-600">
            {status === 'ready' ? '-' : flagCount}
          </span>
          <span>/</span>
          <span>{mineCount}</span>
        </div>
      </div>
      <Shadcn.Button
        variant="ghost"
        className="size-12 text-xl"
        onClick={() => props.onNewGame()}
      >
        {emojis[status]}
      </Shadcn.Button>
      <div className="flex w-24 items-center justify-center gap-2 p-2 font-mono">
        {emojis['time']}
        <div>{status === 'ready' ? '--:--' : formatTime(seconds)}</div>
      </div>
    </div>
  )
}

export function FlagModeToggle(props: {
  checked: boolean
  onToggle: (v: boolean) => void
}) {
  if (!isTouchDevice()) return

  return (
    <Shadcn.Field orientation="horizontal">
      <Shadcn.Checkbox
        id="flag-mode"
        className="border-foreground/20"
        checked={props.checked}
        onCheckedChange={props.onToggle}
      />
      <Shadcn.Label htmlFor="flag-mode" className="py-2">
        点击标旗
      </Shadcn.Label>
    </Shadcn.Field>
  )
}

export default function App() {
  const [options, setOptions] = useLocalStorage(
    userOptionsKey,
    createDefaultOptions,
  )

  const {
    status,
    flagCount,
    boardConfig,
    gridCells,
    modelActions: model,
  } = useGameModel()
  const isReady = status === 'ready'
  const isPlaying = status === 'playing'

  useEffect(() => {
    if (status === 'won') {
      celebrateWin()
    }
  }, [status])

  useLayoutEffect(() => {
    const hash = location.hash?.slice(1)
    if (hash) {
      try {
        const props = decodeShareHash(hash)
        handleNewGame(props)
        return
      } catch (error) {}
    }

    handleNewGame()
  }, [])

  function handleNewGame(props?: GameProps) {
    model.restore(props || options.board)
  }

  function handleOptionsChange(patch: Partial<UserOptions>) {
    const next = { ...options, ...patch }
    setOptions(next)
    if (patch.board) {
      handleNewGame(patch.board)
    }
  }

  return (
    <div className="flex min-h-svh justify-center select-none">
      <div className="w-fit max-w-full space-y-3 p-4">
        <GameMenu
          boardConfig={boardConfig}
          options={options}
          onChange={handleOptionsChange}
        />
        <Hud
          status={status}
          flagCount={flagCount}
          mineCount={boardConfig.m}
          getElapsedTime={model.getElapsedTime}
          onNewGame={handleNewGame}
        />
        <GameBoard
          isReady={isReady}
          options={options}
          gridCells={gridCells}
          getAdjacentCells={model.getAdjacentCells}
          onOperate={model.operate}
        />
        <div className="flex items-center justify-end">
          {isPlaying && (
            <>
              <FlagModeToggle
                checked={options.flagMode}
                onToggle={v => handleOptionsChange({ flagMode: v })}
              />
              <Share flagCount={flagCount} onDump={model.dump} />
            </>
          )}
        </div>
      </div>
    </div>
  )
}
