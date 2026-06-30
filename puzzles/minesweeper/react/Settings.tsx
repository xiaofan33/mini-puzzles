import { Shadcn } from '@/components/ui'
import { isTouchDevice } from '@/lib/utils'
import { findDifficulty, randomPalette } from '../utils'
import type { BoardConfig } from '../model'
import { difficulties } from '../assets/config.json'

export function SwitchPalette(props: {
  palette: string
  onChange: (v: string) => void
}) {
  return (
    <Shadcn.Button
      variant="ghost"
      size="icon-lg"
      style={{ color: 'var(--accent-deep)' }}
      onClick={() => props.onChange(randomPalette(props.palette))}
    >
      <i className="i-lucide-paintbrush text-base" />
    </Shadcn.Button>
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
