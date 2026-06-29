import {} from 'react'
import { Shadcn } from '@/components/ui'
import { findDifficulty, randomPalette } from '../utils'
import type { UserOptions } from '../options'
import type { BoardConfig } from '../model'
import { difficulties } from '../assets/config.json'

export default function GameMenu(props: {
  boardConfig: BoardConfig
  options: UserOptions
  onChange: (patch: Partial<UserOptions>) => void
}) {
  const { boardConfig, options, onChange } = props

  const configs = findDifficulty(boardConfig)
  const difficulty = configs?.value ?? 'custom'

  function handleSelectChange(value: string | null) {
    if (!value) return

    if (value === 'custom') {
      // todo...
      return
    }
    const matched = findDifficulty(value)
    if (matched) {
      const board = { w: matched.w, h: matched.h, m: matched.m }
      onChange({ board })
    }
  }

  return (
    <div className="flex items-center justify-between">
      <Shadcn.Select value={difficulty} onValueChange={handleSelectChange}>
        <Shadcn.SelectTrigger className="border-primary/30 w-24">
          {configs?.label ?? '自定义'}
        </Shadcn.SelectTrigger>
        <Shadcn.SelectContent>
          <Shadcn.SelectGroup>
            {difficulties.map(d => (
              <Shadcn.SelectItem
                key={d.value}
                value={d.value}
                className="h-8 pl-2"
              >
                {d.label}
                <span className="text-muted-foreground pl-4 font-mono tracking-wider">
                  {d.w}x{d.h}
                </span>
              </Shadcn.SelectItem>
            ))}
            <Shadcn.SelectItem key="custom" value="custom" className="h-8 pl-2">
              自定义
            </Shadcn.SelectItem>
          </Shadcn.SelectGroup>
        </Shadcn.SelectContent>
      </Shadcn.Select>
      <Shadcn.Button
        variant="ghost"
        size="icon-lg"
        style={{ color: `var(--color-${options.palette}-400)` }}
        onClick={() => {
          onChange({ palette: randomPalette(options.palette) })
        }}
      >
        <i className="i-tabler-windmill animation-duration-5000 animate-spin text-xl" />
      </Shadcn.Button>
    </div>
  )
}
