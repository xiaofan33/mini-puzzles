import { useState } from 'react'
import { Shadcn } from '@/components/ui'
import { isTouchDevice } from '@/lib/utils'
import { findDifficulty, randomPalette } from '../utils'
import type { BoardConfig } from '../model'
import { difficulties, cellSizeBounds } from '../assets/config.json'

const cellSizeItems = Array.from(
  { length: cellSizeBounds.max - cellSizeBounds.min + 1 },
  (_, i) => i + cellSizeBounds.min,
)

export function SwitchPalette(props: {
  palette: string
  onChange: (v: string) => void
}) {
  return (
    <Shadcn.Button
      variant="outline"
      size="icon-lg"
      style={{ color: 'var(--accent-deep)' }}
      onClick={() => props.onChange(randomPalette(props.palette))}
    >
      <i className="i-lucide-paintbrush text-base" />
    </Shadcn.Button>
  )
}

export function SelectCellSize(props: {
  size: number
  onChange: (v: number) => void
}) {
  const [open, setOpen] = useState(false)
  const items = cellSizeItems

  function handleOpenChange(open: boolean) {
    setOpen(open)
    if (open) {
      requestAnimationFrame(() => {
        const popup = document.querySelector<HTMLElement>(
          '[data-slot="dropdown-menu-content"]',
        )
        const checked = popup?.querySelector<HTMLElement>('[data-checked]')
        if (checked) {
          checked.scrollIntoView({ block: 'nearest' })
        }
      })
    }
  }

  return (
    <Shadcn.DropdownMenu open={open} onOpenChange={handleOpenChange}>
      <Shadcn.DropdownMenuTrigger
        render={
          <Shadcn.Button size="icon-lg" variant="outline">
            <i className="i-lucide-ruler text-base" />
          </Shadcn.Button>
        }
      />
      <Shadcn.DropdownMenuContent className="max-h-48 min-w-20">
        <Shadcn.DropdownMenuRadioGroup
          value={String(props.size)}
          onValueChange={v => {
            if (v) {
              props.onChange(Number(v))
              setOpen(false)
            }
          }}
        >
          {items.map(item => (
            <Shadcn.DropdownMenuRadioItem
              key={item}
              value={String(item)}
              className="font-mono"
            >
              {item}
            </Shadcn.DropdownMenuRadioItem>
          ))}
        </Shadcn.DropdownMenuRadioGroup>
      </Shadcn.DropdownMenuContent>
    </Shadcn.DropdownMenu>
  )
}

export function ToggleFlagMode(props: {
  checked: boolean
  onChange: (v: boolean) => void
}) {
  if (!isTouchDevice()) return

  return (
    <Shadcn.Field orientation="horizontal">
      <Shadcn.Checkbox
        id="flag-mode"
        className="border-foreground/20"
        checked={props.checked}
        onCheckedChange={v => props.onChange(v)}
      />
      <Shadcn.Label htmlFor="flag-mode" className="py-2">
        插旗优先
      </Shadcn.Label>
    </Shadcn.Field>
  )
}

export function SelectDifficulty(props: {
  boardConfig: BoardConfig
  onChange: (v: BoardConfig) => void
  onSelectCustom?: () => void
}) {
  const { boardConfig, onChange, onSelectCustom } = props

  const customItem = { value: 'custom', label: '自定义' }
  const currentItem = findDifficulty(boardConfig) || customItem

  function handleSelectChange(value: string | null) {
    if (!value) return

    if (value === 'custom') {
      onSelectCustom?.()
      return
    }

    if (value === currentItem.value) return

    const matched = findDifficulty(value)
    if (matched) {
      const nextValue = { w: matched.w, h: matched.h, m: matched.m }
      onChange(nextValue)
    }
  }

  return (
    <Shadcn.Select value={currentItem.value} onValueChange={handleSelectChange}>
      <Shadcn.SelectTrigger className="w-24">
        {currentItem.label}
      </Shadcn.SelectTrigger>
      <Shadcn.SelectContent>
        <Shadcn.SelectGroup>
          {difficulties.map(item => (
            <Shadcn.SelectItem
              key={item.value}
              value={item.value}
              className="h-8"
            >
              <span className="w-10">{item.label}</span>
              <span className="text-muted-foreground pl-1 font-mono tracking-wider">
                {item.w}x{item.h}
              </span>
            </Shadcn.SelectItem>
          ))}
          {props.onSelectCustom && (
            <Shadcn.SelectItem value={customItem.value} className="h-8">
              <span className="w-10">{customItem.label}</span>
              {currentItem.value === 'custom' && (
                <span className="text-muted-foreground pl-1 font-mono tracking-wider">
                  {boardConfig.w}x{boardConfig.h}
                </span>
              )}
            </Shadcn.SelectItem>
          )}
        </Shadcn.SelectGroup>
      </Shadcn.SelectContent>
    </Shadcn.Select>
  )
}
