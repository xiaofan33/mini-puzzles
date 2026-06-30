import { useEffect, useLayoutEffect, useState } from 'react'
import { Shadcn } from '@/components/ui'
import { useLocalStorage } from '@/lib/hooks'
import { createDefaultOptions, type UserOptions } from '../options'
import { celebrateWin } from '../confetti'
import { decodeShareHash, formatTime } from '../utils'
import type { GameStatus, GameProps } from '../model'
import { useGameModel } from './use'
import {
  SwitchPalette,
  ToggleFlagMode,
  SelectDifficulty,
  SelectCellSize,
} from './Settings'
import GameBoard from './Board'
import GameShare from './Share'
import CustomDialog from './Custom'
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
        <div className="font-bold tracking-wider text-red-600">
          {status === 'ready' ? '--:--' : formatTime(seconds)}
        </div>
      </div>
    </div>
  )
}

export default function App() {
  const [options, setOptions] = useLocalStorage(
    userOptionsKey,
    createDefaultOptions,
  )

  const [dialogOpen, setDialogOpen] = useState(false)

  const model = useGameModel()
  const { status, flagCount, boardConfig, gridCells } = model
  const isReady = status === 'ready'
  const isPlaying = status === 'playing'
  const isLostGame = status === 'lost'

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
      } catch {}
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
    <>
      <div
        data-palette={options.palette}
        className="flex min-h-svh justify-center select-none"
      >
        <div className="w-fit max-w-full space-y-3 p-4">
          <div className="flex items-center justify-between">
            <SelectDifficulty
              boardConfig={boardConfig}
              onChange={v => handleOptionsChange({ board: v })}
              onSelectCustom={() => setDialogOpen(true)}
            />
            <Shadcn.ButtonGroup>
              <SelectCellSize
                size={options.size}
                onChange={v => handleOptionsChange({ size: v })}
              />
              <SwitchPalette
                palette={options.palette}
                onChange={v => handleOptionsChange({ palette: v })}
              />
            </Shadcn.ButtonGroup>
          </div>

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
          {isPlaying && (
            <div className="flex items-center justify-end">
              <ToggleFlagMode
                checked={options.flagMode}
                onChange={v => handleOptionsChange({ flagMode: v })}
              />
              <GameShare flagCount={flagCount} onDump={model.dump} />
            </div>
          )}
          {isLostGame && (
            <div className="flex items-center justify-center">
              <Shadcn.Button
                variant="ghost"
                size="icon-lg"
                onClick={model.restart}
              >
                <i className="i-lucide-repeat-1" />
              </Shadcn.Button>
            </div>
          )}
        </div>
      </div>
      <CustomDialog
        isOpen={dialogOpen}
        defaultValue={options}
        onOpenChange={setDialogOpen}
        onConfirm={handleOptionsChange}
      />
    </>
  )
}
