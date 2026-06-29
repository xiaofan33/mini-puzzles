import { useEffect, useLayoutEffect, useState } from 'react'
import { Shadcn } from '@/components/ui'
import { useLocalStorage } from '@/lib/hooks'
import { isTouchDevice } from '@/lib/utils'
import { createDefaultOptions, type UserOptions } from '../options'
import { celebrateWin } from '../confetti'
import {
  decodeShareHash,
  findDifficulty,
  formatTime,
  randomPalette,
} from '../utils'
import type { GameStatus, GameProps, BoardConfig } from '../model'
import { useGameModel } from './use'
import CustomOptions from './Custom'
import GameBoard from './Board'
import GameShare from './Share'
import { emojis, userOptionsKey, difficulties } from '../assets/config.json'
import '../assets/styles.css'

export function Menu(props: {
  palette: string
  boardConfig: BoardConfig
  onChange: (patch: Partial<UserOptions>) => void
}) {
  const current = findDifficulty(props.boardConfig)
  const difficulty = current?.value || 'custom'

  function handleSelectChange(value?: string | null) {
    if (!value || value === 'custom') return

    const matched = findDifficulty(value)
    if (matched) {
      const nextBoard = { w: matched.w, h: matched.h, m: matched.m }
      props.onChange({ board: nextBoard })
    }
  }

  return (
    <div className="flex items-center justify-between">
      <Shadcn.Select value={difficulty} onValueChange={handleSelectChange}>
        <Shadcn.SelectTrigger className="border-primary/30 w-24">
          {current?.label ?? '自定义'}
        </Shadcn.SelectTrigger>
        <Shadcn.SelectContent>
          <Shadcn.SelectGroup>
            {difficulties.map(d => (
              <Shadcn.SelectItem key={d.value} value={d.value} className="h-8">
                {d.label}
                <span className="text-muted-foreground pl-3 font-mono tracking-widest">
                  {d.w}x{d.h}
                </span>
              </Shadcn.SelectItem>
            ))}
            <Shadcn.Dialog>
              <Shadcn.DialogTrigger className="w-full">
                <Shadcn.SelectItem key="custom" value="custom" className="h-8">
                  自定义
                </Shadcn.SelectItem>
              </Shadcn.DialogTrigger>
              <CustomOptions
                defaultValue={props.boardConfig}
                onConfirm={b => props.onChange({ board: b })}
              />
            </Shadcn.Dialog>
          </Shadcn.SelectGroup>
        </Shadcn.SelectContent>
      </Shadcn.Select>
      <Shadcn.Button
        variant="ghost"
        size="icon-lg"
        style={{ color: 'var(--accent-deep)' }}
        onClick={() =>
          props.onChange({ palette: randomPalette(props.palette) })
        }
      >
        <i className="i-tabler-windmill animation-duration-5000 animate-spin text-xl" />
      </Shadcn.Button>
    </div>
  )
}

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

  const model = useGameModel()
  const { status, flagCount, boardConfig, gridCells } = model
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
    <div
      data-palette={options.palette}
      className="flex min-h-svh justify-center select-none"
      style={{
        background: 'color-mix(in oklch, var(--accent-soft) 10%, transparent)',
      }}
    >
      <div className="w-fit max-w-full space-y-3 p-4">
        <Menu
          palette={options.palette}
          boardConfig={boardConfig}
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
              {isTouchDevice() && (
                <Shadcn.Field orientation="horizontal">
                  <Shadcn.Checkbox
                    id="flag-mode"
                    className="border-foreground/20"
                    checked={options.flagMode}
                    onCheckedChange={v => handleOptionsChange({ flagMode: v })}
                  />
                  <Shadcn.Label htmlFor="flag-mode" className="py-2">
                    插旗优先
                  </Shadcn.Label>
                </Shadcn.Field>
              )}
              <GameShare flagCount={flagCount} onDump={model.dump} />
            </>
          )}
        </div>
      </div>
    </div>
  )
}
