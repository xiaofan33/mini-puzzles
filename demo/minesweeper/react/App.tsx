import { useEffect, useLayoutEffect, useState } from 'react'
import { Shadcn } from '@/components/ui'
import { useLocalStorage } from '@/lib/hooks'
import { isTouchDevice } from '@/lib/utils'
import { formatTime, themeLoader, type Settings } from '../utils'
import { celebrateWin } from '../confetti'
import { useGameModel } from './use'
import type { GameState } from '../model'
import Menu from './Menu'
import GameBoard from './Board'
import Share from './Share'

import configJson from '../assets/config.json'
import '../assets/preset.css'

export function Hud(props: {
  state: GameState
  flagCount: number
  mineCount: number
  getElapsedTime: () => number
  onNewGame: () => void
}) {
  const toSeconds = () => Math.floor(props.getElapsedTime() / 1000)
  const [seconds, setSeconds] = useState(toSeconds)

  useEffect(() => {
    if (props.state === 'ready') {
      setSeconds(0)
    }
    if (props.state === 'playing') {
      const intervalId = setInterval(() => setSeconds(toSeconds), 1000)
      return () => clearInterval(intervalId)
    }
  }, [props.state])

  return (
    <div className="flex items-center justify-between">
      <div className="flex w-24 items-center justify-center gap-2 p-2 font-mono">
        {themeLoader.getEmoji('flag')}
        <div className="flex items-center gap-1">
          <span className="font-bold text-red-600">
            {props.state === 'ready' ? '-' : props.flagCount}
          </span>
          <span>/</span>
          <span>{props.mineCount}</span>
        </div>
      </div>
      <Shadcn.Button
        variant="ghost"
        className="size-12 text-xl"
        onClick={props.onNewGame}
      >
        {themeLoader.getEmoji(props.state)}
      </Shadcn.Button>
      <div className="flex w-24 items-center justify-center gap-2 p-2 font-mono">
        {themeLoader.getEmoji('time')}
        <div>{props.state === 'ready' ? '--:--' : formatTime(seconds)}</div>
      </div>
    </div>
  )
}

export default function App() {
  const [settings, setSettings] = useLocalStorage(
    configJson.settingsStoreKey,
    configJson.userSettings,
  )

  const model = useGameModel()

  useEffect(() => {
    if (model.state === 'won') {
      celebrateWin()
    }
  }, [model.state])

  function newGame() {
    model.restore(settings.board)
  }

  useLayoutEffect(() => {
    console.log(location.href)
    newGame()
  }, [])

  function onSettingsChange(patch: Partial<Settings>) {
    const next = { ...settings, ...patch }
    setSettings(next)
    if (patch.board) {
      model.restore(next.board)
    }
  }

  return (
    <div
      className="flex min-h-svh justify-center select-none"
      style={{ background: `var(--color-${settings.palette}-50)` }}
    >
      <div className="w-fit max-w-full space-y-3 p-4">
        <Menu />
        <Hud
          state={model.state}
          flagCount={model.flagCount}
          mineCount={model.board.m}
          getElapsedTime={model.getElapsedTime}
          onNewGame={newGame}
        />
        <GameBoard
          isReady={model.state === 'ready'}
          settings={settings}
          gridCells={model.gridCells}
          getAdjacentCells={model.getAdjacentCells}
          onOperate={model.operate}
        />
        {model.state === 'playing' && (
          <div className="flex items-center justify-end">
            {isTouchDevice() && (
              <Shadcn.Field orientation="horizontal">
                <Shadcn.Checkbox
                  id="flag-mode"
                  className="border-foreground/20"
                  checked={settings.flagMode}
                  onCheckedChange={v => onSettingsChange({ flagMode: v })}
                />
                <Shadcn.Label htmlFor="flag-mode" className="py-2">
                  点击标旗
                </Shadcn.Label>
              </Shadcn.Field>
            )}
            <Share onDump={model.dump} />
          </div>
        )}
      </div>
    </div>
  )
}
